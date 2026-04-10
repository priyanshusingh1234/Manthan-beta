import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('id, content, image_url, created_at, likes_count, comments_count, post_likes(user_id)')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map((post: any) => ({
            ...post,
            likes_count: Array.isArray(post.post_likes) ? post.post_likes.length : (post.likes_count || 0),
        }));

        return NextResponse.json(normalized);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch posts' }, { status: 500 });
    }
}
