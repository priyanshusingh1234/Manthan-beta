import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const query = req.nextUrl.searchParams.get('q');
        const type = req.nextUrl.searchParams.get('type');
        const minLength = type === 'users' ? 1 : 2;
        
        if (!query || query.length < minLength) {
            return NextResponse.json({ users: [], posts: [], questions: [] });
        }

        const searchTerm = `%${query}%`;

        // 1. Search Users
        const { data: usersData } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url, school, is_teacher')
            .or(`full_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
            .limit(10);

        // 2. Search Posts
        const { data: postsData } = await supabaseAdmin
            .from('posts')
            .select('*, author:profiles(name:full_name, username, avatar_url)')
            .ilike('content', searchTerm)
            .order('created_at', { ascending: false })
            .limit(10);

        // 3. Search Questions
        const { data: questionsRaw } = await supabaseAdmin
            .from('questions')
            .select('*, creator:profiles(full_name, avatar_url, username)')
            .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
            .order('created_at', { ascending: false })
            .limit(10);

        const questionsData = (questionsRaw || []).map(q => ({
            ...q,
            createdByName: q.creator?.full_name || 'Teacher',
            createdByAvatar: q.creator?.avatar_url || null,
            createdByUsername: q.creator?.username || null
        }));

        return NextResponse.json({
            users: usersData || [],
            posts: postsData || [],
            questions: questionsData || []
        });

    } catch (err: any) {
        console.error('[Search API Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
