import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getProfilesMap } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: verify user token using anon-key client
// ─────────────────────────────────────────────────────────────────────────────
async function getVerifiedUser(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const user = await getVerifiedUser(authHeader);
        const currentUserId = user?.id;

        if (!currentUserId || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Unauthorized or DB not configured' }, { status: 401 });
        }

        // Get recent question IDs the user has attempted or submitted a written answer for
        const { data: qAttempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(100);

        const { data: wSubs } = await supabaseAdmin
            .from('written_submissions')
            .select('id, question_id')
            .eq('student_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(50);

        let solvedQids = new Set<string>();
        let userWrittenSubmissions: Record<string, string> = {};

        qAttempts?.forEach((a: any) => solvedQids.add(String(a.question_id)));
        wSubs?.forEach((s: any) => {
            solvedQids.add(String(s.question_id));
            userWrittenSubmissions[String(s.question_id)] = String(s.id);
        });

        if (solvedQids.size === 0) {
            return NextResponse.json([]);
        }

        const validQids = Array.from(solvedQids).slice(0, 100);

        const { data: savedQs } = await supabaseAdmin
            .from('saved_questions')
            .select('question_id')
            .eq('user_id', currentUserId)
            .in('question_id', validQids);
        
        let userSaved = new Set<string>();
        savedQs?.forEach((s: any) => userSaved.add(String(s.question_id)));

        const { data: questions, error } = await supabaseAdmin
            .from('questions')
            .select('*')
            .in('id', validQids)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        const rows = questions || [];

        // Fetch poster names efficiently using the profiles table
        const userIds = Array.from(new Set(rows.map((r: any) => String(r.created_by)).filter(Boolean))) as string[];
        const profilesMap = await getProfilesMap(userIds);
        
        const userInfoMap: Record<string, { name: string; avatar?: string | null; username?: string | null }> = {};
        for (const id of userIds) {
            const profile = profilesMap.get(id);
            if (profile) {
                userInfoMap[id] = {
                    name: profile.full_name || 'Teacher',
                    avatar: profile.avatar_url,
                    username: profile.username
                };
            } else {
                userInfoMap[id] = { name: 'Teacher', avatar: null, username: null };
            }
        }

        // Omit overall attempt counts for the library page to drastically improve load times
        let attemptsMap: Record<string, { total: number; solved: number }> = {};

        const apps = rows.map((r: any) => ({
            id: String(r.id),
            createdBy: r.created_by ? String(r.created_by) : null,
            createdByName: r.created_by ? (userInfoMap[String(r.created_by)]?.name || 'Teacher') : 'Teacher',
            createdByAvatar: r.created_by ? (userInfoMap[String(r.created_by)]?.avatar || null) : null,
            createdByUsername: r.created_by ? (userInfoMap[String(r.created_by)]?.username || null) : null,
            title: r.title,
            body: r.body,
            subject: r.subject,
            classGrade: r.class_grade,
            points: r.points,
            timeLimit: r.time_limit,
            difficulty: r.difficulty || null,
            options: r.options || null,
            correctOption: typeof r.correct_option === 'number' ? r.correct_option : null,
            totalAttempts: attemptsMap[String(r.id)]?.total || 0,
            solvedCount: attemptsMap[String(r.id)]?.solved || 0,
            hasAttempted: true,
            hasWrittenSubmission: !!userWrittenSubmissions[String(r.id)],
            userSubmissionId: userWrittenSubmissions[String(r.id)] || null,
            isSaved: userSaved.has(String(r.id)),
            imagePath: r.image_path || null,
            imageUrl: r.image_url || null,
            createdAt: r.created_at,
        }));

        return NextResponse.json(apps);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Could not fetch solved questions' }, { status: 500 });
    }
}
