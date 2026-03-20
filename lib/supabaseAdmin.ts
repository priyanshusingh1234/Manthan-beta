import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !serviceKey) {
  // Intentionally warn; APIs will fallback to file storage when admin client is not configured
  console.warn('Supabase admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY to enable DB persistence.');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

export default supabaseAdmin;
