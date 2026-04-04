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

// Build the runtime Supabase URL. 
// On the backend (Vercel), use the real URL.
// On the frontend (Browser/App WebView), use our custom proxy to bypass ISP blocks (like Jio 5G)
const realSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://127.0.0.1';
const isBrowser = typeof window !== 'undefined';
const isNative = isBrowser && !!(window as any).Capacitor?.isNativePlatform?.();
const proxyBaseUrl = isNative 
  ? (process.env.NEXT_PUBLIC_APP_URL || 'https://manthan-beta-c975.vercel.app')
  : (isBrowser ? window.location.origin : '');

const supabaseRuntimeUrl = isBrowser
  ? `${proxyBaseUrl}/api/supabase-proxy`
  : realSupabaseUrl;

// Polyfill for Blob.arrayBuffer() for older mobile browsers
if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(this as Blob);
    });
  };
}

export const supabase = createClient(supabaseRuntimeUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    // Override the NavigatorLock to avoid 10s timeout in browsers with MetaMask/other extensions
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
      return fn();
    },
  },
})

