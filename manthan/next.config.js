/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: ['placehold.co', 'ivkrupsksxibaibmiibk.supabase.co'],
  },
  // Force SWC transforms and avoid native SWC minifier to use WASM on ARM
  experimental: {
    // removed forceSwcTransforms to allow native SWC where available
  },
  // Enable native SWC minification by default
  swcMinify: true,
}


module.exports = nextConfig
