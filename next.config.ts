import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
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
