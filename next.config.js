/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@vercel/blob'],
    instrumentationHook: true,
  },
  // No `output: 'standalone'` — Vercel and Railway both prefer the regular
  // `next start` server. Standalone trims node_modules but requires copying
  // public/ and .next/static/ alongside server.js, which adds fragility for
  // marginal benefit at this scale.
}
module.exports = nextConfig
