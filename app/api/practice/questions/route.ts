import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const chapter = searchParams.get('chapter') || '';
    const cursor = searchParams.get('cursor') || null;
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 40);

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter is required' }, { status: 400 });
    }

    // Optionally get the user so we can check solved status
    let userId: string | null = null;
    const bearer = req.headers.get('authorization');
    if (bearer) {
      const token = bearer.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // ── Fetch questions (cursor-based) ────────────────────────────────
    let query = supabaseAdmin
      .from('questions')
      .select('*, profiles(id, full_name, avatar_url, username, is_teacher, cosmetics)')
      .ilike('chapter', `%${chapter}%`)
      .order('id', { ascending: true })
      .limit(limit);

    if (cursor) {
      query = query.gt('id', cursor);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching practice questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // ── Fetch which of these questions the user has already solved ────
    let solvedSet = new Set<string>();
    if (userId && questions && questions.length > 0) {
      const qIds = questions.map((q: any) => q.id);
      const { data: attempts } = await supabaseAdmin
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', userId)
        .in('question_id', qIds);

      (attempts || []).forEach((a: any) => {
        if (a.is_correct) solvedSet.add(String(a.question_id));
      });
    }

    // ── Attach solved flag ────────────────────────────────────────────
    const enriched = (questions || []).map((q: any) => ({
      ...q,
      hasAttempted: solvedSet.has(String(q.id)) || false,
      hasFailed: false,
    }));

    const lastItem = enriched.length > 0 ? enriched[enriched.length - 1] : null;
    const nextCursor = enriched.length === limit ? lastItem?.id : null;

    return NextResponse.json({
      questions: enriched,
      nextCursor,
      hasMore: nextCursor !== null,
    });
  } catch (e) {
    console.error('Error in /api/practice/questions:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
