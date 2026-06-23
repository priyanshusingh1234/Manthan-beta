import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
        const adminEmails = ['kpk22128@gmail.com', 's61038955@gmail.com', ...envAdmins];
        const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '');

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const body = await req.json();
        const { submissionId, grades } = body;
        
        if (!submissionId || !Array.isArray(grades)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // 1. Update test_answers with new marks
        for (const g of grades) {
            if (!g.answerId || typeof g.marksAwarded !== 'number') continue;
            
            await supabaseAdmin
                .from('test_answers')
                .update({ marks_awarded: g.marksAwarded })
                .eq('id', g.answerId)
                .eq('submission_id', submissionId);
        }

        // 2. Recalculate total score
        const { data: allAnswers, error: ansErr } = await supabaseAdmin
            .from('test_answers')
            .select('marks_awarded')
            .eq('submission_id', submissionId);
            
        if (ansErr) throw ansErr;

        let totalScore = 0;
        allAnswers?.forEach(ans => {
            totalScore += (ans.marks_awarded || 0);
        });

        // 3. Update test_submissions
        const { error: subErr } = await supabaseAdmin
            .from('test_submissions')
            .update({ 
                total_score: totalScore,
                status: 'completed'
            })
            .eq('id', submissionId);
            
        if (subErr) throw subErr;

        return NextResponse.json({ success: true, newTotalScore: totalScore });

    } catch (err: any) {
        console.error('Admin grading error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
