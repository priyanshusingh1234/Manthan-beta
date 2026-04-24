import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const { data: qs } = await supabaseAdmin.from('questions').select('id').eq('created_by', userId);
        const qids = (qs || []).map(q => q.id);

        if (qids.length === 0) {
            return NextResponse.json({ reached: 0, solves: 0, accuracy: 0 });
        }

        const { data: attempts } = await supabaseAdmin.from('question_attempts').select('user_id, is_correct').in('question_id', qids);

        if (!attempts) {
            return NextResponse.json({ reached: 0, solves: 0, accuracy: 0 });
        }

        const reached = new Set(attempts.map(a => a.user_id)).size;
        const solves = attempts.filter(a => a.is_correct).length;
        const accuracy = attempts.length > 0 ? Math.round((solves / attempts.length) * 100) : 0;

        return NextResponse.json({ reached, solves, accuracy });
    } catch (e) {
        console.error('Impact calculation error:', e);
        return NextResponse.json({ error: 'Failed to calculate impact' }, { status: 500 });
    }
}
