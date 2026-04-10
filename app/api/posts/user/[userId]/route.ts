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

        const { data: posts, error } = await supabaseAdmin
            .from('posts')
            .select(`
                *,
                post_likes ( user_id )
            `)
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Fetch profile data for the author
        const profilesMap = await getProfilesMap([userId]);
        const profile = profilesMap.get(userId);

        const enriched = (posts || []).map(p => {
            let finalContent = p.content || '';
            let isPinned = false;
            if (finalContent.startsWith('[PINNED]')) {
                isPinned = true;
                finalContent = finalContent.substring(8).trim();
            }
            const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);

            return {
                ...p,
                content: finalContent,
                is_pinned: isPinned,
                likes_count: likesCount,
                is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
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
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
