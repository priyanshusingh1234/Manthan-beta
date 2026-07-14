import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use a fresh client here so we can optionally use the service role if needed,
// but for reading a public config, anon key is fine if RLS allows it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to fetch from app_config table
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('Error fetching app_config:', error);
      // Fallback to defaults if table doesn't exist yet
      return NextResponse.json({
        min_android_version: 118, // versionCode 118 = 1.1.8
        force_update: false,
      });
    }

    if (data) {
      return NextResponse.json({
        min_android_version: data.min_android_version || 118,
        force_update: data.force_update || false,
      });
    }

    // Default configuration if the row is missing
    return NextResponse.json({
      min_android_version: 118,
      force_update: false,
    });
  } catch (error) {
    console.error('Exception fetching app_config:', error);
    return NextResponse.json({
      min_android_version: 118,
      force_update: false,
    }, { status: 500 });
  }
}
