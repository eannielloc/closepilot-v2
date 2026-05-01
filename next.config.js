/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@vercel/blob'],
    instrumentationHook: true,
  },
  output: 'standalone',
}
module.exports = nextConfig
