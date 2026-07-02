import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const chapter = searchParams.get('chapter') || '';
    const cursor = searchParams.get('cursor') || null; // last seen question id
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 40);

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('questions')
      .select('id, question_text, title, body, image_url, image_path, options, correct_option, explanation, explanation_image_url, points, time_limit, difficulty, subject, chapter, class_grade, question_type, match_pairs, is_mcq, created_by')
      .ilike('chapter', `%${chapter}%`)
      .order('id', { ascending: true })
      .limit(limit);

    // Cursor-based pagination: only fetch questions with id > cursor
    if (cursor) {
      query = query.gt('id', cursor);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching practice questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const lastItem = questions && questions.length > 0 ? questions[questions.length - 1] : null;
    const nextCursor = questions?.length === limit ? lastItem?.id : null;

    return NextResponse.json({
      questions: questions || [],
      nextCursor,
      hasMore: nextCursor !== null,
    });
  } catch (e) {
    console.error('Error in /api/practice/questions:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
