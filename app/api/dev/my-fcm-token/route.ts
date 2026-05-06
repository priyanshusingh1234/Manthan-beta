import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/dev/my-fcm-token — returns the current user's native FCM token
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: sub } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint')
    .eq('user_id', user.id)
    .eq('p256dh_key', 'native')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ token: sub?.endpoint || null });
}
