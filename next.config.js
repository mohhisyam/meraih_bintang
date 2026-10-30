/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};
module.exports = nextConfig;
