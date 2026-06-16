import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "smart-life-os", "weather-dashboard", "dist");
const target = resolve(root, "smart-life-os", "public", "weather-dashboard");

await rm(target, { force: true, recursive: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

console.log(`Copied weather dashboard build to ${target}`);
