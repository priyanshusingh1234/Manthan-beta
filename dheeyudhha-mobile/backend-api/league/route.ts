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

async function ensureMonthReset(userId: string, currentMonth: string, currentPts: number, storedMonth: string | null) {
  if (storedMonth === currentMonth) return currentPts;
  // NULL storedMonth = column just added, no penalty — just initialize to 0
  const resetPts = storedMonth === null ? 0 : getResetPoints(currentPts);
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points, monthly_points_month, total_points')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const monthlyPts = await ensureMonthReset(user.id, currentMonth, profile.monthly_points || 0, profile.monthly_points_month);
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
      .eq('monthly_points_month', currentMonth)
      .gte('monthly_points', userLeague.min)
      .lte('monthly_points', userLeague.max === Infinity ? 99999 : userLeague.max)
      .gt('monthly_points', monthlyPts);
    const leagueRank = (leagueHigher ?? 0) + 1;

    // ── League leaderboard: users in same league, monthly_points + total_points tiebreaker ──
    const leagueMin = userLeague.min;
    const leagueMax = userLeague.max === Infinity ? 99999 : userLeague.max;

    // Get users whose monthly_points_month matches (active this month) OR who have 0/null (unstarted = Scholar)
    let leaderboardQuery = supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, monthly_points, total_points')
      .eq('is_teacher', false)
      .not('full_name', 'is', null);

    if (userLeague.min === 0) {
      // Scholar: include users active this month, OR users who have 0/null points regardless of month
      leaderboardQuery = leaderboardQuery
        .lte('monthly_points', leagueMax)
        .or(`monthly_points_month.eq.${currentMonth},monthly_points.eq.0,monthly_points.is.null`);
    } else {
      leaderboardQuery = leaderboardQuery
        .eq('monthly_points_month', currentMonth)
        .gte('monthly_points', leagueMin)
        .lte('monthly_points', leagueMax);
    }

    const { data: leaderboard } = await leaderboardQuery
      .order('monthly_points', { ascending: false })
      .order('total_points', { ascending: false })
      .limit(25);

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
      friends = (data || []).map((f: any) => ({
        ...f,
        monthly_points: f.monthly_points_month === currentMonth ? (f.monthly_points || 0) : getResetPoints(f.monthly_points || 0),
      }));
    }

    return NextResponse.json({
      monthlyPts,
      leagueRank,
      globalRank,
      currentMonth,
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
