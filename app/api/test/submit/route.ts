import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';
import { leaderboardCache } from '@/lib/leaderboardCache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { testId, answers, score, maxScore, timeTaken, accuracy } = await req.json();

        // 1. Store the test result
        const { error: logErr } = await supabaseAdmin.from('test_results' as any).insert({
            user_id: user.id,
            test_id: testId,
            score,
            max_score: maxScore,
            time_taken: timeTaken,
            accuracy,
            completed_at: new Date().toISOString(),
            metadata: { answers_snapshot: answers }
        });

        if (logErr) {
            console.error('[test/submit] DB insert failed:', logErr);
            return NextResponse.json({ error: logErr.message, details: logErr }, { status: 500 });
        }

        // 2. Check if gauntlet has a reward threshold — if so, award bonus points
        let bonusPointsAwarded = 0;
        let bonusMessage = null;

        const { data: gauntlet } = await supabaseAdmin
            .from('gauntlets' as any)
            .select('reward_points, reward_threshold_percent, title')
            .eq('slug', testId)
            .maybeSingle();

        if (gauntlet && gauntlet.reward_points > 0 && gauntlet.reward_threshold_percent > 0) {
            const thresholdScore = Math.round((gauntlet.reward_threshold_percent / 100) * maxScore);
            if (score >= thresholdScore) {
                // Award bonus points
                const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(user.id);
                if (userResp?.user) {
                    const meta = userResp.user.user_metadata || {};
                    const currentPoints = Number(meta.totalPoints) || 0;
                    const newTotal = currentPoints + gauntlet.reward_points;

                    await supabaseAdmin.auth.admin.updateUserById(user.id, {
                        user_metadata: { ...meta, totalPoints: newTotal }
                    });
                    await upsertProfile(user.id, { ...meta, totalPoints: newTotal });
                    leaderboardCache.invalidate();

                    bonusPointsAwarded = gauntlet.reward_points;
                    bonusMessage = `🎉 You scored above ${gauntlet.reward_threshold_percent}% and earned +${gauntlet.reward_points} bonus points!`;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Results synchronized to the Arena Records.',
            finalScore: score,
            bonusPointsAwarded,
            bonusMessage,
        });
    } catch (err: any) {
        console.error('[test/submit] CRITICAL error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
