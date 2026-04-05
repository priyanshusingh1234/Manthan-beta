import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const classGrade = req.nextUrl.searchParams.get('classGrade');
        const subject    = req.nextUrl.searchParams.get('subject');
        const difficulty = req.nextUrl.searchParams.get('difficulty') || 'hard';
        const limitStr   = req.nextUrl.searchParams.get('limit') || '40';
        const limit      = parseInt(limitStr, 10);

        let query = supabaseAdmin
            .from('questions')
            .select('id, title, options, correct_option, subject, difficulty, class_grade, image_url')
            .ilike('difficulty', difficulty)   // case-insensitive: matches 'hard', 'Hard', 'HARD'
            .not('options', 'is', null)
            .limit(200); // fetch extra to shuffle from

        // Apply optional filters (also case-insensitive)
        if (classGrade) query = query.ilike('class_grade', classGrade);
        if (subject)    query = query.ilike('subject', `%${subject}%`);

        const { data, error } = await query;

        if (error) throw error;

        // Ensure questions have valid options arrays (≥2 choices)
        const validQs = (data || []).filter(q => Array.isArray(q.options) && q.options.length >= 2);

        // Fisher-Yates shuffle
        for (let i = validQs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validQs[i], validQs[j]] = [validQs[j], validQs[i]];
        }

        const selected = validQs.slice(0, limit);

        if (selected.length === 0) {
            // Return debug info so we know exactly what was queried
            return NextResponse.json({
                error: `No questions found. Filters used: difficulty="${difficulty}", classGrade="${classGrade ?? 'any'}", subject="${subject ?? 'any'}". Total rows fetched before filter: ${(data || []).length}.`
            }, { status: 404 });
        }

        return NextResponse.json({ test: selected });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
