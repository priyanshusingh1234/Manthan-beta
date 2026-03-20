import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

function parseJwtField(bearer?: string | null, field = 'sub') {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return JSON.parse(json)?.[field] ?? null;
    } catch (err) {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const studentId = parseJwtField(auth, 'sub') || parseJwtField(auth, 'user_id');
        if (!studentId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { questionId, teacherId, rating } = await req.json();

        if (!questionId || !teacherId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        // Upsert into teacher_reviews
        const { data: existingReview, error: checkError } = await supabaseAdmin
            .from('teacher_reviews')
            .select('id')
            .eq('student_id', studentId)
            .eq('question_id', questionId)
            .maybeSingle();

        if (existingReview) {
            // Update existing review
            const { error: updateError } = await supabaseAdmin
                .from('teacher_reviews')
                .update({ rating })
                .eq('id', existingReview.id);

            if (updateError) throw updateError;
        } else {
            // Insert new review
            const { error: insertError } = await supabaseAdmin
                .from('teacher_reviews')
                .insert({
                    teacher_id: teacherId,
                    student_id: studentId,
                    question_id: questionId,
                    rating
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true, message: 'Rating submitted successfully' });

    } catch (err: any) {
        console.error('Submit Rating Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
