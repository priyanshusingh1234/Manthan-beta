import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfilesMap, upsertProfile } from "@/lib/profiles";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/createNotification";

export const dynamic = 'force-dynamic';

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
                    name: profile?.full_name || 'Unknown',
                    avatar_url: profile?.avatar_url || null,
                    isTeacher: profile?.is_teacher || false,
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

        // Send Notification to Replied User OR Post Author
        const notifyUserId = replying_to_user_id || post?.author_id;

        if (notifyUserId && notifyUserId !== user.id) {
            await createNotification({
                userId: notifyUserId,
                type: 'social_comment',
                title: replying_to_user_id ? 'New Reply on your Comment 💬' : 'New Comment on your Post 💬',
                body: `${authorName} wrote: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
                href: `/posts/${params.id}`,
                actorId: user.id,
                actorName: authorName,
                actorAvatar: meta.avatar_url,
            });
        }

        return NextResponse.json({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
                name: meta.fullName || meta.name || user.email?.split('@')[0],
                avatar_url: meta.avatar_url,
                isTeacher: meta.isTeacher || false,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
