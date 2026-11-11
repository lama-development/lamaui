import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const normalize = (path) => relative(root, path).split(sep).join("/");
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const config = JSON.parse(await readFile(join(root, "tsconfig.json"), "utf8"));
const aliases = Object.keys(config.compilerOptions.paths).map((alias) => alias.replace(/\*$/, ""));

async function filesWithin(path) {
  if ((await stat(path)).isFile()) return [path];
  const entries = await readdir(path, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => filesWithin(join(path, entry.name))))).flat();
}

// Validate the publish manifest, including helpers, icons, types and styles.
const packagedFiles = new Set((await Promise.all(manifest.files.map((path) => filesWithin(join(root, path))))).flat());
const publicFiles = [...packagedFiles].filter((path) => /\.(astro|ts|css)$/.test(path));
const componentFiles = publicFiles
  .filter((path) => path.endsWith(".astro"))
  .map((path) => `./${relative(join(root, "src"), path).split(sep).join("/")}`)
  .sort();
const index = await readFile(join(root, "src", "index.ts"), "utf8");
const exportedFiles = Array.from(index.matchAll(/export \{ default as \w+ \} from "(\.\/components\/[^"]+\.astro)";/g), (match) => match[1]).sort();

if (JSON.stringify(componentFiles) !== JSON.stringify(exportedFiles)) {
  const missing = componentFiles.filter((file) => !exportedFiles.includes(file));
  const stale = exportedFiles.filter((file) => !componentFiles.includes(file));
  throw new Error(`Package exports are out of sync. Missing: ${missing.join(", ") || "none"}. Stale: ${stale.join(", ") || "none"}.`);
}

const problems = [];
for (const file of publicFiles) {
  const source = await readFile(file, "utf8");
  // Include side-effect/dynamic imports and CSS dependencies; strip Vite queries.
  const imports = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|@(?:import|source)\s*|url\(\s*)["']([^"']+)["']/g;
  for (const [, specifier] of source.matchAll(imports)) {
    if (aliases.some((alias) => specifier === alias || specifier.startsWith(alias.endsWith("/") ? alias : `${alias}/`))) {
      problems.push(`${normalize(file)} uses documentation alias ${specifier}`);
      continue;
    }
    if (!specifier.startsWith(".")) continue;
    const target = resolve(dirname(file), specifier.split("?")[0]);
    const candidates = [target, ...[".ts", ".astro", ".css", "/index.ts"].map((suffix) => target + suffix)];
    const included = candidates.some((candidate) => packagedFiles.has(candidate)) || [...packagedFiles].some((path) => path.startsWith(`${target}${sep}`));
    if (!included) problems.push(`${normalize(file)} references unpackaged file ${specifier}`);
  }
}

const globalStyles = await readFile(join(root, "src", "styles", "global.css"), "utf8");
for (const source of ["../components", "../lib/styles.ts"]) {
  if (!globalStyles.includes(`@source "${source}";`)) problems.push(`Register ${source} for Tailwind package class discovery`);
}
if (problems.length) throw new Error(`Package boundaries failed:\n${problems.join("\n")}`);
console.log(`Validated ${componentFiles.length} component exports and ${publicFiles.length} packaged source files.`);
