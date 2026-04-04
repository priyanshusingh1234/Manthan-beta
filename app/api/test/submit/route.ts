import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/submit
 * Centralized logging for ALL exhibition tests and gauntlets.
 * Stores detailed records: who, score, time, accuracy, and which questions were answered.
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { testId, answers, score, maxScore, timeTaken, accuracy } = await req.json();

        // 1. Log each question attempt for global leaderboard points
        // We assume 'answers' is an array of { questionId, isCorrect, selectedOption }
        if (Array.isArray(answers)) {
            const attempts = answers.map((a: any) => ({
                user_id: user.id,
                question_id: a.questionId,
                is_correct: a.isCorrect,
                points_awarded: a.isCorrect ? 3 : 0,
            })).filter(a => a.question_id);

            if (attempts.length > 0) {
                // Batch insert into question_attempts to update points
                await supabaseAdmin.from('question_attempts').insert(attempts);
            }
        }

        // 2. Store aggregated test result in 'test_results'
        // If the table exists, it'll save. If not, it gracefully continues.
        const { error: logErr } = await supabaseAdmin.from('test_results' as any).insert({
            user_id: user.id,
            test_id: testId,
            score,
            max_score: maxScore,
            time_taken: timeTaken,
            accuracy,
            completed_at: new Date().toISOString()
        });

        if (logErr) console.warn('[test/submit] Aggregation log failed:', logErr.message);

        // 3. Notify Admin of this completion (High-fidelity notification)
        const adminEmail = process.env.ADMIN_EMAIL || 'priyanshusingh1234@gmail.com';
        const { data: adminUser } = await supabaseAdmin.auth.admin.listUsers();
        const mainAdmin = (adminUser?.users || []).find(u => u.email === adminEmail);

        if (mainAdmin) {
            await createNotification({
                userId: mainAdmin.id,
                type: 'points_earned',
                title: '🔥 New Achievement Unlocked!',
                body: `${user.user_metadata?.fullName || user.email} just cleared the ${testId} with ${score}/${maxScore} points!`,
                href: `/tests`,
                actorId: user.id,
                actorName: user.user_metadata?.fullName || 'Scholar'
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Results synchronized to the Arena Records.',
            finalScore: score
        });
    } catch (err: any) {
        console.error('[test/submit] CRITICAL error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
