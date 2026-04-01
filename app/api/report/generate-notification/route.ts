import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

async function getVerifiedUser(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

function startOfUtcWeek(date: Date) {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0=Sun
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

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = currentUser.id;
        const body = await req.json().catch(() => ({}));
        const force = !!body?.force;

        const now = new Date();
        const currentWeekStart = startOfUtcWeek(now);
        const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        const windowStart = force
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : previousWeekStart;
        const windowEnd = force ? now : currentWeekStart;

        // Ensure one weekly report notification per report window unless force=true
        if (!force) {
            const { data: existingNotifs } = await supabaseAdmin
                .from('notifications')
                .select('id')
                .eq('user_id', userId)
                .eq('type', 'weekly_report')
                .gte('created_at', windowEnd.toISOString())
                .limit(1);

            if (existingNotifs && existingNotifs.length > 0) {
                return NextResponse.json({ message: 'Already sent for this week' });
            }
        }

        // Generate the report rating for the chosen window
        const { data: attempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct, created_at')
            .eq('user_id', userId)
            .gte('created_at', windowStart.toISOString())
            .lt('created_at', windowEnd.toISOString());

        let activities: any[] = [];
        try {
            const res = await supabaseAdmin
                .from('activity_logs')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', windowStart.toISOString())
                .lt('created_at', windowEnd.toISOString());
            if (!res.error) activities = res.data || [];
        } catch (e) {
            // Table may not exist in all environments; ignore.
        }

        const allTimestamps = [
            ...(attempts || []).map(a => a.created_at),
            ...activities.map(a => a.created_at)
        ];

        const activeDaysSet = new Set(allTimestamps.map(ts => new Date(ts).toISOString().split('T')[0]));
        const activeDays = activeDaysSet.size;

        const totalAttempts = (attempts || []).length;
        if (totalAttempts === 0 && activeDays === 0) {
            // If completely inactive, do not spam them with a report
            // However, for testing, we could send it anyway. Let's send a gentle nudge if 0.
            // Or actually, 0 points is Poor. It's better to send it anyway so they remember the app.
        }

        const correctAttempts = (attempts || []).filter(a => a.is_correct).length;
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        const accuracyScore = totalAttempts > 0 ? (accuracy / 100) * 40 : 0;
        const volumeScore = Math.min(totalAttempts * 2, 40);
        const consistencyScore = Math.min(activeDays * 4, 20);
        const totalScore = accuracyScore + volumeScore + consistencyScore;
        const ratingLabel = getRatingLabel(totalScore);

        await createNotification({
            userId,
            type: 'weekly_report',
            title: 'Weekly Report Card Ready',
            body: `You scored ${ratingLabel} this week. Tap to view your full report.`,
            href: '/report',
        });

        return NextResponse.json({
            success: true,
            rating: ratingLabel,
            windowStart: windowStart.toISOString(),
            windowEnd: windowEnd.toISOString(),
            forced: force,
        });

    } catch (err: any) {
        console.error('[Weekly Report Gen Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
