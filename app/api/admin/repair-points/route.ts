import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // 1. Get ALL attempts for this user
    const { data: allAttempts, error: aErr } = await supabaseAdmin
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', userId);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    const battlesAttempted = (allAttempts || []).length;
    const correctAttempts = (allAttempts || []).filter((a: any) => a.is_correct);
    const battlesWon = correctAttempts.length;

    // 2. Sum points from correct attempts
    const qIds = correctAttempts.map((a: any) => a.question_id);
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

    const updatedMeta = {
        ...meta,
        totalPoints,
        battlesAttempted,
        battlesWon,
    };

    // 4. Update Auth metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updatedMeta });

    // 5. Update profiles table
    await upsertProfile(userId, updatedMeta);

    const winRate = battlesAttempted > 0 ? Math.round((battlesWon / battlesAttempted) * 100) : 0;

    return NextResponse.json({
        success: true,
        userId,
        battlesAttempted,
        battlesWon,
        winRate: `${winRate}%`,
        totalPoints,
        message: `Repaired all stats for ${meta.fullName || meta.username || userId}`
    });
}
