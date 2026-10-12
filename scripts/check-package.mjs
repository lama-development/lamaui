import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const componentsRoot = join(root, "src", "components");
const publicDirectories = ["data-display", "feedback", "forms", "layout", "navigation", "overlays", "ui"];

const componentFiles = (await Promise.all(publicDirectories.map(async (directory) => (await readdir(join(componentsRoot, directory), { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".astro")).map((entry) => `./components/${directory}/${entry.name}`)))).flat().sort();

const index = await readFile(join(root, "src", "index.ts"), "utf8");
const exportedFiles = Array.from(index.matchAll(/export \{ default as [A-Za-z]+ \} from "(\.\/components\/[^"]+\.astro)";/g), (match) => match[1]).sort();

if (JSON.stringify(componentFiles) !== JSON.stringify(exportedFiles)) {
  const missing = componentFiles.filter((file) => !exportedFiles.includes(file));
  const stale = exportedFiles.filter((file) => !componentFiles.includes(file));
  throw new Error(`Package exports are out of sync. Missing: ${missing.join(", ") || "none"}. Stale: ${stale.join(", ") || "none"}.`);
}

const scriptNames = (await readdir(join(root, "src", "scripts"))).filter((name) => name.endsWith(".ts") && !["catalog.ts", "component-guide.ts", "docs-search.ts", "navbar-scroll.ts"].includes(name));
const publicFiles = [...componentFiles.map((path) => join(root, "src", path.slice(2))), join(root, "src", "index.ts"), join(root, "src", "lib", "accents.ts"), join(root, "src", "lib", "classes.ts"), join(root, "src", "lib", "styles.ts"), ...scriptNames.map((name) => join(root, "src", "scripts", name))];

const aliasLeaks = [];
for (const file of publicFiles) {
  const source = await readFile(file, "utf8");
  if (source.includes('"@/') || source.includes("'@/")) aliasLeaks.push(relative(root, file).split(sep).join("/"));
}

if (aliasLeaks.length) throw new Error(`Public package files must use relative imports: ${aliasLeaks.join(", ")}`);

console.log(`Validated ${componentFiles.length} component exports and ${publicFiles.length} public source files.`);
