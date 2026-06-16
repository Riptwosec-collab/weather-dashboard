import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "weather-dashboard", "dist");
const target = resolve(root, "public", "weather-dashboard");
const versionTarget = resolve(root, "public", "weather-dashboard-v23");

await rm(target, { force: true, recursive: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

await rm(versionTarget, { force: true, recursive: true });
await mkdir(versionTarget, { recursive: true });
await cp(source, versionTarget, { recursive: true });

const versionIndex = resolve(versionTarget, "index.html");
const indexHtml = await readFile(versionIndex, "utf8");
await writeFile(
  versionIndex,
  indexHtml.replaceAll("/weather-dashboard/", "/weather-dashboard-v23/"),
  "utf8",
);

async function rewriteVersionBase(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteVersionBase(entryPath);
      return;
    }

    if (!/\.(html|js|css|json|webmanifest)$/.test(entry.name)) return;
    const content = await readFile(entryPath, "utf8");
    const rewritten = content.replaceAll("/weather-dashboard/", "/weather-dashboard-v23/");
    if (rewritten !== content) {
      await writeFile(entryPath, rewritten, "utf8");
    }
  }));
}

await rewriteVersionBase(versionTarget);

console.log(`Copied weather dashboard build to ${target}`);
console.log(`Copied cache-busting weather dashboard build to ${versionTarget}`);
