import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || '';

    if (!name) return NextResponse.json({ error: 'Missing name param' }, { status: 400 });

    // Find user by name in profiles table
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, total_points')
        .ilike('full_name', `%${name}%`)
        .limit(5);

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ error: 'No user found with that name' });
    }

    const results = await Promise.all(profiles.map(async (p: any) => {
        const { count: attemptCount } = await supabaseAdmin
            .from('question_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.id);

        const { count: correctCount } = await supabaseAdmin
            .from('question_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.id)
            .eq('is_correct', true);

        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id);
        const authPoints = Number(authUser?.user?.user_metadata?.totalPoints) || 0;
        const dbPoints = Number(p.total_points) || 0;

        // Calculate what points SHOULD be based on correct attempts
        const { data: correctAttempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct')
            .eq('user_id', p.id)
            .eq('is_correct', true);

        const questionIds = (correctAttempts || []).map((a: any) => a.question_id);
        let expectedPoints = 0;
        if (questionIds.length > 0) {
            const { data: questions } = await supabaseAdmin
                .from('questions')
                .select('id, points')
                .in('id', questionIds);
            expectedPoints = (questions || []).reduce((sum: number, q: any) => sum + (q.points || 0), 0);
        }

        return {
            id: p.id,
            full_name: p.full_name,
            username: p.username,
            db_points: dbPoints,
            auth_meta_points: authPoints,
            total_attempts: attemptCount,
            correct_attempts: correctCount,
            expected_points_from_correct_solves: expectedPoints,
            diagnosis: dbPoints === 0 && (correctCount || 0) > 0
                ? '❌ POINTS NOT SYNCED — correct attempts exist but points are 0'
                : authPoints !== dbPoints
                ? `⚠️ MISMATCH — Auth says ${authPoints} but DB profiles says ${dbPoints}`
                : '✅ OK'
        };
    }));

    return NextResponse.json({ results });
}
