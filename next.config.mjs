// next.config.mjs
// Note: next.config.ts is not supported in Next.js 14.x; using .mjs for ESM + type safety via JSDoc

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,         // CRITICAL: Pitfall 1 must be caught in dev (RESEARCH §15.1)
};

export default nextConfig;
