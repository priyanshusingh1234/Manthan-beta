import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { data: comments, error } = await supabaseAdmin
            .from('post_comments')
            .select('*')
            .eq('post_id', params.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich comments with author metadata
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const usersMap = new Map((authUsers.users || []).map(u => [u.id, u.user_metadata]));

        const enriched = (comments || []).map(c => {
            const meta = usersMap.get(c.author_id) || {};
            return {
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                author: {
                    name: meta.fullName || meta.name || 'Unknown',
                    avatar_url: meta.avatar_url || null,
                    isTeacher: meta.isTeacher || false,
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

        const { content } = await req.json();
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

        // Increment post comments count
        const { data: post } = await supabaseAdmin
            .from('posts')
            .select('comments_count')
            .eq('id', params.id)
            .single();

        await supabaseAdmin
            .from('posts')
            .update({ comments_count: (post?.comments_count || 0) + 1 })
            .eq('id', params.id);

        const meta = user.user_metadata || {};
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
