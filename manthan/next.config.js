/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: ['placehold.co'],
  },
}

module.exports = nextConfig
