import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/streak-reminder
 * Trigger this daily (e.g., 7 PM IST) via a Cron Job (Vercel, Cron-job.org, etc.)
 */
export async function GET(req: NextRequest) {
    try {
        // Simple security check to prevent public Spam (use a secret header)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const todayStr = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now).split('/').reverse().join('-');

        console.log(`[Cron] Starting Streak Reminder for ${todayStr}...`);

        // 1. Fetch scholars who have a streak but HAVEN'T finished today
        // We only remind people who have something to lose (streak_count > 0)
        const { data: riskyScholars, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, streak_count, last_streak_at, daily_solved')
            .gt('streak_count', 0)
            .neq('last_streak_at', todayStr)
            .limit(500); // Batch for safety

        if (error) throw error;
        if (!riskyScholars || riskyScholars.length === 0) {
            return NextResponse.json({ message: 'No scholars need a reminder today.' });
        }

        console.log(`[Cron] Found ${riskyScholars.length} scholars at risk of losing their fire.`);

        // 2. Blast Reminders
        for (const s of riskyScholars) {
            const goal = (Number(s.streak_count) || 0) + 1;
            const remaining = goal - (Number(s.daily_solved) || 0);

            await createNotification({
                userId: s.id,
                type: 'points_earned', // High-engagment type
                title: '⚠️ Your Sage Fire is Fading!',
                body: `Don't lose your Day ${s.streak_count} Streak! You need ${remaining} more correct solve${remaining > 1 ? 's' : ''} today.`,
                href: '/streaks'
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sent reminders to ${riskyScholars.length} scholars.`,
            today: todayStr
        });

    } catch (err: any) {
        console.error('[Cron Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
