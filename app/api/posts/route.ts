import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfilesMap } from "@/lib/profiles";
import { createNotification } from "@/lib/createNotification";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET /api/posts - Fetch feed
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        const { data: posts, error } = await supabaseAdmin
            .from('posts')
            .select(`
                *,
                post_likes ( user_id )
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Fast profile lookup via profiles table (no listUsers!)
        const authorIds = [...new Set((posts || []).map((p: any) => p.author_id))];
        const profilesMap = await getProfilesMap(authorIds);

        const enriched = (posts || []).map(p => {
            const profile = profilesMap.get(p.author_id);
            return {
                id: p.id,
                content: p.content,
                image_url: p.image_url,
                likes_count: p.likes_count || 0,
                comments_count: p.comments_count || 0,
                created_at: p.created_at,
                is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
                author: {
                    id: p.author_id,
                    name: profile?.full_name || 'Unknown',
                    username: profile?.username || null,
                    avatar_url: profile?.avatar_url || null,
                    school: profile?.school || null,
                    isTeacher: profile?.is_teacher || false,
                    totalPoints: Number(profile?.total_points) || 0,
                }
            };
        });

        return NextResponse.json(enriched);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/posts - Create post
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content, imageUrl } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Post must contain text.' }, { status: 400 });
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .insert({
                author_id: user.id,
                content: content.trim(),
                image_url: imageUrl || null
            })
            .select()
            .single();

        if (error) throw error;

        const { data: followers } = await supabaseAdmin
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);

        const followerIds = Array.from(new Set((followers || []).map((f: any) => String(f.follower_id)).filter(Boolean)));
        if (followerIds.length > 0) {
            const { data: authorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            const authorName =
                authorProfile?.full_name ||
                user.user_metadata?.fullName ||
                user.user_metadata?.username ||
                'Someone';
            const authorUsername = authorProfile?.username || user.user_metadata?.username || null;
            const authorAvatar = authorProfile?.avatar_url || user.user_metadata?.avatar_url || null;
            const cleanSnippet = String(content || '').trim().replace(/\s+/g, ' ').slice(0, 90);
            const bodyText = cleanSnippet
                ? `${authorName} posted: "${cleanSnippet}${cleanSnippet.length >= 90 ? '...' : ''}"`
                : `${authorName} shared a new post.`;

            await Promise.allSettled(
                followerIds
                    .filter((id) => id !== user.id)
                    .map((followerId) => createNotification({
                        userId: followerId,
                        type: 'following_post',
                        title: `${authorName} shared a new post`,
                        body: bodyText,
                        href: `/posts/${post.id}`,
                        actorId: user.id,
                        actorName: authorName,
                        actorAvatar: authorAvatar,
                    }))
            );
        }

        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
