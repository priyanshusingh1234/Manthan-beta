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

const customFetch = (url: URL | RequestInfo, options?: RequestInit) => {
  let urlStr = url.toString();
  const realSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // We only proxy requests when running in the browser.
  // The Vercel Node backend operates perfectly fine and isn't affected by Jio.
  if (typeof window !== 'undefined' && realSupabaseUrl && urlStr.startsWith(realSupabaseUrl)) {
    // Realtime WebSockets cannot be dynamically proxied through standard HTTP API routes easily
    if (!urlStr.includes('/realtime/v1/')) {
      urlStr = urlStr.replace(realSupabaseUrl, '/api/supabase-proxy');
    }
  }
  return fetch(urlStr, options);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    // Override the NavigatorLock to avoid 10s timeout in browsers with MetaMask/other extensions
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
      return fn();
    },
  },
})

