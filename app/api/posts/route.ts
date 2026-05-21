import supabaseAdmin from "@/lib/supabaseAdmin";
import { upsertProfile } from "@/lib/profiles";
import { createNotification } from "@/lib/createNotification";
import { getCachedPublicPosts, CACHE_TAGS } from "@/lib/cache";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// force-dynamic only for the POST/mutation handlers — GET uses the Data Cache
export const dynamic = 'force-dynamic';

// Never expose Google OAuth profile pictures — users must upload a custom avatar.
const cleanAvatar = (url?: string | null): string | null =>
    url && !url.includes('googleusercontent.com') ? url : null;

// GET /api/posts - Fetch feed
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const before = url.searchParams.get('before'); // ISO timestamp cursor
        const limit = Math.min(Number(url.searchParams.get('limit') || '30'), 60);
        const clipsOnly = url.searchParams.get('clipsOnly') === 'true';

        const authHeader = req.headers.get('Authorization');
        let currentUserId: string | null = null;

        // ── Fast path: first page, no filters ────────────────────────────────
        // Serve from the shared Data Cache — no DB call needed for the post list.
        // Only auth verification is needed to inject is_liked_by_me.
        if (!before && !clipsOnly) {
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user } } = await supabaseAdmin.auth.getUser(token);
                currentUserId = user?.id || null;
            }

            const cached = await getCachedPublicPosts(limit);

            // Score + sort (mirrors the algorithmic sort in the full path)
            const enriched = cached.map(p => ({
                ...p,
                type: 'post',
                is_liked_by_me: currentUserId ? p._likeUserIds.includes(currentUserId) : false,
                _feedScore: p.is_pinned ? 1_000_000 : (() => {
                    const ageHours = (Date.now() - new Date(p.created_at).getTime()) / 3_600_000;
                    return (100 / Math.pow(ageHours + 2, 1.2)) + p.likes_count * 10 + p.comments_count * 25;
                })(),
                _feedLabel: p.is_pinned ? '📌 Pinned by Admin'
                    : p.likes_count > 20 ? '🔥 Trending in Community'
                        : '💡 Community Post',
            }));
            enriched.sort((a, b) => b._feedScore - a._feedScore);

            const response = NextResponse.json(enriched);
            response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
            return response;
        }

        // ── Slow path: paginated or clipsOnly — direct DB query ───────────────
        let userGrade: string | null = null;
        let userSchool: string | null = null;
        let followingIds: string[] = [];

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                currentUserId = user.id;
                userGrade = user.user_metadata?.classGrade?.toString() || user.user_metadata?.grade?.toString() || null;
                userSchool = user.user_metadata?.school || null;

                const [profileRes, followsRes] = await Promise.all([
                    supabaseAdmin.from('profiles').select('school').eq('id', user.id).maybeSingle(),
                    supabaseAdmin.from('follows').select('following_id').eq('follower_id', user.id),
                ]);
                if (profileRes.data?.school) userSchool = profileRes.data.school;
                if (followsRes.data) followingIds = followsRes.data.map((f: any) => f.following_id);
            }
        }

        let query = supabaseAdmin
            .from('posts')
            .select('id, author_id, content, image_url, video_url, video_thumbnail, likes_count, comments_count, created_at, post_likes ( user_id )')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (clipsOnly) query = query.not('video_url', 'is', null);
        if (before) query = query.lt('created_at', before);

        const { data: posts, error } = await query;
        if (error) throw error;

        const authorIds = [...new Set((posts || []).map((p: any) => p.author_id))] as string[];
        const { data: profilesRaw } = authorIds.length
            ? await supabaseAdmin
                .from('profiles')
                .select('id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics')
                .in('id', authorIds)
            : { data: [] };
        const profilesMap = new Map((profilesRaw || []).map((p: any) => [p.id, p]));



        const enriched = (posts || []).map(p => {
            const profile = profilesMap.get(p.author_id);
            const isGhost = profile?.is_ghost === true;
            const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);

            let finalContent = p.content || '';
            let isPinned = false;
            if (finalContent.startsWith('[PINNED]')) {
                isPinned = true;
                finalContent = finalContent.substring(8).trim();
            }

            const authorData = {
                id: p.author_id,
                name: profile?.full_name || 'Student',
                username: profile?.username || null,
                avatar_url: cleanAvatar(profile?.avatar_url),
                school: profile?.school || null,
                isTeacher: profile?.is_teacher || false,
                totalPoints: Number(profile?.total_points) || 0,
                isGhost: isGhost,
                cosmetics: profile?.cosmetics || [],
            };

            const postObj = {
                id: p.id,
                type: 'post',
                content: finalContent,
                image_url: p.image_url,
                video_url: p.video_url || null,
                video_thumbnail: p.video_thumbnail || null,
                likes_count: likesCount,
                comments_count: p.comments_count || 0,
                created_at: p.created_at,
                is_pinned: isPinned,
                is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
                author: authorData,
                _feedLabel: '',
                _feedScore: 0,
            };

            // Calculate algorithmic score
            let score = 100;
            if (isPinned) score = 1_000_000;
            else {
                const ageHours = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
                score = score / Math.pow(ageHours + 2, 1.2);
                score += (likesCount) * 10;
                score += (p.comments_count || 0) * 25;
                if (followingIds.includes(p.author_id)) score *= 2.5;
                if (userSchool && authorData.school === userSchool) score += 50;
                if (userGrade && profile?.grade === userGrade) score += 30;
                score += Math.floor((authorData.totalPoints || 0) / 100);
            }
            postObj._feedScore = score;

            // Assign tags based on algorithm
            if (isPinned) {
                postObj._feedLabel = '📌 Pinned by Admin';
            } else if (followingIds.includes(p.author_id) || (userSchool && authorData.school === userSchool)) {
                postObj._feedLabel = followingIds.includes(p.author_id) ? '👤 Post from Peer You Follow' : '🏫 Trending at Your School';
            } else if (score > 60) {
                postObj._feedLabel = '🔥 Trending in Community';
            } else {
                postObj._feedLabel = '💡 Discover Something New';
            }

            return postObj;
        });

        // Only sort by algorithm if it's the first page (no `before` cursor)
        // because sorting randomly breaks infinite scrolling cursor logic.
        if (!before) {
            enriched.sort((a, b) => b._feedScore - a._feedScore);
        }

        const response = NextResponse.json(enriched);
        // Cache for 30s on first page; pagination pages are unique so no caching needed
        if (!before) response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
        return response;
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
        let mentionedUsernames = Array.from(new Set(matches.map(m => m[1].toLowerCase())));

        const hasCommunityTag = mentionedUsernames.includes('community');
        if (hasCommunityTag) {
            mentionedUsernames = mentionedUsernames.filter(u => u !== 'community');
        }

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

        let followerIds = Array.from(new Set((followers || []).map((f: any) => String(f.follower_id)).filter(id => id && id !== user.id && !taggedUserIds.includes(id))));

        // 3. Handle @community for Admins
        const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const adminEmails = ['kpk22128@gmail.com', 's61038955@gmail.com', ...envAdmins];
        const isAdmin = authorProfile?.is_teacher || adminEmails.includes(user.email?.toLowerCase());
        let isCommunityBroadcast = false;

        if (hasCommunityTag && isAdmin) {
            isCommunityBroadcast = true;
            // Get all valid users who aren't the author
            const { data: allUsers } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .neq('id', user.id);

            const allUserIds = (allUsers || []).map(p => String(p.id));

            // Merge all users into followerIds to reuse the notification broadcasting logic below
            // This ensures everyone gets the notification, without sending duplicates.
            const combined = new Set([...followerIds, ...allUserIds]);
            // Remove those who already got tagged directly to avoid double notification
            taggedUserIds.forEach(id => combined.delete(id));

            followerIds = Array.from(combined);
        }

        if (followerIds.length > 0) {
            const isClip = !!videoUrl;

            let followerTitle = isClip
                ? `🎬 ${authorName} posted a new clip`
                : `${authorName} shared a new post`;

            if (isCommunityBroadcast) {
                followerTitle = `📢 Community Announcement from ${authorName}`;
            }

            const followerBody = isClip
                ? (excerpt
                    ? `${authorName}: "${excerpt}"`
                    : `${authorName} just dropped a 30-second clip. Watch it now!`)
                : (excerpt
                    ? `${authorName} posted: "${excerpt}"`
                    : `${authorName} shared a new post.`);

            await Promise.allSettled(
                followerIds.map((followerId) => createNotification({
                    userId: followerId,
                    type: isCommunityBroadcast ? 'points_earned' : 'following_post', // Use points_earned type for alert color/priority
                    title: followerTitle,
                    body: followerBody,
                    href: `/posts/${post.id}`,
                    actorId: user.id,
                    actorName: authorName,
                    actorAvatar: authorAvatar ?? undefined,
                }))
            );
        }

        // Purge the shared posts cache so the next GET sees the new post
        revalidateTag(CACHE_TAGS.posts);
        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
