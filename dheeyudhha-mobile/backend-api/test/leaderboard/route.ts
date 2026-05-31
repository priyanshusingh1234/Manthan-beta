import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

        // 1. Fetch top results from test_results (no join — avoids schema cache issues)
        const { data: topData, error: topError } = await supabaseAdmin
            .from('test_results' as any)
            .select('user_id, score, max_score, time_taken, accuracy, completed_at')
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .order('time_taken', { ascending: true })
            .limit(50);

        if (topError) {
            console.error('[leaderboard] topError:', topError);
            throw topError;
        }

        // 2. Dedupe — keep only the best attempt per user
        const seenUsers = new Set<string>();
        const bestAttempts = (topData || []).filter((entry: any) => {
            if (seenUsers.has(entry.user_id)) return false;
            seenUsers.add(entry.user_id);
            return true;
        }).slice(0, 10);

        // 3. Fetch profile data for these users in a single query
        const userIds = bestAttempts.map((e: any) => e.user_id);
        const { data: profilesData } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url, school')
            .in('id', userIds);

        const profileMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });

        // Google profile photo URLs expire for third-party requests.
        // Filter them out and fall back to avatar_url from auth metadata.
        const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');

        const missingAvatarIds = userIds.filter((id: string) => {
            const av = profileMap[id]?.avatar_url;
            return !av || isGoogleUrl(av);
        });
        const authAvatarMap: Record<string, string | null> = {};
        if (missingAvatarIds.length > 0) {
            await Promise.all(missingAvatarIds.map(async (id: string) => {
                try {
                    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(id);
                    if (user?.user_metadata) {
                        const meta = user.user_metadata;
                        const nonGoogle = (url?: string | null) => url && !isGoogleUrl(url) ? url : null;
                        authAvatarMap[id] = nonGoogle(meta.avatar_url) || null;
                    }
                } catch { /* non-fatal */ }
            }));
        }

        // 4. Assemble leaderboard
        const leaderboard = bestAttempts.map((entry: any, i: number) => {
            const profile = profileMap[entry.user_id] || {};
            const dbAvatar = profile.avatar_url && !isGoogleUrl(profile.avatar_url) ? profile.avatar_url : null;
            return {
                rank: i + 1,
                userId: entry.user_id,
                name: profile.full_name || profile.username || 'Scholar',
                username: profile.username || 'scholar',
                avatar: dbAvatar || authAvatarMap[entry.user_id] || null,
                school: profile.school || 'Private Scholar',
                score: entry.score,
                maxScore: entry.max_score,
                timeTaken: entry.time_taken,
                accuracy: entry.accuracy,
                completedAt: entry.completed_at
            };
        });


        // 5. Get current user's best attempt (if they exist but aren't in top 10)
        let userStats = null;
        if (currentUserId) {
            const inTop10 = leaderboard.find(e => e.userId === currentUserId);
            if (inTop10) {
                userStats = inTop10;
            } else {
                const { data: personalBest } = await supabaseAdmin
                    .from('test_results' as any)
                    .select('*')
                    .eq('test_id', testId)
                    .eq('user_id', currentUserId)
                    .order('score', { ascending: false })
                    .order('time_taken', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (personalBest) {
                    userStats = {
                        userId: currentUserId,
                        score: personalBest.score,
                        maxScore: personalBest.max_score,
                        timeTaken: personalBest.time_taken,
                        accuracy: personalBest.accuracy,
                        completedAt: personalBest.completed_at
                    };
                }
            }
        }

        return NextResponse.json({ leaderboard, userStats });
    } catch (err: any) {
        console.error('[test-leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
