import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const testId = req.nextUrl.searchParams.get('testId');
        if (!testId) return NextResponse.json({ error: 'Missing testId' }, { status: 400 });

        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) currentUserId = user.id;
        }

        // 1. Get Top attempts (use left join to be inclusive of users with missing profiles)
        const { data: topData, error: topError } = await supabaseAdmin
            .from('test_results')
            .select(`
                user_id, score, max_score, time_taken, accuracy, completed_at,
                profiles ( id, full_name, username, avatar_url, school )
            `)
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .order('time_taken', { ascending: true })
            .limit(30);

        if (topError) throw topError;

        const seenUsers = new Set();
        const leaderboard = (topData || [])
            .map((entry: any) => {
                const profile = entry.profiles || {};
                const uid = profile.id || (entry as any).user_id; // fallback to user_id if join is null
                
                return {
                    userId: uid,
                    name: profile.full_name || profile.username || 'Scholar',
                    username: profile.username || 'scholar',
                    avatar: profile.avatar_url || null,
                    school: profile.school || 'Private Scholar',
                    score: entry.score,
                    maxScore: entry.max_score,
                    timeTaken: entry.time_taken,
                    accuracy: entry.accuracy,
                    completedAt: entry.completed_at
                };
            })
            .filter((entry: any) => {
                if (seenUsers.has(entry.userId)) return false;
                seenUsers.add(entry.userId);
                return true;
            })
            .map((entry, i) => ({ ...entry, rank: i + 1 }))
            .slice(0, 10);

        // 2. Get Current User's best attempt (if not in top 10)
        let userStats = null;
        if (currentUserId) {
            const isTop10 = leaderboard.some(e => e.userId === currentUserId);
            if (!isTop10) {
                const { data: personalBest } = await supabaseAdmin
                    .from('test_results')
                    .select('*')
                    .eq('test_id', testId)
                    .eq('user_id', currentUserId)
                    .order('score', { ascending: false })
                    .order('time_taken', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (personalBest) {
                    userStats = {
                        score: personalBest.score,
                        maxScore: personalBest.max_score,
                        timeTaken: personalBest.time_taken,
                        accuracy: personalBest.accuracy,
                        completedAt: personalBest.completed_at
                    };
                }
            } else {
               userStats = leaderboard.find(e => e.userId === currentUserId);
            }
        }

        return NextResponse.json({ leaderboard, userStats });
    } catch (err: any) {
        console.error('[test-leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
