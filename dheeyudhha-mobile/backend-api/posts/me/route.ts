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

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username, avatar_url, school, is_teacher, total_points')
            .eq('id', user.id)
            .maybeSingle();

        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('id, content, image_url, created_at, likes_count, comments_count, post_likes(user_id)')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map((post: any) => ({
            ...post,
            likes_count: Array.isArray(post.post_likes) ? post.post_likes.length : (post.likes_count || 0),
            author: {
                id: user.id,
                name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Scholar',
                username: profile?.username || user.user_metadata?.username || null,
                avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                school: profile?.school || user.user_metadata?.school || null,
                isTeacher: profile?.is_teacher || user.user_metadata?.isTeacher || false,
                totalPoints: Number(profile?.total_points) || 0,
            },
        }));

        return NextResponse.json(normalized);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch posts' }, { status: 500 });
    }
}
