/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-auth", "better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "70mb",
    },
  },
};

module.exports = nextConfig;
