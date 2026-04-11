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

    const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !authUser?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const blockedIds = getBlockedIds(authUser.user.user_metadata || {});
    return NextResponse.json({ blockedIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load blocked users' }, { status: 500 });
  }
}
