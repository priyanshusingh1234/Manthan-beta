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

export async function POST(req: NextRequest) {
  try {
    const userId = parseJwtSub(req.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const targetUserId = String(body.targetUserId || '').trim();
    const action = body.action === 'unblock' ? 'unblock' : 'block';

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing target user' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
    }

    const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !authUser?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const meta = authUser.user.user_metadata || {};
    const blockedIds = new Set(getBlockedIds(meta));

    if (action === 'block') {
      blockedIds.add(targetUserId);
    } else {
      blockedIds.delete(targetUserId);
    }

    const nextMeta = {
      ...meta,
      blockedUserIds: Array.from(blockedIds),
    };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      blockedIds: Array.from(blockedIds),
      isBlocked: action === 'block',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update block status' }, { status: 500 });
  }
}
