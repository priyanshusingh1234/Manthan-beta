import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getProfilesMap } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const query = req.nextUrl.searchParams.get('q');
        
        if (!query || query.length < 1) {
            return NextResponse.json({ users: [], posts: [], questions: [] });
        }

        const searchTerm = `%${query}%`;

        // Parallel fetch for speed
        const [usersRes, postsRes, questionsRes] = await Promise.all([
            // 1. Search Users
            supabaseAdmin
                .from('profiles')
                .select('id, full_name, username, avatar_url, school, is_teacher')
                .or(`full_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
                .limit(10),
            
            // 2. Search Posts
            supabaseAdmin
                .from('posts')
                .select('*')
                .ilike('content', searchTerm)
                .order('created_at', { ascending: false })
                .limit(10),
            
            // 3. Search Questions
            supabaseAdmin
                .from('questions')
                .select('*')
                .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const usersData = usersRes.data || [];
        const postsRaw = postsRes.data || [];
        const questionsRaw = questionsRes.data || [];

        // Enrich Posts and Questions with Author/Creator Profiles
        const authorIds = [
            ...new Set([
                ...postsRaw.map(p => p.author_id).filter(Boolean),
                ...questionsRaw.map(q => q.created_by).filter(Boolean)
            ])
        ];

        const profilesMap = await getProfilesMap(authorIds as string[]);

        // Normalize Posts
        const postsData = postsRaw.map(p => {
            const profile = profilesMap.get(p.author_id);
            return {
                ...p,
                author: {
                    id: p.author_id,
                    name: profile?.full_name || 'Student',
                    username: profile?.username || null,
                    avatar_url: profile?.avatar_url || null,
                    isTeacher: profile?.is_teacher || false
                }
            };
        });

        // Normalize Questions
        const questionsData = questionsRaw.map(q => {
            const profile = profilesMap.get(q.created_by);
            return {
                ...q,
                profiles: profile || {
                    full_name: 'Teacher',
                    avatar_url: null,
                    username: null,
                    is_teacher: true
                },
                class_grade: q.class_grade // QuestionCard might expect classGrade or class_grade
            };
        });

        return NextResponse.json({
            users: usersData,
            posts: postsData,
            questions: questionsData
        });

    } catch (err: any) {
        console.error('[Search API Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
