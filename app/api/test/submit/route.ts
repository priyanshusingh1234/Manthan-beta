import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/submit
 * Receives gauntlet results and syncs to central DB.
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { testId, answers, score, maxScore, timeTaken, accuracy } = await req.json();

        // 1. Sync individual question attempts to the central DB
        // This ensures the leaderboard points are updated automatically
        if (answers && typeof answers === 'object') {
            const attempts = Object.entries(answers).map(([qIdx, optIdx]: [string, any]) => {
                // Since we don't have the full question object here, we assume the scores are pre-calculated
                // But for real tracking, we'd need question IDs. 
                // Let's assume the frontend sends { questionId: string, isCorrect: boolean }
                return {
                    user_id: user.id,
                    question_id: optIdx.questionId,
                    is_correct: optIdx.isCorrect,
                    points_awarded: optIdx.isCorrect ? 3 : 0,
                };
            }).filter(a => a.question_id); // Ensure we have IDs

            if (attempts.length > 0) {
                await supabaseAdmin.from('question_attempts').insert(attempts);
            }
        }

        // 2. Log the High-Stakes Gauntlet Completion in test_results (try it, ignore if table missing)
        // This is for aggregate reporting
        try {
            await supabaseAdmin.from('test_results' as any).insert({
                user_id: user.id,
                test_id: testId || 'class-9-hard',
                score,
                max_score: maxScore,
                time_taken: timeTaken,
                accuracy,
                completed_at: new Date().toISOString()
            });
        } catch (e) {
            console.log("test_results table might be missing, skipped detail log.");
        }

        // 3. Notify Admins about this achievement
        const adminEmailsString = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
        const adminEmails = adminEmailsString.split(',').map(e => e.trim()).filter(Boolean);
        
        if (adminEmails.length > 0) {
           const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
           const adminIds = (adminUsers?.users || [])
             .filter(u => adminEmails.includes(u.email || ''))
             .map(u => u.id);

           for (const adminId of adminIds) {
               await createNotification({
                   userId: adminId,
                   type: 'points_earned', // Reusing an existing type for compatibility
                   title: '🔥 New Gauntlet Cleared!',
                   body: `${user.user_metadata?.fullName || user.email} just cleared the Gauntlet with ${score}/${maxScore} points!`,
                   href: `/admin/analytics?user=${user.id}`,
                   actorId: user.id,
                   actorName: user.user_metadata?.fullName || 'Scholar'
               });
           }
        }

        return NextResponse.json({ success: true, message: 'Gauntlet results synced to the Scroll of Honor.' });
    } catch (err: any) {
        console.error('[test/submit] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
