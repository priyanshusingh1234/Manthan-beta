import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { getLeague, getWeekKey, getResetPoints } from '@/lib/leagues';

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

async function ensureWeekReset(userId: string, currentWeek: string, currentPts: number, storedWeek: string | null) {
  if (storedWeek === currentWeek) return currentPts;
  // NULL storedWeek = column just added, no penalty — just initialize to 0
  const resetPts = storedWeek === null ? 0 : getResetPoints(currentPts);
  await supabaseAdmin.from('profiles').update({
    monthly_points: resetPts,
    monthly_points_month: currentWeek
  }).eq('id', userId);
  return resetPts;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req.headers.get('authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentWeek = getWeekKey();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month, total_points')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const monthlyPts = await ensureWeekReset(user.id, currentWeek, profile.monthly_points || 0, profile.monthly_points_month);
    const userLeague = getLeague(monthlyPts);

    // Global rank by total_points (always meaningful)
    const { count: globalHigher } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_teacher', false)
      .gt('total_points', profile.total_points || 0);
    const globalRank = (globalHigher ?? 0) + 1;

    // League rank (by monthly_points in same league)
    const { count: leagueHigher } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('monthly_points_month', currentWeek)
      .gte('monthly_points', userLeague.min)
      .lte('monthly_points', userLeague.max === Infinity ? 99999 : userLeague.max)
      .gt('monthly_points', monthlyPts);
    const leagueRank = (leagueHigher ?? 0) + 1;

    // ── League leaderboard: users in same league, monthly_points + total_points tiebreaker ──
    // NOTE: We fetch ALL non-teacher users with a full_name, then normalize points on the fly.
    // Any user whose monthly_points_month != currentWeek is treated as 0 points for this week,
    // even if they haven't logged in yet. This ensures the leaderboard is always accurate.
    const { data: rawLeaderboard } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month, total_points')
      .eq('is_teacher', false)
      .not('full_name', 'is', null)
      .order('monthly_points', { ascending: false })
      .order('total_points', { ascending: false });

    // Normalize: anyone whose week key is stale gets 0 points for this cycle
    const normalizedAll = (rawLeaderboard || []).map((u: any) => ({
      ...u,
      monthly_points: u.monthly_points_month === currentWeek ? (u.monthly_points || 0) : 0,
    }));

    // Filter to same league as user (based on normalized points)
    const leagueMin = userLeague.min;
    const leagueMax = userLeague.max === Infinity ? 99999 : userLeague.max;
    const leaderboard = normalizedAll
      .filter((u: any) => u.monthly_points >= leagueMin && u.monthly_points <= leagueMax)
      .sort((a: any, b: any) => b.monthly_points - a.monthly_points || b.total_points - a.total_points)
      .slice(0, 25);

    // Friends
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const friendIds = (following || []).map((f: any) => f.following_id).slice(0, 30);

    let friends: any[] = [];
    if (friendIds.length) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month, total_points')
        .in('id', friendIds)
        .order('total_points', { ascending: false });
      // Always normalize friends' points too — stale week = 0
      friends = (data || []).map((f: any) => ({
        ...f,
        monthly_points: f.monthly_points_month === currentWeek ? (f.monthly_points || 0) : 0,
      }));
    }

    return NextResponse.json({
      monthlyPts,
      leagueRank,
      globalRank,
      currentMonth: currentWeek, // returning currentWeek under currentMonth for backwards compatibility in UI if needed
      leaderboard: leaderboard || [],
      friends,
      userId: user.id,
      totalPoints: profile.total_points || 0,
    });
  } catch (err: any) {
    console.error('[League API]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
