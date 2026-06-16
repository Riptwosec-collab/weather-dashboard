import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "weather-dashboard", "dist");
const target = resolve(root, "public", "weather-dashboard");
const versionTarget = resolve(root, "public", "weather-dashboard-v23");
const swKiller = `self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clientsList.map((client) => {
      if (client.url.includes("/weather-dashboard")) {
        return client.navigate("/weather-dashboard-v23?cache-cleared=1");
      }
      return undefined;
    }));
    await self.registration.unregister();
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
`;

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

await Promise.all([
  writeFile(resolve(target, "sw.js"), swKiller, "utf8"),
  writeFile(resolve(versionTarget, "sw.js"), swKiller, "utf8"),
]);

console.log(`Copied weather dashboard build to ${target}`);
console.log(`Copied cache-busting weather dashboard build to ${versionTarget}`);
