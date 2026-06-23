import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const testId = searchParams.get('testId');
        const submissionId = searchParams.get('submissionId');

        if (submissionId && testId) {
            // Fetch specific submission details
            const { data: questions, error: qErr } = await supabaseAdmin
                .from('test_questions')
                .select('*')
                .eq('test_id', testId)
                .order('order_index', { ascending: true });

            if (qErr) throw qErr;

            const { data: answers, error: aErr } = await supabaseAdmin
                .from('test_answers')
                .select('*')
                .eq('submission_id', submissionId);

            if (aErr) throw aErr;

            return NextResponse.json({ questions: questions || [], answers: answers || [] });
        } else if (testId) {
            // Fetch all submissions for a test
            const { data: subs, error: sErr } = await supabaseAdmin
                .from('test_submissions')
                .select('*, profiles!user_id(id, full_name, username)')
                .eq('test_id', testId)
                .order('created_at', { ascending: false });

            if (sErr) throw sErr;
            return NextResponse.json({ submissions: subs || [] });
        }

        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    } catch (err: any) {
        console.error('Admin fetch error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
