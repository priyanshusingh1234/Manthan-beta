import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // 1. Get all CORRECT attempts for this user
    const { data: correctAttempts, error: aErr } = await supabaseAdmin
        .from('question_attempts')
        .select('question_id')
        .eq('user_id', userId)
        .eq('is_correct', true);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    const qIds = (correctAttempts || []).map((a: any) => a.question_id);

    // 2. Sum points from those questions
    let totalPoints = 0;
    if (qIds.length > 0) {
        const { data: questions } = await supabaseAdmin
            .from('questions')
            .select('points')
            .in('id', qIds);
        totalPoints = (questions || []).reduce((sum: number, q: any) => sum + (Number(q.points) || 0), 0);
    }

    // 3. Get current auth metadata to preserve other fields
    const { data: authResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (uErr || !authResp?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const meta = authResp.user.user_metadata || {};

    // 4. Update Auth metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { ...meta, totalPoints }
    });

    // 5. Update profiles table
    await upsertProfile(userId, { ...meta, totalPoints });

    return NextResponse.json({
        success: true,
        userId,
        correctSolves: qIds.length,
        newTotalPoints: totalPoints,
        message: `Repaired: set ${totalPoints} points for ${meta.fullName || meta.username || userId}`
    });
}
