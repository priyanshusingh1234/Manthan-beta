import { createClient } from '@supabase/supabase-js'

// Use placeholder values only for build purposes (when neither var is set)
// This allows the build to succeed in CI/CD and for public repos
const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Enhanced validation with detailed warnings
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase configuration incomplete:');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('  - NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('  - NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
  console.warn('  Authentication features will not work properly.');
  
  if (isBuildTime) {
    console.warn('  Using placeholder values for build purposes.');
  } else {
    console.error('  ❌ Application is running with incomplete Supabase configuration!');
  }
} else {
  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    if (!url.hostname.includes('supabase')) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
    } else {
      console.log('✓ Supabase client initialized successfully');
      console.log('  URL:', url.hostname);
    }
  } catch {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format:', supabaseUrl);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
