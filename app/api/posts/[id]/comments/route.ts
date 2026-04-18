import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfilesMap, upsertProfile } from "@/lib/profiles";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/createNotification";

export const dynamic = 'force-dynamic';

const cleanAvatar = (url?: string | null): string | null =>
    url && !url.includes('googleusercontent.com') ? url : null;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { data: comments, error } = await supabaseAdmin
            .from('post_comments')
            .select('*')
            .eq('post_id', params.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fast profile lookup
        const authorIds = [...new Set((comments || []).map((c: any) => c.author_id))];
        const profilesMap = await getProfilesMap(authorIds);

        const enriched = (comments || []).map(c => {
            const profile = profilesMap.get(c.author_id);
            return {
                id: c.id,
                content: c.content,
                author_id: c.author_id,
                created_at: c.created_at,
                author: {
                    id: profile?.id || c.author_id,
                    name: profile?.full_name || 'Unknown',
                    username: profile?.username || null,
                    avatar_url: cleanAvatar(profile?.avatar_url),
                    isTeacher: profile?.is_teacher || false,
                    totalPoints: Number(profile?.total_points) || 0,
                    cosmetics: profile?.cosmetics || [],
                }
            };
        });

        return NextResponse.json(enriched);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content, replying_to_user_id } = await req.json();
        if (!content || !content.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

        const { data: comment, error } = await supabaseAdmin
            .from('post_comments')
            .insert({
                post_id: params.id,
                author_id: user.id,
                content: content.trim()
            })
            .select()
            .single();

        if (error) throw error;

        // Increment post comments count and get post author
        const { data: post } = await supabaseAdmin
            .from('posts')
            .select('comments_count, author_id')
            .eq('id', params.id)
            .single();

        await supabaseAdmin
            .from('posts')
            .update({ comments_count: (post?.comments_count || 0) + 1 })
            .eq('id', params.id);

        const meta = user.user_metadata || {};
        const authorName = meta.fullName || meta.name || user.email?.split('@')[0];

        // Keep profiles table in sync
        await upsertProfile(user.id, meta);

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

        // Send Notification to Replied User OR Post Author
        const notifyUserId = replying_to_user_id || post?.author_id;

        // 1. Send specific mention notifications
        if (taggedUserIds.length > 0) {
            await Promise.allSettled(
                taggedUserIds.map(taggedId => createNotification({
                    userId: taggedId,
                    type: 'post_mention',
                    title: `${authorName} mentioned you in a comment`,
                    body: content.length > 60 ? `"${content.substring(0, 60)}..."` : `"${content}"`,
                    href: `/posts/${params.id}`,
                    actorId: user.id,
                    actorName: authorName,
                    actorAvatar: cleanAvatar(meta.custom_avatar_url) || cleanAvatar(meta.avatar_url),
                }))
            );
        }

        // 2. Send Standard Comment notification (if not already notified as tagged)
        if (notifyUserId && notifyUserId !== user.id && !taggedUserIds.includes(notifyUserId)) {
            await createNotification({
                userId: notifyUserId,
                type: 'social_comment',
                title: replying_to_user_id ? 'New Reply on your Comment 💬' : 'New Comment on your Post 💬',
                body: `${authorName} wrote: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
                href: `/posts/${params.id}`,
                actorId: user.id,
                actorName: authorName,
                actorAvatar: cleanAvatar(meta.custom_avatar_url) || cleanAvatar(meta.avatar_url),
            });
        }

        return NextResponse.json({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
                id: user.id,
                name: meta.fullName || meta.name || user.email?.split('@')[0],
                username: meta.username || null,
                avatar_url: cleanAvatar(meta.custom_avatar_url) || cleanAvatar(meta.avatar_url),
                isTeacher: meta.isTeacher || false,
                totalPoints: Number(meta.totalPoints) || 0,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
