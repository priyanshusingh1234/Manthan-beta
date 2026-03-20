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

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = currentUser.id;

        // Calculate the last 7 days window
        const now = new Date();
        const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isoPastWeek = pastWeek.toISOString();

        // 1. Get question attempts from the last week
        const { data: attempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct, created_at')
            .eq('user_id', userId)
            .gte('created_at', isoPastWeek);

        // 2. Get activity logs for active days constraint (graceful fallback if table doesn't exist yet)
        let activities: any[] = [];
        try {
            const res = await supabaseAdmin
                .from('activity_logs')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', isoPastWeek);
            if (!res.error) activities = res.data || [];
        } catch (e) {
            console.warn('activity_logs table probably missing, skipping activity check.');
        }

        // Combine timestamps to calculate active days
        const allTimestamps = [
            ...(attempts || []).map(a => a.created_at),
            ...activities.map(a => a.created_at)
        ];

        const activeDaysSet = new Set(
            allTimestamps.map(ts => new Date(ts).toISOString().split('T')[0])
        );
        const activeDays = activeDaysSet.size;

        // Process Attempts
        const totalAttempts = (attempts || []).length;
        const correctAttempts = (attempts || []).filter(a => a.is_correct).length;
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        // Scoring Formula
        // Accuracy component (max 40)
        const accuracyScore = totalAttempts > 0 ? (accuracy / 100) * 40 : 0;

        // Volume component (max 40) - 2 pts per question up to 20
        const volumeScore = Math.min(totalAttempts * 2, 40);

        // Consistency component (max 20) - 4 pts per active day up to 5 days
        const consistencyScore = Math.min(activeDays * 4, 20);

        const totalScore = accuracyScore + volumeScore + consistencyScore;

        // Determine Rating Label
        let rating = 'Not Rated';
        let ratingColor = 'text-slate-500';
        let ratingMessage = 'Play more to get rated!';

        if (totalScore >= 80) {
            rating = 'Excellent';
            ratingColor = 'text-purple-500';
            ratingMessage = 'Incredible work this week! You dominated.';
        } else if (totalScore >= 60) {
            rating = 'Very Good';
            ratingColor = 'text-green-500';
            ratingMessage = 'Solid effort! A few more questions and you hit Excellent.';
        } else if (totalScore >= 40) {
            rating = 'Good';
            ratingColor = 'text-blue-500';
            ratingMessage = 'Decent week. Try answering a few more questions next time.';
        } else if (totalScore >= 20) {
            rating = 'Not Bad';
            ratingColor = 'text-orange-500';
            ratingMessage = 'You started, but there is so much more you can do!';
        } else if (totalScore >= 0 && totalAttempts > 0) {
            rating = 'Poor';
            ratingColor = 'text-red-500';
            ratingMessage = 'Rough week. Dust yourself off and try again!';
        }

        return NextResponse.json({
            stats: {
                totalAttempts,
                correctAttempts,
                accuracy: Math.round(accuracy),
                activeDays,
                score: Math.round(totalScore)
            },
            rating: {
                label: rating,
                color: ratingColor,
                message: ratingMessage
            }
        });

    } catch (err: any) {
        console.error('[Weekly Report Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
