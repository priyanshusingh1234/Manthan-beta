import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const postId = params.id;
        if (!postId) return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });

        // Check if like exists
        const { data: existingLike } = await supabaseAdmin
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: post } = await supabaseAdmin
            .from('posts')
            .select('likes_count')
            .eq('id', postId)
            .single();

        let currentCount = post?.likes_count || 0;

        if (existingLike) {
            // Unlike it
            await supabaseAdmin.from('post_likes').delete().eq('id', existingLike.id);
        } else {
            // Like it
            await supabaseAdmin.from('post_likes').insert({ post_id: postId, user_id: user.id });
        }

        const { count: freshCount } = await supabaseAdmin
            .from('post_likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', postId);

        currentCount = freshCount ?? currentCount;

        await supabaseAdmin.from('posts').update({ likes_count: currentCount }).eq('id', postId);

        return NextResponse.json({ success: true, is_liked: !existingLike, likes_count: currentCount });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
