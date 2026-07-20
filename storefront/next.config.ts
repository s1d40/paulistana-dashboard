/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for production deployment
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },

  // Production env
  env: {
    NEXT_PUBLIC_STORE_DOMAIN: 'paulistanaemporio.com',
  },
};

export default nextConfig;
