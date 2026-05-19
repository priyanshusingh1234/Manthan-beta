import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { getLeague, getMonthKey, getResetPoints } from '@/lib/leagues';

export const dynamic = 'force-dynamic';

async function getUser(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error } = await anon.auth.getUser(token);
    return error ? null : user;
  } catch { return null; }
}

// Auto-reset monthly_points if month has changed
async function ensureMonthReset(userId: string, currentMonth: string, currentPts: number, storedMonth: string | null) {
  if (storedMonth === currentMonth) return currentPts;
  // Month changed — reset
  const resetPts = getResetPoints(currentPts);
  await supabaseAdmin.from('profiles').update({
    monthly_points: resetPts,
    monthly_points_month: currentMonth
  }).eq('id', userId);
  return resetPts;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req.headers.get('authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentMonth = getMonthKey();

    // Fetch current user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month, total_points')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Handle monthly reset
    const monthlyPts = await ensureMonthReset(user.id, currentMonth, profile.monthly_points || 0, profile.monthly_points_month);
    const userLeague = getLeague(monthlyPts);

    // Rank in current league: count how many users have more monthly_points in same league
    const { count: higherCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('monthly_points_month', currentMonth)
      .gte('monthly_points', userLeague.min)
      .lte('monthly_points', userLeague.max === Infinity ? 99999 : userLeague.max)
      .gt('monthly_points', monthlyPts);

    const rank = (higherCount ?? 0) + 1;

    // Leaderboard: top 20 in user's league
    const { data: leaderboard } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points')
      .eq('monthly_points_month', currentMonth)
      .gte('monthly_points', userLeague.min)
      .lte('monthly_points', userLeague.max === Infinity ? 99999 : userLeague.max)
      .order('monthly_points', { ascending: false })
      .limit(20);

    // Friends leagues (people I follow)
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const friendIds = (following || []).map(f => f.following_id).slice(0, 20);

    let friends: any[] = [];
    if (friendIds.length) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month')
        .in('id', friendIds)
        .order('monthly_points', { ascending: false });
      friends = (data || []).map(f => ({
        ...f,
        monthly_points: f.monthly_points_month === currentMonth ? (f.monthly_points || 0) : getResetPoints(f.monthly_points || 0),
      }));
    }

    return NextResponse.json({
      monthlyPts,
      rank,
      currentMonth,
      leaderboard: leaderboard || [],
      friends,
      userId: user.id,
    });
  } catch (err: any) {
    console.error('[League API]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
