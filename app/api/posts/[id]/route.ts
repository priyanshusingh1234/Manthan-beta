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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .select(`
                *,
                post_likes ( user_id )
            `)
            .eq('id', params.id)
            .maybeSingle();

        if (error) throw error;
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        // Enrichment
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', post.author_id)
            .maybeSingle();

        let finalContent = post.content || '';
        let isPinned = false;
        if (finalContent.startsWith('[PINNED]')) {
            isPinned = true;
            finalContent = finalContent.substring(8).trim();
        }

        const likesCount = Array.isArray(post.post_likes) ? post.post_likes.length : (post.likes_count || 0);

        const enriched = {
            id: post.id,
            content: finalContent,
            is_pinned: isPinned,
            image_url: post.image_url || null,
            image_urls: post.image_urls || [],
            video_url: post.video_url || null,
            video_thumbnail: post.video_thumbnail || null,
            likes_count: likesCount,
            comments_count: post.comments_count || 0,
            created_at: post.created_at,
            is_liked_by_me: currentUserId ? (post.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
            author: {
                id: post.author_id,
                name: profile?.full_name || 'Unknown',
                username: profile?.username || null,
                avatar_url: profile?.avatar_url || null,
                school: profile?.school || null,
                isTeacher: profile?.is_teacher || false,
                totalPoints: Number(profile?.total_points) || 0,
            }
        };

        return NextResponse.json(enriched);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

import crypto from 'crypto';

// Extract Cloudinary public_id from secure_url (removes domain, upload/, versions, transforms, and extension)
function extractCloudinaryPublicId(url: string) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let p = parts[1];
        if (p.match(/^[a-z_0-9:,]+.*?\//)) {
            p = p.replace(/^[a-z_0-9:,]+\//, ''); // drop eager transforms
        }
        p = p.replace(/^v\d+\//, ''); // drop version
        return p.substring(0, p.lastIndexOf('.')); // drop extension
    } catch {
        return null;
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
            .select('id, author_id, image_url, image_urls, video_url')
            .eq('id', postId)
            .maybeSingle();

        if (postError) throw postError;
        if (!post) return NextResponse.json({ ok: true, alreadyDeleted: true });
        
        // Let admins override to delete any post (for pinned/spam control)
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
        const isAdmin = user.email && adminEmails.includes(user.email);
        
        if (!isAdmin && post.author_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Find all comments to delete their likes first to prevent FK constraint violations
        const { data: comments } = await supabaseAdmin.from('post_comments').select('id').eq('post_id', postId);
        if (comments && comments.length > 0) {
            const commentIds = comments.map((c: any) => c.id);
            // Delete comment likes
            await supabaseAdmin.from('comment_likes').delete().in('comment_id', commentIds).catch(() => {});
        }

        // Delete other referencing tables
        const { error: pcErr } = await supabaseAdmin.from('post_comments').delete().eq('post_id', postId);
        if (pcErr) console.error("post_comments delete error:", pcErr);

        const { error: plErr } = await supabaseAdmin.from('post_likes').delete().eq('post_id', postId);
        if (plErr) console.error("post_likes delete error:", plErr);

        await supabaseAdmin.from('post_saves').delete().eq('post_id', postId).catch(() => {});
        await supabaseAdmin.from('reports').delete().eq('post_id', postId).catch(() => {});

        // Delete Image(s) from Supabase Db
        let parsedImageUrls: string[] = [];
        if (post.image_urls) {
            try {
                parsedImageUrls = Array.isArray(post.image_urls)
                    ? post.image_urls
                    : JSON.parse(post.image_urls);
            } catch (e) {
                parsedImageUrls = [];
            }
        }

        const urlsToDelete = [...parsedImageUrls];
        if (post.image_url && !urlsToDelete.includes(post.image_url)) {
            urlsToDelete.push(post.image_url);
        }
            
        if (urlsToDelete.length > 0) {
            const pathsToRemove = urlsToDelete
                .map((url: string) => getStoragePathFromPublicUrl(url))
                .filter(Boolean);
            
            if (pathsToRemove.length > 0) {
                await supabaseAdmin.storage.from('public-images').remove(pathsToRemove);
            }
        }

        // Delete Video from Cloudinary Db
        if (post.video_url) {
            const public_id = extractCloudinaryPublicId(post.video_url);
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;

            if (public_id && cloudName && apiKey && apiSecret) {
                const timestamp = Math.round(Date.now() / 1000);
                const paramsToSign = `public_id=${public_id}&timestamp=${timestamp}`;
                const signature = crypto
                    .createHash('sha1')
                    .update(paramsToSign + apiSecret)
                    .digest('hex');

                const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`;
                const form = new FormData();
                form.append('public_id', public_id);
                form.append('timestamp', String(timestamp));
                form.append('api_key', apiKey);
                form.append('signature', signature);

                await fetch(cloudUrl, { method: 'POST', body: form }).catch(console.error);
            }
        }

        const { error: deletePostError } = await supabaseAdmin
            .from('posts')
            .delete()
            .eq('id', postId); // Handled permissions above with isAdmin

        if (deletePostError) throw deletePostError;

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to delete post' }, { status: 500 });
    }
}
