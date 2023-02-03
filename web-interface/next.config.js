/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

// next.config.js
module.exports = {
  ...nextConfig,
  images: {
    loader: 'akamai',
    path: '',
  },
  trailingSlash: true,
}

