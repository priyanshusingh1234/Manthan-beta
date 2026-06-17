import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const token = auth.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Determine the current "Boss Date" string (e.g., "2023-10-25") based on 7 PM rollover.
    const now = new Date();
    // Use IST timezone (UTC+5:30) to calculate 7 PM
    const utcOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + utcOffset);
    
    // If before 19:00 (7 PM), the boss belongs to the previous day
    if (istTime.getUTCHours() < 19) {
      istTime.setUTCDate(istTime.getUTCDate() - 1);
    }
    
    // Create a seed string based on the active boss date
    const bossDateSeed = `${istTime.getUTCFullYear()}-${istTime.getUTCMonth() + 1}-${istTime.getUTCDate()}`;

    // Get all hard MCQ questions to pick one consistently
    const { data: allHard, error: fetchErr } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('difficulty', 'Hard')
      .eq('question_type', 'mcq');

    if (fetchErr || !allHard || allHard.length === 0) {
      // Fallback: Just grab any MCQ if no Hard ones exist
      const { data: fallback } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('question_type', 'mcq')
        .limit(100);
        
      if (!fallback || fallback.length === 0) {
        return NextResponse.json({ error: "No questions found for boss" }, { status: 404 });
      }
      
      const seedNumber = bossDateSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const chosenIndex = seedNumber % fallback.length;
      const chosenId = fallback[chosenIndex].id;
      
      const { data: question } = await supabaseAdmin.from('questions').select('*').eq('id', chosenId).single();
      return NextResponse.json({ question, bossDate: bossDateSeed });
    }

    // Simple deterministic PRNG based on the date string
    let seed = 0;
    for (let i = 0; i < bossDateSeed.length; i++) {
      seed = Math.imul(31, seed) + bossDateSeed.charCodeAt(i) | 0;
    }
    // ensure positive
    seed = Math.abs(seed);
    
    const chosenIndex = seed % allHard.length;
    const chosenId = allHard[chosenIndex].id;

    const { data: question, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('id', chosenId)
      .single();

    if (qErr || !question) {
      return NextResponse.json({ error: "Failed to load boss question" }, { status: 500 });
    }

    if (question && typeof question.options === 'string') {
      try {
        question.options = JSON.parse(question.options);
      } catch (e) {
        question.options = [];
      }
    }

    // Optionally strip 'hint' from response if we want to secure it, but the current client reads `q.hint` directly.
    return NextResponse.json({ question, bossDate: bossDateSeed });

  } catch (error: any) {
    console.error("Daily boss error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
