/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@vercel/blob'],
  },
  output: 'standalone',
}
module.exports = nextConfig
