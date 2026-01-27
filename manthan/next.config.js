/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: ['placehold.co', 'ivkrupsksxibaibmiibk.supabase.co'],
  },
  // Prefer Babel fallback for this environment where SWC binary fails to load
  // Use Next's SWC compiler/minifier (recommended for Vercel)
  swcMinify: true,
}


module.exports = nextConfig
