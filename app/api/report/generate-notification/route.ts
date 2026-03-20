import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = currentUser.id;

        // 1. Check if a report notification was already sent in the last 7 days
        const now = new Date();
        const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const { data: existingNotifs } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'weekly_report')
            .gte('created_at', pastWeek.toISOString())
            .limit(1);

        if (existingNotifs && existingNotifs.length > 0) {
            return NextResponse.json({ message: 'Already sent recently' });
        }

        // 2. We need to generate the report to get the rating
        // Get question attempts
        const { data: attempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct, created_at')
            .eq('user_id', userId)
            .gte('created_at', pastWeek.toISOString());

        // Get activity
        let activities: any[] = [];
        try {
            const res = await supabaseAdmin
                .from('activity_logs')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', pastWeek.toISOString());
            if (!res.error) activities = res.data || [];
        } catch (e) {
            // Ignore if missing
        }

        // Calculate
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

        let ratingLabel = 'Poor';
        if (totalScore >= 80) ratingLabel = 'Excellent';
        else if (totalScore >= 60) ratingLabel = 'Very Good';
        else if (totalScore >= 40) ratingLabel = 'Good';
        else if (totalScore >= 20) ratingLabel = 'Not Bad';

        // 3. Create the Notification
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title: 'Weekly Report Card 📊',
                message: `Your weekly report is ready! You scored '${ratingLabel}' this week. Tap to view your stats.`,
                type: 'weekly_report',
                link: '/report'
            });

        return NextResponse.json({ success: true, rating: ratingLabel });

    } catch (err: any) {
        console.error('[Weekly Report Gen Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
