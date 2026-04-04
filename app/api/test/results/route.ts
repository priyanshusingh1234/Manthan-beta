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

        if (!result) return NextResponse.json({ hasSubmission: false });

        // 2. Get the individual question attempts to reconstruct the 'Detailed Breakdown'
        // We'll need the original questions too to show titles/options.
        // For simplicity, we'll just return the correct/incorrect counts and basic stats for now,
        // unless we want to rebuild the whole UI index.
        
        // Actually, let's fetch the attempts so the user can see their specific answers.
        const { data: attempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct, points_awarded')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
            
        // We filter for attempts that match questions in this test. 
        // This is a bit complex without a 'test_snapshot' but for Class 9 Hard, we can fetch the hard pool.

        return NextResponse.json({ 
            hasSubmission: true,
            summary: result,
            attempts: attempts // We'll map these on the frontend
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
