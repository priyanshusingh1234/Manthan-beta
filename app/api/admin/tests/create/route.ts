import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

        if (authErr || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
            .split(',').map(e => e.trim().toLowerCase());
        
        const userEmail = user.email?.toLowerCase() || '';
        const isAdmin = ['kpk22128@gmail.com', 's61038955@gmail.com', ...ADMIN_EMAILS].includes(userEmail);

        if (!isAdmin) {
            return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
        }

        const body = await req.json();
        const { testDetails, questions } = body;

        if (!testDetails || !testDetails.title || !testDetails.subject) {
            return NextResponse.json({ error: 'Missing required test details' }, { status: 400 });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: 'A test must have at least one question' }, { status: 400 });
        }

        // 1. Insert Test
        const { data: testData, error: testErr } = await supabaseAdmin
            .from('tests')
            .insert({
                title: testDetails.title,
                description: testDetails.description || '',
                subject: testDetails.subject,
                duration: parseInt(testDetails.duration, 10) || 60,
                test_type: testDetails.type || 'subjective',
                class_grade: testDetails.class_grade || '10',
            })
            .select('id')
            .single();

        if (testErr) {
            console.error('[create-test] insert test error:', testErr);
            throw new Error(`Failed to create test record: ${testErr.message}`);
        }

        const testId = testData.id;

        // 2. Prepare and Insert Questions
        const questionsToInsert = questions.map((q: any, idx: number) => {
            const isMcq = q.type === 'mcq';
            return {
                test_id: testId,
                question_text: q.question_text,
                type: q.type,
                options: isMcq ? q.options : null,
                correct_option: isMcq ? q.correct_option : null,
                order_index: idx,
                max_marks: parseInt(q.max_marks, 10) || (isMcq ? 1 : 5)
            };
        });

        const { error: qErr } = await supabaseAdmin
            .from('test_questions')
            .insert(questionsToInsert);

        if (qErr) {
            console.error('[create-test] insert questions error:', qErr);
            // Optionally rollback test creation if questions fail
            await supabaseAdmin.from('tests').delete().eq('id', testId);
            throw new Error(`Failed to insert questions: ${qErr.message}`);
        }

        return NextResponse.json({ success: true, testId });
    } catch (err: any) {
        console.error('[create-test] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
