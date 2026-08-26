const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Trace from the monorepo root so the standalone bundle includes hoisted
  // node_modules and workspace packages. server.js lands at apps/frontend/server.js.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    domains: ['cdn.civicops.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.civicops.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
