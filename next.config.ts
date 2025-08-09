import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
