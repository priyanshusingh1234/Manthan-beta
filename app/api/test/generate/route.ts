import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const classGrade = req.nextUrl.searchParams.get('classGrade');
        const subject    = req.nextUrl.searchParams.get('subject');       // NEW: filter by subject
        const difficulty = req.nextUrl.searchParams.get('difficulty') || 'hard';
        const limitStr   = req.nextUrl.searchParams.get('limit') || '40';
        const limit      = parseInt(limitStr, 10);

        let query = supabaseAdmin
            .from('questions')
            .select('id, title, options, correct_option, subject, difficulty, class_grade, image_url')
            .eq('difficulty', difficulty)
            .not('options', 'is', null) // Must be MCQ
            .limit(100); // fetch more than needed to shuffle

        // Apply filters conditionally
        if (classGrade) query = query.eq('class_grade', classGrade);
        if (subject)    query = query.ilike('subject', `%${subject}%`); // case-insensitive partial match

        const { data, error } = await query;

        if (error) throw error;

        // Ensure questions actually have valid options arrays
        const validQs = (data || []).filter(q => Array.isArray(q.options) && q.options.length >= 2);

        // Fisher-Yates shuffle
        for (let i = validQs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validQs[i], validQs[j]] = [validQs[j], validQs[i]];
        }

        const selected = validQs.slice(0, limit);

        if (selected.length === 0) {
            return NextResponse.json({ error: 'No questions found for the given filters. Please add questions first.' }, { status: 404 });
        }

        return NextResponse.json({ test: selected });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
