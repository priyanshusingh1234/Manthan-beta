import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const classGrade = req.nextUrl.searchParams.get('classGrade') || '9';
        const limitStr = req.nextUrl.searchParams.get('limit') || '40';
        const limit = parseInt(limitStr, 10);

        // Fetch 40 random hard questions for the specified class
        const { data, error } = await supabaseAdmin
            .from('questions')
            .select('id, title, options, correct_option, subject, difficulty, class_grade, image_url')
            .eq('class_grade', classGrade)
            .eq('difficulty', 'hard')
            .not('options', 'is', null) // Must be MCQ
            .limit(100); // fetch more to shuffle

        if (error) throw error;

        // Ensure questions actually have valid options arrays
        const validQs = (data || []).filter(q => Array.isArray(q.options) && q.options.length >= 2);

        // Fisher-Yates shuffle
        for (let i = validQs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validQs[i], validQs[j]] = [validQs[j], validQs[i]];
        }

        const selected = validQs.slice(0, limit);

        return NextResponse.json({ test: selected });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
