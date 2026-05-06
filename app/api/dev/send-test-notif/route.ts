import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/createNotification';
import type { NotificationType } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

// POST /api/dev/send-test-notif — sends a single test notification to the authenticated user
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, title, body } = await req.json();
  if (!type || !title || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await createNotification({
    userId: user.id,
    type: type as NotificationType,
    title,
    body,
    href: '/',
    actorName: 'Test',
    actorAvatar: user.user_metadata?.avatar_url || undefined,
  });

  return NextResponse.json({ ok: true });
}
