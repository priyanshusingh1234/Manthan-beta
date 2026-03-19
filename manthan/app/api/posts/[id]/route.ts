import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function getStoragePathFromPublicUrl(imageUrl: string): string | null {
    if (!imageUrl) return null;

    const marker = '/public-images/';
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return null;

    const rawPath = imageUrl.slice(idx + marker.length).split('?')[0];
    if (!rawPath) return null;

    try {
        return decodeURIComponent(rawPath);
    } catch {
        return rawPath;
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

        const postId = params.id;
        if (!postId) {
            return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });
        }

        const { data: post, error: postError } = await supabaseAdmin
            .from('posts')
            .select('id, author_id, image_url')
            .eq('id', postId)
            .maybeSingle();

        if (postError) throw postError;
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        if (post.author_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await supabaseAdmin.from('post_comments').delete().eq('post_id', postId);
        await supabaseAdmin.from('post_likes').delete().eq('post_id', postId);

        if (post.image_url) {
            const storagePath = getStoragePathFromPublicUrl(post.image_url);
            if (storagePath) {
                await supabaseAdmin.storage.from('public-images').remove([storagePath]);
            }
        }

        const { error: deletePostError } = await supabaseAdmin
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', user.id);

        if (deletePostError) throw deletePostError;

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to delete post' }, { status: 500 });
    }
}
