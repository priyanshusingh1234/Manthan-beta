import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';
// Hobby plan max is 10s — we keep everything parallel to stay well under that.
export const maxDuration = 10;

function startOfUtcWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function getRatingLabel(totalScore: number) {
  if (totalScore >= 80) return 'Excellent';
  if (totalScore >= 60) return 'Very Good';
  if (totalScore >= 40) return 'Good';
  if (totalScore >= 20) return 'Not Bad';
  return 'Poor';
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('[WeeklyCron] Triggered. Secret configured:', !!cronSecret);

  // Vercel Hobby injects the secret automatically; enforce it if set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[WeeklyCron] Unauthorized — header mismatch.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentWeekStart = startOfUtcWeek(now);
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── 1. Fetch all data in PARALLEL ─────────────────────────────────
    const [attemptsRes, activitiesRes] = await Promise.all([
      supabaseAdmin
        .from('question_attempts')
        .select('user_id, is_correct, created_at')
        .gte('created_at', previousWeekStart.toISOString())
        .lt('created_at', currentWeekStart.toISOString()),
      supabaseAdmin
        .from('activity_logs')
        .select('user_id, created_at')
        .gte('created_at', previousWeekStart.toISOString())
        .lt('created_at', currentWeekStart.toISOString())
        .then(r => r), // graceful — ignore if table missing
    ]);

    const attempts = attemptsRes.data || [];
    const activities = (activitiesRes as any)?.data || [];

    // ── 2. Build per-user maps ─────────────────────────────────────────
    const userIds = new Set<string>();
    const attemptsByUser = new Map<string, any[]>();
    const activityByUser = new Map<string, any[]>();

    for (const a of attempts) {
      const key = String(a.user_id);
      userIds.add(key);
      if (!attemptsByUser.has(key)) attemptsByUser.set(key, []);
      attemptsByUser.get(key)!.push(a);
    }
    for (const a of activities) {
      const key = String(a.user_id);
      userIds.add(key);
      if (!activityByUser.has(key)) activityByUser.set(key, []);
      activityByUser.get(key)!.push(a);
    }

    console.log(`[WeeklyCron] Active users: ${userIds.size}`);

    if (userIds.size === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active users for previous week.' });
    }

    const idList = Array.from(userIds);

    // ── 3. Dedup check — already notified this week ────────────────────
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('type', 'weekly_report')
      .gte('created_at', currentWeekStart.toISOString())
      .in('user_id', idList);

    const alreadySent = new Set((existing || []).map((e: any) => String(e.user_id)));

    // ── 4. Fire ALL notifications in PARALLEL (critical for Hobby 10s limit) ──
    const tasks = idList
      .filter(userId => !alreadySent.has(userId))
      .map(async (userId) => {
        const ua = attemptsByUser.get(userId) || [];
        const ac = activityByUser.get(userId) || [];

        const allTimestamps = [
          ...ua.map((x: any) => x.created_at),
          ...ac.map((x: any) => x.created_at),
        ];
        const activeDays = new Set(allTimestamps.map((ts: string) => new Date(ts).toISOString().split('T')[0])).size;

        const totalAttempts = ua.length;
        const correctAttempts = ua.filter((x: any) => !!x.is_correct).length;
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
        const totalScore =
          (totalAttempts > 0 ? (accuracy / 100) * 40 : 0) +
          Math.min(totalAttempts * 2, 40) +
          Math.min(activeDays * 4, 20);

        const label = getRatingLabel(totalScore);
        console.log(`[WeeklyCron] → ${userId} score=${Math.round(totalScore)} (${label})`);

        await createNotification({
          userId,
          type: 'weekly_report',
          title: '📊 Weekly Report Card Ready!',
          body: `You rated ${label} this week! Tap to see your full breakdown vs last week.`,
          href: '/report',
        });

        return userId;
      });

    const results = await Promise.allSettled(tasks);
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[WeeklyCron] ✅ Sent=${sent} ❌ Failed=${failed}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      evaluatedUsers: idList.length,
      weekStart: previousWeekStart.toISOString(),
      weekEnd: currentWeekStart.toISOString(),
    });

  } catch (error: any) {
    console.error('[WeeklyCron] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
