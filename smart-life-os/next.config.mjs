import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(projectRoot, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: workspaceRoot
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/weather-dashboard/:path*",
          destination: "/weather-dashboard/index.html"
        }
      ]
    };
  }
};

export default nextConfig;
