import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const cache = join(root, ".npm-cache");
await mkdir(cache, { recursive: true });
const fixture = await mkdtemp(join(cache, "consumer-"));

try {
  // Match npm's actual publish list, including its automatic exclusions.
  const packs = JSON.parse(execFileSync(process.execPath, [process.env.npm_execpath, "pack", "--dry-run", "--json", "--cache", cache], { cwd: root, encoding: "utf8" }));
  const [pack] = Array.isArray(packs) ? packs : Object.values(packs);
  const packageRoot = join(fixture, "node_modules", "lamaui");
  for (const { path } of pack.files) {
    const destination = join(packageRoot, path);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(root, path), destination);
  }
  await cp(join(root, "tests", "fixtures", "package-consumer", "src"), join(fixture, "src"), { recursive: true });
  await cp(join(root, "tests", "fixtures", "package-consumer", "astro.config.mjs"), join(fixture, "astro.config.mjs"));
  await writeFile(join(fixture, "package.json"), JSON.stringify({ name: "lamaui-consumer", private: true, type: "module" }));

  // Running inside the fixture prevents Tailwind from accidentally discovering
  // library recipes through the repository's own source tree.
  execFileSync(process.execPath, [join(root, "node_modules", "astro", "bin", "astro.mjs"), "build"], { cwd: fixture, stdio: "inherit" });
  const assets = join(fixture, "dist", "_astro");
  const styles = (await Promise.all((await readdir(assets)).filter((name) => name.endsWith(".css")).map((name) => readFile(join(assets, name), "utf8")))).join("\n");
  assert.ok(styles.includes(":not(.lamaui-sm)"), "Published CSS must discover shared control recipes");
  assert.ok(styles.includes(".bg-accent"), "Published CSS must include component color utilities");
  console.log("Published package consumer built with shared Tailwind recipes.");
} finally {
  // Only remove this run's generated fixture under the workspace cache.
  if (dirname(fixture) !== cache || !fixture.startsWith(join(cache, "consumer-"))) throw new Error(`Unexpected fixture path: ${fixture}`);
  await rm(fixture, { recursive: true, force: true });
}
