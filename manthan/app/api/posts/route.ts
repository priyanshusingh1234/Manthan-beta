import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET /api/posts - Fetch feed
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        const { data: posts, error } = await supabaseAdmin
            .from('posts')
            .select(`
                *,
                post_likes ( user_id )
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Enrich posts with author data
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const usersMap = new Map((authUsers.users || []).map(u => [u.id, u]));

        const enriched = (posts || []).map(p => {
            const author = usersMap.get(p.author_id);
            const meta = author?.user_metadata || {};
            
            return {
                id: p.id,
                content: p.content,
                image_url: p.image_url,
                likes_count: p.likes_count || 0,
                comments_count: p.comments_count || 0,
                created_at: p.created_at,
                is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
                author: {
                    id: p.author_id,
                    name: meta.fullName || meta.name || author?.email?.split('@')[0] || 'Unknown',
                    avatar_url: meta.avatar_url || null,
                    school: meta.school || null,
                    isTeacher: meta.isTeacher || false,
                }
            };
        });

        return NextResponse.json(enriched);
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

        const { content, imageUrl } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Post must contain text.' }, { status: 400 });
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .insert({
                author_id: user.id,
                content: content.trim(),
                image_url: imageUrl || null
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
