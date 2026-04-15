import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getProfilesMap } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId;
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        // Try with join first, fall back to plain query if join fails
        let posts: any[] = [];
        let likesMap: Record<string, string[]> = {};

        try {
            const { data, error } = await supabaseAdmin
                .from('posts')
                .select(`*, post_likes ( user_id )`)
                .eq('author_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            posts = data || [];
            posts.forEach(p => {
                likesMap[p.id] = (p.post_likes || []).map((l: any) => l.user_id);
            });
        } catch (joinErr: any) {
            console.warn('[posts/user] join failed, falling back:', joinErr?.message);
            // Fallback: plain posts query + separate likes query
            const { data, error } = await supabaseAdmin
                .from('posts')
                .select('*')
                .eq('author_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            posts = data || [];

            if (posts.length > 0) {
                const postIds = posts.map((p: any) => p.id);
                const { data: likesData } = await supabaseAdmin
                    .from('post_likes')
                    .select('post_id, user_id')
                    .in('post_id', postIds);
                (likesData || []).forEach((l: any) => {
                    if (!likesMap[l.post_id]) likesMap[l.post_id] = [];
                    likesMap[l.post_id].push(l.user_id);
                });
            }
        }

        // Fetch profile data for the author
        const profilesMap = await getProfilesMap([userId]);
        const profile = profilesMap.get(userId);

        const enriched = posts.map(p => {
            let finalContent = p.content || '';
            let isPinned = false;
            if (finalContent.startsWith('[PINNED]')) {
                isPinned = true;
                finalContent = finalContent.substring(8).trim();
            }
            const postLikers = likesMap[p.id] || [];
            const likesCount = postLikers.length || p.likes_count || 0;

            return {
                ...p,
                content: finalContent,
                is_pinned: isPinned,
                likes_count: likesCount,
                is_liked_by_me: currentUserId ? postLikers.includes(currentUserId) : false,
                author: {
                    id: userId,
                    name: profile?.full_name || 'Student',
                    username: profile?.username || null,
                    avatar_url: profile?.avatar_url || null,
                    isTeacher: profile?.is_teacher || false
                }
            };
        });

        return NextResponse.json(enriched);
    } catch (err: any) {
        console.error('[posts/user] error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
