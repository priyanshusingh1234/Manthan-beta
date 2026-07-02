import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

function getCategory(subject: string): string {
  if (!subject) return 'Other';
  const s = subject.toLowerCase().trim();
  if (['physics', 'chemistry', 'biology', 'science'].some(k => s.includes(k))) return 'Science';
  if (['history', 'civics', 'geography', 'economics', 'social science', 'sst', 'political'].some(k => s.includes(k))) return 'SST';
  if (s.includes('math')) return 'Maths';
  if (s.includes('hindi')) return 'Hindi';
  if (s.includes('english')) return 'English';
  return subject;
}

export async function GET(req: NextRequest) {
  try {
    const bearer = req.headers.get('authorization');
    const token = bearer?.replace(/^Bearer\s+/i, '') ?? '';

    let classGrade: string | null = null;
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        classGrade = user.user_metadata?.classGrade?.toString()
          || user.user_metadata?.grade?.toString()
          || null;

        // Fallback: check profiles table
        if (!classGrade) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('class_grade')
            .eq('id', user.id)
            .single();
          classGrade = profile?.class_grade || null;
        }
      }
    }

    let query = supabaseAdmin
      .from('questions')
      .select('chapter, subject')
      .not('chapter', 'is', null)
      .not('chapter', 'eq', '');

    if (classGrade) {
      query = query.in('class_grade', [classGrade, 'All', 'Any']);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching chapters:', error);
      return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
    }

    // Group by category -> chapter (deduplicate chapters)
    const grouped = new Map<string, Set<string>>();
    questions.forEach((q) => {
      const cat = getCategory(q.subject);
      if (!grouped.has(cat)) grouped.set(cat, new Set());
      grouped.get(cat)!.add(q.chapter);
    });

    const result: Record<string, string[]> = {};
    // Sort categories by priority
    const PRIORITY_ORDER = ['Science', 'Maths', 'SST', 'English', 'Hindi'];
    const allCats = [...grouped.keys()].sort((a, b) => {
      const ai = PRIORITY_ORDER.indexOf(a);
      const bi = PRIORITY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    for (const cat of allCats) {
      result[cat] = Array.from(grouped.get(cat)!).sort();
    }

    return NextResponse.json({ categories: result, classGrade });
  } catch (e) {
    console.error('Error in /api/practice/chapters:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
