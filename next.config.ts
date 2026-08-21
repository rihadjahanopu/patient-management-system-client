import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from Cloudinary and any external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },

  // Vercel deploys Next.js natively — no extra config needed.
  // NEXT_PUBLIC_API_URL must be set in Vercel Dashboard → Environment Variables
};

export default nextConfig;
