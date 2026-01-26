/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: ['placehold.co'],
  },
  // Prefer Babel fallback for this environment where SWC binary fails to load
  swcMinify: false,
  experimental: {
    // Ensure Next uses the non-SWC transform path
    forceSwcTransforms: false,
  },
}


module.exports = nextConfig
