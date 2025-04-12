/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'infura-ipfs.io',
      'ipfs.io',
      'gateway.pinata.cloud',
      'nftstorage.link',
      'cloudflare-ipfs.com'
    ],
  },
};

module.exports = nextConfig
