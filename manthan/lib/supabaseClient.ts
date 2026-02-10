import { createClient } from '@supabase/supabase-js'

// Use minimal build-time fallbacks that allow builds to pass but will fail at runtime
// This is necessary because Next.js static generation requires valid URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://127.0.0.1'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-key'

// Validation with warnings but NO real placeholder replacement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Supabase environment variables are not configured:');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('  - NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
  console.error('  Authentication will not work. Check Vercel environment variables.');
} else {
  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    // Warn if using localhost/invalid URLs
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      console.warn('⚠️ Using localhost URL - Supabase will not work. Check environment variables.');
    } else if (url.hostname.includes('supabase')) {
      console.log('✓ Supabase client initialized:', url.hostname);
    } else {
      console.warn('⚠️ URL may not be a valid Supabase URL:', url.hostname);
    }
  } catch {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
