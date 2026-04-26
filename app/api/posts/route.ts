import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfilesMap, upsertProfile } from "@/lib/profiles";
import { createNotification } from "@/lib/createNotification";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Never expose Google OAuth profile pictures — users must upload a custom avatar.
const cleanAvatar = (url?: string | null): string | null =>
    url && !url.includes('googleusercontent.com') ? url : null;

// GET /api/posts - Fetch feed
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const before = url.searchParams.get('before'); // ISO timestamp cursor
        const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 50);

        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        let query = supabaseAdmin
            .from('posts')
            .select('*, post_likes ( user_id )')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data: posts, error } = await query;
        if (error) throw error;

        // Fast profile lookup via profiles table (no listUsers!)
        const authorIds = [...new Set((posts || []).map((p: any) => p.author_id))];
        const profilesMap = await getProfilesMap(authorIds);

        const enriched = (posts || [])
            .map(p => {
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

        const { content, imageUrl, videoUrl, videoThumbnail } = await req.json();

        if (!content?.trim() && !videoUrl) {
            return NextResponse.json({ error: 'Post must contain text or a video.' }, { status: 400 });
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .insert({
                author_id: user.id,
                content: content?.trim() || '',
                image_url: imageUrl || null,
                video_url: videoUrl || null,
                video_thumbnail: videoThumbnail || null,
            })
            .select()
            .single();

        if (error) throw error;
        

        // --- Tagging / Mentions Logic ---
        const mentionRegex = /@([\w.-]+)/g;
        const matches = [...content.matchAll(mentionRegex)];
        const mentionedUsernames = Array.from(new Set(matches.map(m => m[1].toLowerCase())));

        let taggedUserIds: string[] = [];
        if (mentionedUsernames.length > 0) {
            const { data: taggedProfiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .in('username', mentionedUsernames);

            taggedUserIds = (taggedProfiles || []).map(p => p.id).filter(id => id !== user.id);
        }

        // --- Notification Logic ---
        const { data: authorProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

        const authorName = authorProfile?.full_name || user.user_metadata?.fullName || user.user_metadata?.username || 'Someone';
        const authorAvatar = cleanAvatar(authorProfile?.avatar_url) || cleanAvatar(user.user_metadata?.avatar_url) || null;
        const cleanSnippet = String(content || '').trim().replace(/\s+/g, ' ').slice(0, 90);
        const excerpt = `${cleanSnippet}${cleanSnippet.length >= 90 ? '...' : ''}`;

        // 1. Send Mention Notifications
        if (taggedUserIds.length > 0) {
            await Promise.allSettled(
                taggedUserIds.map(taggedId => createNotification({
                    userId: taggedId,
                    type: 'post_mention',
                    title: `${authorName} mentioned you in a post`,
                    body: excerpt ? `"${excerpt}"` : `${authorName} mentioned you.`,
                    href: `/posts/${post.id}`,
                    actorId: user.id,
                    actorName: authorName,
                    actorAvatar: authorAvatar ?? undefined,
                }))
            );
        }

        // 2. Send Follower Notifications (excluding those already tagged)
        const { data: followers } = await supabaseAdmin
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);

        const followerIds = Array.from(new Set((followers || []).map((f: any) => String(f.follower_id)).filter(id => id && id !== user.id && !taggedUserIds.includes(id))));

        if (followerIds.length > 0) {
            const bodyText = excerpt
                ? `${authorName} posted: "${excerpt}"`
                : `${authorName} shared a new post.`;

            await Promise.allSettled(
                followerIds.map((followerId) => createNotification({
                    userId: followerId,
                    type: 'following_post',
                    title: `${authorName} shared a new post`,
                    body: bodyText,
                    href: `/posts/${post.id}`,
                    actorId: user.id,
                    actorName: authorName,
                    actorAvatar: authorAvatar ?? undefined,
                }))
            );
        }

        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
