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

        if (!currentUser) return NextResponse.json({ suggestions: [] });

        const userId = currentUser.id;

        // 1. Who do I already follow?
        const { data: myFollowing } = await supabaseAdmin
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);
        const myFollowingIds = new Set((myFollowing || []).map((f: any) => f.following_id));
        myFollowingIds.add(userId); // exclude self

        // 2. Who follows ME?
        const { data: myFollowers } = await supabaseAdmin
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);
        const myFollowerIds = (myFollowers || []).map((f: any) => f.follower_id);

        // Score map: candidateId -> { score, reason }
        const scores: Record<string, { score: number; reason: string }> = {};

        const bump = (id: string, amount: number, reason: string) => {
            if (myFollowingIds.has(id)) return; // skip already-following
            if (!scores[id]) scores[id] = { score: 0, reason: 'Suggested for you' };
            scores[id].score += amount;
            if (amount >= scores[id].score) scores[id].reason = reason;
        };

        // 3a. People MY FOLLOWERS also follow
        if (myFollowerIds.length > 0) {
            const { data: followerNetwork } = await supabaseAdmin
                .from('follows')
                .select('following_id')
                .in('follower_id', myFollowerIds.slice(0, 50));

            (followerNetwork || []).forEach((f: any) => {
                bump(f.following_id, 3, 'Followed by your followers');
            });
        }

        // 3b. Co-followers: people who follow the same accounts as me
        if (myFollowingIds.size > 1) {
            const myFollowingArr = [...myFollowingIds].filter(id => id !== userId).slice(0, 50);
            const { data: coFollowers } = await supabaseAdmin
                .from('follows')
                .select('follower_id')
                .in('following_id', myFollowingArr);

            (coFollowers || []).forEach((f: any) => {
                bump(f.follower_id, 2, 'Follows people you follow');
            });
        }

        // 3c. People who follow ME but I don't follow back (highest priority)
        myFollowerIds.forEach((id: string) => {
            bump(id, 5, 'Follows you');
        });

        // 4. Sort by score descending
        let candidates = Object.entries(scores)
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 10)
            .map(([id, { reason }]) => ({ id, reason }));

        // 5. Fallback to top scorers if social graph is sparse
        if (candidates.length < 5) {
            const { data: topUsers } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .neq('id', userId)
                .order('total_points', { ascending: false })
                .limit(20);

            for (const u of (topUsers || [])) {
                if (!myFollowingIds.has(u.id) && !candidates.find(c => c.id === u.id)) {
                    candidates.push({ id: u.id, reason: 'Popular on Dheeyudha' });
                }
                if (candidates.length >= 8) break;
            }
        }

        // 6. Fetch full profiles in a single query
        const ids = candidates.slice(0, 8).map(c => c.id);
        if (!ids.length) return NextResponse.json({ suggestions: [] });

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url, total_points, is_teacher')
            .in('id', ids);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        const suggestions = candidates
            .slice(0, 8)
            .map(c => {
                const p = profileMap.get(c.id);
                if (!p) return null;
                return {
                    id: p.id,
                    name: p.full_name || 'Scholar',
                    username: p.username || null,
                    avatar: p.avatar_url || null,
                    isTeacher: p.is_teacher || false,
                    reason: c.reason,
                    totalPoints: Number(p.total_points) || 0,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ suggestions }, {
            headers: {
                // Per-user cache: 5 min fresh, serve stale up to 10 min while revalidating
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
            },
        });

    } catch (err: any) {
        console.error('[Suggestions API]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
