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
        // We can pass a simple offset or page, but since algorithm generates feed,
        // we might pass a comma-separated list of shown IDs to exclude them.
        const excludeIds = (url.searchParams.get('exclude') || '').split(',').filter(Boolean);

        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        // 1. Compute user preference based on recent likes
        const tagWeights: Record<string, number> = {};
        if (currentUserId) {
            // Fetch recent likes by user
            const { data: recentLikes } = await supabaseAdmin
                .from('post_likes')
                .select('post_id')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (recentLikes && recentLikes.length > 0) {
                const likedPostIds = recentLikes.map(l => l.post_id);
                const { data: likedPosts } = await supabaseAdmin
                    .from('posts')
                    .select('content')
                    .in('id', likedPostIds)
                    .not('video_url', 'is', null);

                likedPosts?.forEach(p => {
                    const content = p.content || '';
                    const tags = content.match(/#(\w+)/g) || [];
                    tags.forEach(tag => {
                        const t = tag.toLowerCase();
                        tagWeights[t] = (tagWeights[t] || 0) + 1;
                    });
                });
            }
        }

        // 2. Fetch a pool of candidate clips (recent and popular)
        let query = supabaseAdmin
            .from('posts')
            .select('*, post_likes ( user_id )')
            .not('video_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100); // pool size

        const { data: candidatePosts, error } = await query;
        if (error) throw error;

        // Filter out excluded ones
        let availablePosts = (candidatePosts || []).filter(p => !excludeIds.includes(p.id));

        // 3. Score candidates
        // Base score: 
        //  - Likes and comments add points.
        //  - Tag match multiplies the baseline score.
        //  - Recency adds a small bonus.
        interface ScoredPost {
            post: any;
            score: number;
        }

        const scored: ScoredPost[] = availablePosts.map(p => {
            const content = p.content || '';
            const tags = content.match(/#(\w+)/g) || [];
            let tagMultiplier = 1.0;
            
            tags.forEach(tag => {
                const t = tag.toLowerCase();
                if (tagWeights[t]) {
                    tagMultiplier += (tagWeights[t] * 0.5); // Add 50% bonus for each matched like
                }
            });

            const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);
            const commentsCount = p.comments_count || 0;
            const engagementScore = 1 + (likesCount * 2) + commentsCount;

            const ageMs = Date.now() - new Date(p.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            const recencyMultiplier = Math.max(0.1, Math.exp(-ageDays / 7)); // decay over a week

            // introduce a little randomness to avoid echo chambers
            const randomFactor = 0.8 + (Math.random() * 0.4); 

            const finalScore = engagementScore * tagMultiplier * recencyMultiplier * randomFactor;
            return { post: p, score: finalScore };
        });

        // 4. Sort and pick top N
        scored.sort((a, b) => b.score - a.score);
        const topPosts = scored.slice(0, limit).map(s => s.post);

        // 5. Enrich with author info
        const authorIds = [...new Set(topPosts.map(p => p.author_id))];
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
                is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
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
