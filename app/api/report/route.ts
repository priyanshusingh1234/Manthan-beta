import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

async function computeStats(userId: string, from: Date, to: Date) {
    // Fetch attempts joined with question data (subject, created_by, teacher name)
    const { data: attempts } = await supabaseAdmin
        .from('question_attempts')
        .select('question_id, is_correct, created_at, questions(subject, created_by, created_by_name)')
        .eq('user_id', userId)
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString());

    let activities: any[] = [];
    try {
        const res = await supabaseAdmin
            .from('activity_logs')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', from.toISOString())
            .lt('created_at', to.toISOString());
        if (!res.error) activities = res.data || [];
    } catch { /* optional table */ }

    const allTimestamps = [
        ...(attempts || []).map((a: any) => a.created_at),
        ...activities.map((a: any) => a.created_at),
    ];
    const activeDays = new Set(allTimestamps.map(ts => new Date(ts).toISOString().split('T')[0])).size;

    const totalAttempts = (attempts || []).length;
    const correctAttempts = (attempts || []).filter((a: any) => a.is_correct).length;
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    const accuracyScore = totalAttempts > 0 ? (accuracy / 100) * 40 : 0;
    const volumeScore = Math.min(totalAttempts * 2, 40);
    const consistencyScore = Math.min(activeDays * 4, 20);
    const totalScore = accuracyScore + volumeScore + consistencyScore;

    // Per-day breakdown
    const dailyMap: Record<string, { total: number; correct: number }> = {};
    for (const a of (attempts || [])) {
        const day = new Date((a as any).created_at).toISOString().split('T')[0];
        if (!dailyMap[day]) dailyMap[day] = { total: 0, correct: 0 };
        dailyMap[day].total += 1;
        if ((a as any).is_correct) dailyMap[day].correct += 1;
    }
    const daily = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
        return { label, total: dailyMap[key]?.total ?? 0, correct: dailyMap[key]?.correct ?? 0 };
    });

    // Subject breakdown
    const subjectMap: Record<string, { total: number; correct: number }> = {};
    for (const a of (attempts || [])) {
        const subject = (a as any).questions?.subject || 'General';
        if (!subjectMap[subject]) subjectMap[subject] = { total: 0, correct: 0 };
        subjectMap[subject].total += 1;
        if ((a as any).is_correct) subjectMap[subject].correct += 1;
    }
    const subjects = Object.entries(subjectMap)
        .map(([name, v]) => ({ name, ...v, accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Teacher breakdown – get names from profiles table
    const teacherMap: Record<string, { total: number; correct: number; name: string }> = {};
    for (const a of (attempts || [])) {
        const teacherId = (a as any).questions?.created_by;
        if (!teacherId) continue;
        if (!teacherMap[teacherId]) {
            teacherMap[teacherId] = {
                total: 0,
                correct: 0,
                name: (a as any).questions?.created_by_name || 'Teacher',
            };
        }
        teacherMap[teacherId].total += 1;
        if ((a as any).is_correct) teacherMap[teacherId].correct += 1;
    }

    // Resolve teacher names from profiles if not embedded
    const teacherIds = Object.keys(teacherMap);
    if (teacherIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', teacherIds);
        for (const p of (profiles || [])) {
            if (teacherMap[p.id]) {
                teacherMap[p.id].name = p.full_name || p.username || teacherMap[p.id].name;
            }
        }
    }

    const teachers = Object.entries(teacherMap)
        .map(([id, v]) => ({ id, ...v, accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    return { totalAttempts, correctAttempts, accuracy: Math.round(accuracy), activeDays, score: Math.round(totalScore), daily, subjects, teachers };
}

function buildRating(score: number, attempts: number) {
    if (score >= 80) return { label: 'Excellent', color: 'purple', message: 'Incredible work! You dominated this week. 🔥' };
    if (score >= 60) return { label: 'Very Good', color: 'green', message: 'Solid effort! A few more and you hit Excellent.' };
    if (score >= 40) return { label: 'Good', color: 'blue', message: 'Decent week. Try answering more questions next time.' };
    if (score >= 20) return { label: 'Not Bad', color: 'orange', message: 'You started — there is so much more you can do!' };
    if (attempts > 0) return { label: 'Poor', color: 'red', message: 'Rough week. Dust yourself off and try again!' };
    return { label: 'Not Rated', color: 'slate', message: 'Solve some questions to unlock your rating.' };
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [thisWeek, prevWeek] = await Promise.all([
            computeStats(currentUser.id, thisWeekStart, now),
            computeStats(currentUser.id, prevWeekStart, thisWeekStart),
        ]);

        return NextResponse.json({
            stats: thisWeek,
            prevStats: prevWeek,
            rating: buildRating(thisWeek.score, thisWeek.totalAttempts),
        });

    } catch (err: any) {
        console.error('[Weekly Report Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
