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
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Math.min(Number(url.searchParams.get('limit') || '30'), 60);
        const clipsOnly = url.searchParams.get('clipsOnly') === 'true';

        const recentLimit = Math.floor(limit * 0.5);
        const trendingLimit = Math.ceil(limit * 0.5);
        const recentOffset = (page - 1) * recentLimit;
        const trendingOffset = (page - 1) * trendingLimit;

        const authHeader = req.headers.get('Authorization');
        // ── Parallel Data Fetching ───────────────
        const [userData, cachedPostsData] = await Promise.all([
            // 1. Fetch current user metadata (Concurrent)
            (async () => {
                if (!authHeader) return null;
                const token = authHeader.replace('Bearer ', '');
                const { data: { user } } = await supabaseAdmin.auth.getUser(token);
                if (!user) return null;

                const [profileRes, followsRes] = await Promise.all([
                    supabaseAdmin.from('profiles').select('school').eq('id', user.id).maybeSingle(),
                    supabaseAdmin.from('follows').select('following_id').eq('follower_id', user.id),
                ]);

                return {
                    id: user.id,
                    grade: user.user_metadata?.classGrade?.toString() || user.user_metadata?.grade?.toString() || null,
                    school: profileRes.data?.school || user.user_metadata?.school || null,
                    followingIds: (followsRes.data || []).map((f: any) => f.following_id)
                };
            })(),
            // 2. Fetch posts (Concurrent) - Mixed 50/50 Recent & Trending
            (async () => {
                const selectFields = 'id, author_id, content, image_url, image_urls, video_url, video_thumbnail, likes_count, comments_count, created_at, post_likes ( user_id ), repost_id';
                
                let recentQuery = supabaseAdmin
                    .from('posts')
                    .select(selectFields)
                    .order('created_at', { ascending: false })
                    .range(recentOffset, recentOffset + recentLimit - 1);
                
                // For trending, we sort by likes_count and created_at
                let trendingQuery = supabaseAdmin
                    .from('posts')
                    .select(selectFields)
                    .order('likes_count', { ascending: false })
                    .order('created_at', { ascending: false })
                    .range(trendingOffset, trendingOffset + trendingLimit - 1);

                if (clipsOnly) {
                    recentQuery = recentQuery.not('video_url', 'is', null);
                    trendingQuery = trendingQuery.not('video_url', 'is', null);
                }

                const [recentRes, trendingRes] = await Promise.all([recentQuery, trendingQuery]);
                if (recentRes.error) throw recentRes.error;
                if (trendingRes.error) throw trendingRes.error;

                const combined = [...(recentRes.data || []), ...(trendingRes.data || [])];
                const uniqueMap = new Map();
                for (const p of combined) {
                    if (!uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
                }
                const posts = Array.from(uniqueMap.values());

                const authorIds = [...new Set(posts.map((p: any) => p.author_id))] as string[];
                const { data: profilesRaw } = authorIds.length
                    ? await supabaseAdmin
                        .from('profiles')
                        .select('id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics')
                        .in('id', authorIds)
                    : { data: [] };
                const profilesMap = new Map((profilesRaw || []).map((p: any) => [p.id, p]));

                const missingAuthorIds = authorIds.filter(id => {
                    const p = profilesMap.get(id);
                    return !p || !p.full_name;
                });

                const authUsersMap = new Map();
                if (missingAuthorIds.length > 0) {
                    await Promise.allSettled(missingAuthorIds.map(async (id) => {
                        try {
                            const { data } = await supabaseAdmin.auth.admin.getUserById(id);
                            if (data?.user) authUsersMap.set(id, data.user);
                        } catch { /* silent */ }
                    }));
                }

                return posts.map(p => {
                    const profile = profilesMap.get(p.author_id);
                    const isGhost = profile?.is_ghost === true;
                    const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);

                    let finalContent = p.content || '';
                    let isPinned = false;
                    if (finalContent.startsWith('[PINNED]')) {
                        isPinned = true;
                        finalContent = finalContent.substring(8).trim();
                    }

                    const authUser = authUsersMap.get(p.author_id);
                    const meta = authUser?.user_metadata || {};
                    const authName = authUser?.full_name || meta?.fullName || meta?.full_name || meta?.name || meta?.username || (authUser?.email ? authUser.email.split('@')[0] : null);

                    let formattedRepost = null;
                    if (p.repost) {
                        const rpProfile = profilesMap.get(p.repost.author_id);
                        const rpAuthUser = authUsersMap.get(p.repost.author_id);
                        const rpMeta = rpAuthUser?.user_metadata || {};
                        const rpAuthName = rpAuthUser?.full_name || rpMeta?.fullName || rpMeta?.full_name || rpMeta?.name || rpMeta?.username || (rpAuthUser?.email ? rpAuthUser.email.split('@')[0] : null);
                        
                        formattedRepost = {
                            id: p.repost.id,
                            author_id: p.repost.author_id,
                            content: p.repost.content,
                            image_url: p.repost.image_url,
                            image_urls: p.repost.image_urls || [],
                            video_url: p.repost.video_url || null,
                            video_thumbnail: p.repost.video_thumbnail || null,
                            created_at: p.repost.created_at,
                            author: {
                                id: p.repost.author_id,
                                name: rpProfile?.full_name || rpAuthName || rpProfile?.username || 'Student',
                                username: rpProfile?.username || rpMeta?.username || null,
                                avatar_url: rpProfile?.avatar_url || rpMeta?.avatar_url || rpMeta?.picture || null,
                                isTeacher: rpProfile?.is_teacher || rpMeta?.isTeacher || rpMeta?.is_teacher || false,
                                school: rpProfile?.school || rpMeta?.school || null,
                                isGhost: rpProfile?.is_ghost === true,
                                cosmetics: rpProfile?.cosmetics || rpMeta?.cosmetics || [],
                            }
                        };
                    }

                    return {
                        id: p.id,
                        author_id: p.author_id,
                        content: finalContent,
                        image_url: p.image_url,
                        image_urls: p.image_urls || [],
                        video_url: p.video_url || null,
                        video_thumbnail: p.video_thumbnail || null,
                        likes_count: likesCount,
                        comments_count: p.comments_count || 0,
                        created_at: p.created_at,
                        is_pinned: isPinned,
                        _likeUserIds: (p.post_likes || []).map((l: any) => l.user_id) as string[],
                        repost: formattedRepost,
                        author: {
                            id: p.author_id,
                            name: profile?.full_name || authName || profile?.username || 'Student',
                            username: profile?.username || meta?.username || null,
                            avatar_url: profile?.avatar_url || meta?.avatar_url || meta?.picture || null,
                            school: profile?.school || meta?.school || null,
                            isTeacher: profile?.is_teacher || meta?.isTeacher || meta?.is_teacher || false,
                            totalPoints: Number(profile?.total_points) || Number(meta?.totalPoints) || 0,
                            isGhost: isGhost,
                            cosmetics: profile?.cosmetics || meta?.cosmetics || [],
                        }
                    };
                });
            })()
        ]);

        const currentUserId = userData?.id || null;
        const userGrade = userData?.grade || null;
        const userSchool = userData?.school || null;
        const followingIds = userData?.followingIds || [];

        // ── Personalize and Score ───────────────
        const enriched = cachedPostsData.map(p => {
            const postObj = {
                id: p.id,
                type: 'post',
                content: p.content,
                image_url: p.image_url,
                image_urls: p.image_urls,
                video_url: p.video_url,
                video_thumbnail: p.video_thumbnail,
                likes_count: p.likes_count,
                comments_count: p.comments_count,
                created_at: p.created_at,
                is_pinned: p.is_pinned,
                is_liked_by_me: currentUserId ? p._likeUserIds.includes(currentUserId) : false,
                author: p.author,
                repost: p.repost,
                _feedLabel: '',
                _feedScore: 0,
            };

            // Calculate algorithmic score
            let score = 100;
            if (p.is_pinned) score = 1_000_000;
            else {
                const ageHours = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
                score = score / Math.pow(ageHours + 2, 1.2);
                score += (p.likes_count) * 10;
                score += (p.comments_count || 0) * 25;
                if (followingIds.includes(p.author_id)) score *= 2.5;
                if (userSchool && p.author.school === userSchool) score += 50;
                if (userGrade && p.author.grade === userGrade) score += 30; // Assuming author.grade is available if needed
                score += Math.floor((p.author.totalPoints || 0) / 100);
            }
            postObj._feedScore = score;

            // Assign tags based on algorithm
            if (p.is_pinned) {
                postObj._feedLabel = '📌 Pinned by Admin';
            } else if (followingIds.includes(p.author_id) || (userSchool && p.author.school === userSchool)) {
                postObj._feedLabel = followingIds.includes(p.author_id) ? '👤 Post from Peer You Follow' : '🏫 Trending at Your School';
            } else if (score > 60) {
                postObj._feedLabel = '🔥 Trending in Community';
            } else {
                postObj._feedLabel = '💡 Discover Something New';
            }

            return postObj;
        });

        // Only sort by algorithm if it's the first page
        // because sorting randomly breaks infinite scrolling logic.
        if (page === 1) {
            enriched.sort((a, b) => b._feedScore - a._feedScore);
        }

        const response = NextResponse.json(enriched);
        // Cache for 30s on first page; pagination pages are unique so no caching needed
        if (page === 1) response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
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

        const { content, imageUrl, imageUrls, videoUrl, videoThumbnail, repost_id } = await req.json();

        if (!content?.trim() && !videoUrl && !repost_id) {
            return NextResponse.json({ error: 'Post must contain text, a video, or be a repost.' }, { status: 400 });
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .insert({
                author_id: user.id,
                content: content?.trim() || '',
                image_url: imageUrl || null,
                image_urls: imageUrls || [],
                video_url: videoUrl || null,
                video_thumbnail: videoThumbnail || null,
                repost_id: repost_id || null,
            })
            .select()
            .single();

        if (error) throw error;

        // --- Fetch original post author if repost ---
        let originalAuthorId: string | null = null;
        if (repost_id) {
            const { data: origPost } = await supabaseAdmin.from('posts').select('author_id').eq('id', repost_id).single();
            if (origPost) originalAuthorId = origPost.author_id;
        }


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

        // 2. Send Repost Notification
        if (originalAuthorId && originalAuthorId !== user.id) {
            await createNotification({
                userId: originalAuthorId,
                type: 'following_post',
                title: `${authorName} reposted your post`,
                body: excerpt ? `"${excerpt}"` : `${authorName} shared your post.`,
                href: `/posts/${post.id}`,
                actorId: user.id,
                actorName: authorName,
                actorAvatar: authorAvatar ?? undefined,
            });
        }

        // 3. Send Follower Notifications (excluding those already tagged or notified)
        const { data: followers } = await supabaseAdmin
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);

        let followerIds = Array.from(new Set((followers || []).map((f: any) => String(f.follower_id)).filter(id => id && id !== user.id && !taggedUserIds.includes(id) && id !== originalAuthorId)));

        // 3. Handle @community for Admins
        const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const adminEmails = [...envAdmins].filter(Boolean);
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
