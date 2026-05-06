import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * GET /api/dev/test-notifs
 * 
 * Fires one of every notification type to the authenticated user.
 * Sends each with a 2.5s gap so you can watch them arrive on Android one by one.
 * 
 * Usage — open this in your browser while logged in (or pass Bearer token):
 *   https://your-app.vercel.app/api/dev/test-notifs
 * 
 * ⚠️  This route is intended for dev/testing only.
 *     Remove or protect it before going fully public.
 */
export async function GET(req: NextRequest) {
    // Auth — must be logged in
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Also accept token via cookie for direct browser visits
    let user: any = null;
    if (token) {
        const { data } = await supabase.auth.getUser(token);
        user = data.user;
    }

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized — open this URL while logged in, or pass Authorization: Bearer <token>' },
            { status: 401 }
        );
    }

    const uid      = user.id;
    const name     = user.user_metadata?.fullName || user.user_metadata?.full_name || 'Scholar';
    const avatar   = user.user_metadata?.avatar_url || null;
    const DELAY_MS = 2500;

    const tests = [
        {
            label: '1. ⚔️  Duel Challenge (coop_challenge)',
            params: {
                userId: uid,
                type: 'coop_challenge' as const,
                title: '⚔️ Duel Challenge!',
                body: `Arjun Sharma challenged you to a battle on "Newton's Laws of Motion". You have 24h to accept!`,
                href: '/duels',
                actorName: 'Arjun Sharma',
                actorAvatar: avatar,
            },
        },
        {
            label: '2. 👥 New Follower (new_follower)',
            params: {
                userId: uid,
                type: 'new_follower' as const,
                title: '👥 New Follower!',
                body: `Priya Mehta started following you. Check out their profile!`,
                href: `/user/priyamehta`,
                actorName: 'Priya Mehta',
                actorAvatar: avatar,
            },
        },
        {
            label: '3. ✅ Answer Approved (answer_approved)',
            params: {
                userId: uid,
                type: 'answer_approved' as const,
                title: '✅ Answer Approved!',
                body: `Your written answer for "Explain photosynthesis" was marked correct by the teacher. +10 points!`,
                href: '/profile',
                actorName: 'Mrs. Anita Singh',
                actorAvatar: null,
            },
        },
        {
            label: '4. ❌ Answer Flagged (answer_flagged)',
            params: {
                userId: uid,
                type: 'answer_flagged' as const,
                title: '❌ Answer Needs Revision',
                body: `Your answer for "Describe cell division" was flagged. Review the teacher's feedback and resubmit.`,
                href: '/profile',
                actorName: 'Mr. Rohan Kumar',
                actorAvatar: null,
            },
        },
        {
            label: '5. 🏆 Points Earned (points_earned)',
            params: {
                userId: uid,
                type: 'points_earned' as const,
                title: '🏆 +50 Points Earned!',
                body: `You just crossed 500 total points. You\'re climbing the leaderboard fast!`,
                href: '/leaderboard',
                actorName: 'Dheeyudha',
                actorAvatar: null,
            },
        },
        {
            label: '6. 📚 New Question (new_question)',
            params: {
                userId: uid,
                type: 'new_question' as const,
                title: '📚 New Question Posted!',
                body: `Mrs. Sunita posted a new Class 10 Science question: "What is Newton's third law?" — 20 pts available.`,
                href: '/questions',
                actorName: 'Mrs. Sunita',
                actorAvatar: null,
            },
        },
        {
            label: '7. 🔥 Streak Friend (streak_friend)',
            params: {
                userId: uid,
                type: 'streak_friend' as const,
                title: '🔥 Rahul has a 7-day streak!',
                body: `Don't let Rahul beat you — you haven't solved today's questions yet. Keep your streak alive!`,
                href: '/streaks',
                actorName: 'Rahul Verma',
                actorAvatar: avatar,
            },
        },
        {
            label: '8. 📊 Weekly Report (weekly_report)',
            params: {
                userId: uid,
                type: 'weekly_report' as const,
                title: '📊 Your Weekly Report is Ready',
                body: `This week: 42 questions solved, 87% accuracy, 6 active days. Rating: Excellent 🌟`,
                href: '/profile',
                actorName: 'Dheeyudha',
                actorAvatar: null,
            },
        },
        {
            label: '9. 💬 Post Mention (post_mention)',
            params: {
                userId: uid,
                type: 'post_mention' as const,
                title: `💬 ${name}, someone mentioned you!`,
                body: `Kavya tagged you in a post: "Check out what @${name} scored in the Math duel! 🔥"`,
                href: '/feed',
                actorName: 'Kavya Patel',
                actorAvatar: avatar,
            },
        },
        {
            label: '10. 🤖 AI Correct (ai_confirmed_correct)',
            params: {
                userId: uid,
                type: 'ai_confirmed_correct' as const,
                title: '🤖 AI Confirmed: Correct!',
                body: `Your answer "The mitochondria is the powerhouse of the cell" was verified as correct by AI. +5 XP!`,
                href: '/profile',
                actorName: 'Dheeyudha AI',
                actorAvatar: null,
            },
        },
    ];

    const results: string[] = [];

    for (const test of tests) {
        try {
            await createNotification(test.params);
            results.push(`✅ Sent: ${test.label}`);
            console.log(`[test-notifs] Sent: ${test.label}`);
        } catch (err: any) {
            results.push(`❌ Failed: ${test.label} — ${err.message}`);
            console.error(`[test-notifs] Failed: ${test.label}`, err);
        }
        await sleep(DELAY_MS);
    }

    return NextResponse.json({
        message: `Fired ${tests.length} test notifications to ${name} (${uid}) with ${DELAY_MS}ms gaps.`,
        results,
    });
}
