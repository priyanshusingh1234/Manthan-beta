import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfilesMap } from "@/lib/profiles";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const cleanAvatar = (url?: string | null): string | null =>
    url && !url.includes('googleusercontent.com') ? url : null;

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = Math.min(Number(url.searchParams.get('limit') || '10'), 20);
        const excludeIds = (url.searchParams.get('exclude') || '').split(',').filter(Boolean);

        const authHeader = req.headers.get('Authorization');
        let currentUserId: string | null = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // 1. Fire all DB calls in parallel:
        //    - Tag weights (for personalisation)
        //    - Regular pool (100 most-recent clips)
        //    - Fresh guarantee pool (<1h old) — bypasses the 100-item pool limit
        const tagWeightsFetch = currentUserId
            ? supabaseAdmin
                .from('post_likes')
                .select('post_id')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(20)
            : Promise.resolve(null);

        const poolFetch = supabaseAdmin
            .from('posts')
            .select('*, post_likes ( user_id )')
            .not('video_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100);

        // Always fetch clips posted in the last hour so they can never be crowded
        // out of the pool by older content.
        const freshFetch = supabaseAdmin
            .from('posts')
            .select('*, post_likes ( user_id )')
            .not('video_url', 'is', null)
            .gte('created_at', oneHourAgo)
            .order('created_at', { ascending: false })
            .limit(20);

        const [likesRes, poolRes, freshRes] = await Promise.all([tagWeightsFetch, poolFetch, freshFetch]);

        // 2. Build tag weights from liked posts
        const tagWeights: Record<string, number> = {};
        const recentLikes = (likesRes as any)?.data ?? [];
        if (recentLikes.length > 0 && currentUserId) {
            const likedPostIds = recentLikes.map((l: any) => l.post_id);
            const { data: likedPosts } = await supabaseAdmin
                .from('posts')
                .select('content')
                .in('id', likedPostIds)
                .not('video_url', 'is', null);

            likedPosts?.forEach(p => {
                const tags = (p.content || '').match(/#(\w+)/g) || [];
                tags.forEach((tag: string) => {
                    const t = tag.toLowerCase();
                    tagWeights[t] = (tagWeights[t] || 0) + 1;
                });
            });
        }

        // 3. Merge pool + fresh clips, deduplicate, filter excluded IDs
        const poolPosts = poolRes.data || [];
        const freshPosts = freshRes.data || [];

        const allById = new Map<string, any>();
        poolPosts.forEach(p => allById.set(p.id, p));
        // Fresh clips override so they're always in the candidate set
        freshPosts.forEach(p => allById.set(p.id, p));

        const availablePosts = Array.from(allById.values())
            .filter(p => !excludeIds.includes(p.id));

        // 4. Score candidates
        interface ScoredPost { post: any; score: number; }

        const scored: ScoredPost[] = availablePosts.map(p => {
            const content = p.content || '';
            const tags = content.match(/#(\w+)/g) || [];
            let tagMultiplier = 1.0;
            tags.forEach((tag: string) => {
                const t = tag.toLowerCase();
                if (tagWeights[t]) tagMultiplier += tagWeights[t] * 0.5;
            });

            const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);
            const commentsCount = p.comments_count || 0;
            const engagementScore = 1 + (likesCount * 2) + commentsCount;

            const ageMs = Date.now() - new Date(p.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            // Stronger recency curve (3d vs old 7d) so new clips rank much higher
            const recencyMultiplier = Math.max(0.05, Math.exp(-ageDays / 3));

            const randomFactor = 0.8 + (Math.random() * 0.4);

            let finalScore = engagementScore * tagMultiplier * recencyMultiplier * randomFactor;

            // 🚀 Own-clip boost: always place the uploader's own recent clip at top
            // so they get immediate feedback and drive early engagement signals.
            if (currentUserId && p.author_id === currentUserId && ageDays < 1) {
                finalScore *= 10_000;
            }

            return { post: p, score: finalScore };
        });

        // 5. Sort and pick top N
        scored.sort((a, b) => b.score - a.score);
        const topPosts = scored.slice(0, limit).map(s => s.post);

        // 6. Enrich with author info
        const authorIds = [...new Set(topPosts.map(p => p.author_id))] as string[];
        const profilesMap = await getProfilesMap(authorIds);

        const enriched = topPosts.map(p => {
            const profile = profilesMap.get(p.author_id);
            const isGhost = profile?.is_ghost === true;
            const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);

            return {
                id: p.id,
                content: p.content,
                image_url: p.image_url,
                video_url: p.video_url || null,
                video_thumbnail: p.video_thumbnail || null,
                likes_count: likesCount,
                comments_count: p.comments_count || 0,
                created_at: p.created_at,
                is_liked_by_me: currentUserId
                    ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId)
                    : false,
                author: {
                    id: p.author_id,
                    name: profile?.full_name || 'Unknown',
                    username: profile?.username || null,
                    avatar_url: cleanAvatar(profile?.avatar_url),
                    school: profile?.school || null,
                    isTeacher: profile?.is_teacher || false,
                    totalPoints: Number(profile?.total_points) || 0,
                    isGhost: isGhost,
                    cosmetics: profile?.cosmetics || [],
                }
            };
        });

        return NextResponse.json({
            posts: enriched,
            excludeIds: [...excludeIds, ...topPosts.map(p => p.id)]
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
