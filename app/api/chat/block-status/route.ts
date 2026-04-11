import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function parseJwtSub(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj.sub || obj.user_id || null;
  } catch {
    return null;
  }
}

function getBlockedIds(meta: Record<string, any>) {
  const raw = meta.blockedUserIds || meta.blockedUsers || meta.blocked_ids || [];
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const userId = parseJwtSub(req.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const { data: participants, error: participantError } = await supabaseAdmin
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .neq('user_id', userId)
      .limit(1);

    if (participantError) throw participantError;

    const targetUserId = participants?.[0]?.user_id;
    if (!targetUserId) {
      return NextResponse.json({ isBlocked: false, blockedByMe: false, blockedMe: false });
    }

    const [{ data: me }, { data: them }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.auth.admin.getUserById(targetUserId),
    ]);

    const myBlockedIds = getBlockedIds(me?.user?.user_metadata || {});
    const theirBlockedIds = getBlockedIds(them?.user?.user_metadata || {});

    const blockedByMe = myBlockedIds.includes(targetUserId);
    const blockedMe = theirBlockedIds.includes(userId);

    return NextResponse.json({
      isBlocked: blockedByMe || blockedMe,
      blockedByMe,
      blockedMe,
      targetUserId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load block status' }, { status: 500 });
  }
}
