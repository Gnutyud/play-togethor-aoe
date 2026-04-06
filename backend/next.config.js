/** @type {import('next').NextConfig} */
const nextConfig = {
  // API routes configuration
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
