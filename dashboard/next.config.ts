import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/conversor-backend/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
