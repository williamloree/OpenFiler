/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-auth", "better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "70mb",
    },
  },
};

module.exports = nextConfig;
