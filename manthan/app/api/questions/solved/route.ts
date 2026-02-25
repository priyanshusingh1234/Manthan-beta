import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function parseJwtField(bearer?: string | null, field = 'sub') {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return JSON.parse(json)?.[field] ?? null;
    } catch (err) {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUserId = parseJwtField(authHeader, 'sub') || parseJwtField(authHeader, 'user_id');

        if (!currentUserId || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Unauthorized or DB not configured' }, { status: 401 });
        }

        // Get all question IDs the user has attempted or submitted a written answer for
        const { data: qAttempts } = await supabaseAdmin.from('question_attempts').select('question_id').eq('user_id', currentUserId);
        const { data: wSubs } = await supabaseAdmin.from('written_submissions').select('id, question_id').eq('student_id', currentUserId);

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

        const { data: questions, error } = await supabaseAdmin
            .from('questions')
            .select('*')
            .in('id', Array.from(solvedQids))
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        const rows = questions || [];

        // Fetch poster names
        const userIds = Array.from(new Set(rows.map((r: any) => r.created_by).filter(Boolean))) as string[];
        const userInfoMap: Record<string, { name: string; avatar?: string | null; username?: string | null }> = {};
        await Promise.all(userIds.map(async (id) => {
            try {
                const { data: fetchedUser } = await supabaseAdmin.auth.admin.getUserById(String(id));
                const meta = (fetchedUser as any)?.user_metadata ?? (fetchedUser as any)?.user?.user_metadata ?? {};
                const name = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || 'Teacher';
                const avatar = meta?.avatar_url || meta?.avatar || null;
                userInfoMap[id] = { name, avatar, username: meta?.username || null };
            } catch (err) {
                userInfoMap[id] = { name: 'Teacher', avatar: null, username: null };
            }
        }));

        // Fetch attempt counts for these questions
        const questionIds = rows.map((r: any) => r.id);
        let attemptsMap: Record<string, { total: number; solved: number }> = {};
        if (questionIds.length > 0) {
            const { data: attempts } = await supabaseAdmin.from('question_attempts').select('question_id, is_correct').in('question_id', questionIds);
            attempts?.forEach((att: any) => {
                const qid = String(att.question_id);
                if (!attemptsMap[qid]) attemptsMap[qid] = { total: 0, solved: 0 };
                attemptsMap[qid].total += 1;
                if (att.is_correct) attemptsMap[qid].solved += 1;
            });
        }

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
