// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,         // CRITICAL: Pitfall 1 must be caught in dev (RESEARCH §15.1)
};

export default nextConfig;
