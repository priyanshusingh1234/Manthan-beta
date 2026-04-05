import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';


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

        // 1. Store aggregated test result in 'test_results' (Private Arena Records)
        // We no longer insert into 'question_attempts' for Arena challenges.
        // This ensures gauntlet solves don't 'mess' with your normal daily feed/solved counters.
        // We save the 'answers' array as a snapshot so we can reconstruct the breakdown page.
        const { error: logErr } = await supabaseAdmin.from('test_results' as any).insert({
            user_id: user.id,
            test_id: testId,
            score,
            max_score: maxScore,
            time_taken: timeTaken,
            accuracy,
            completed_at: new Date().toISOString(),
            metadata: { 
                answers_snapshot: answers 
            }
        });

        if (logErr) console.warn('[test/submit] Aggregation log failed:', logErr.message);



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
