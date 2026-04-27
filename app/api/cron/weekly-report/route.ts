import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
  console.log('[WeeklyCron] Auth header present:', !!authHeader);

  // If CRON_SECRET is set, enforce it. If not set, allow through (dev/manual trigger).
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[WeeklyCron] Unauthorized — header mismatch.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentWeekStart = startOfUtcWeek(now);
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: attempts } = await supabaseAdmin
      .from('question_attempts')
      .select('user_id, is_correct, created_at')
      .gte('created_at', previousWeekStart.toISOString())
      .lt('created_at', currentWeekStart.toISOString());

    let activities: any[] = [];
    try {
      const res = await supabaseAdmin
        .from('activity_logs')
        .select('user_id, created_at')
        .gte('created_at', previousWeekStart.toISOString())
        .lt('created_at', currentWeekStart.toISOString());
      if (!res.error) activities = res.data || [];
    } catch {
      activities = [];
    }

    const userIds = new Set<string>();
    (attempts || []).forEach((a: any) => userIds.add(String(a.user_id)));
    (activities || []).forEach((a: any) => userIds.add(String(a.user_id)));

    console.log(`[WeeklyCron] Active users found: ${userIds.size}`);

    if (userIds.size === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active users for previous week.' });
    }

    const idList = Array.from(userIds);

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('type', 'weekly_report')
      .gte('created_at', currentWeekStart.toISOString())
      .in('user_id', idList);

    const alreadySent = new Set((existing || []).map((e: any) => String(e.user_id)));

    const attemptsByUser = new Map<string, any[]>();
    for (const a of attempts || []) {
      const key = String(a.user_id);
      if (!attemptsByUser.has(key)) attemptsByUser.set(key, []);
      attemptsByUser.get(key)!.push(a);
    }

    const activityByUser = new Map<string, any[]>();
    for (const a of activities || []) {
      const key = String(a.user_id);
      if (!activityByUser.has(key)) activityByUser.set(key, []);
      activityByUser.get(key)!.push(a);
    }

    let sent = 0;

    for (const userId of idList) {
      if (alreadySent.has(userId)) continue;

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
      const accuracyScore = totalAttempts > 0 ? (accuracy / 100) * 40 : 0;
      const volumeScore = Math.min(totalAttempts * 2, 40);
      const consistencyScore = Math.min(activeDays * 4, 20);
      const totalScore = accuracyScore + volumeScore + consistencyScore;

      console.log(`[WeeklyCron] Sending notification to userId=${userId}, score=${Math.round(totalScore)}, rating=${getRatingLabel(totalScore)}`);
      try {
        await createNotification({
          userId,
          type: 'weekly_report',
          title: '📊 Weekly Report Card Ready!',
          body: `You rated ${getRatingLabel(totalScore)} this week! Tap to see your full breakdown vs last week.`,
          href: '/report',
        });
        sent += 1;
        console.log(`[WeeklyCron] ✅ Sent to ${userId}`);
      } catch (notifErr) {
        console.error(`[WeeklyCron] ❌ Failed for ${userId}:`, notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      evaluatedUsers: idList.length,
      weekStart: currentWeekStart.toISOString(),
      weekEnd: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Weekly Report] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
