/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
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
