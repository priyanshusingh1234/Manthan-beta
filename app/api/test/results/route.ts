import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const testId = req.nextUrl.searchParams.get('testId') || 'class-9-hard';

        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get the aggregate summary
        const { data: result } = await supabaseAdmin
            .from('test_results' as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('test_id', testId)
            .maybeSingle();

        if (result) {
            return NextResponse.json({ 
                hasSubmission: true,
                summary: result
            });
        }

        // 2. SMART FALLBACK: If table is missing or doesn't have a record, check question_attempts
        // This prevents the "infinite retry" bug even without the new table!
        const { data: recentAttempts } = await supabaseAdmin
            .from('question_attempts')
            .select('is_correct, created_at')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // last 1 hour
            .limit(50);
            
        if (recentAttempts && recentAttempts.length >= 10) {
            // Reconstruct a basic "Session Done" state
            const correctCount = recentAttempts.filter(a => a.is_correct).length;
            return NextResponse.json({ 
                hasSubmission: true,
                summary: {
                    user_id: user.id,
                    test_id: testId,
                    score: correctCount * 3,
                    max_score: recentAttempts.length * 3,
                    time_taken: 1800, // estimated
                    accuracy: Math.round((correctCount / recentAttempts.length) * 100),
                    metadata: { 
                        answers_snapshot: [], // no snapshot without table
                        isFallback: true 
                    }
                }
            });
        }

        return NextResponse.json({ hasSubmission: false });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
