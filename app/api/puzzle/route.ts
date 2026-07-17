import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ── The Puzzle ──────────────────────────────────────────────────────────────
const PUZZLE = {
  id: 'snail-well-v1',
  title: 'The Snail in the Well 🐌',
  question: `A snail is at the bottom of a 20-foot well. Each day it climbs up 5 feet, but each night it slides back down 4 feet. How many days will it take for the snail to reach the top?`,
  hint: `The snail doesn't slide back down on the day it finally reaches the top!`,
  answer: 16,
  reward_correct: 10,
  reward_wrong: 0,
};

async function getUser(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await anon.auth.getUser(token);
    return error ? null : user;
  } catch { return null; }
}

// GET — fetch puzzle + user's existing attempt
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req.headers.get('authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user already answered
    const { data: existing } = await supabaseAdmin
      .from('puzzle_attempts')
      .select('user_answer, is_correct, submitted_at')
      .eq('user_id', user.id)
      .eq('puzzle_id', PUZZLE.id)
      .maybeSingle();

    return NextResponse.json({
      puzzle: {
        id: PUZZLE.id,
        title: PUZZLE.title,
        question: PUZZLE.question,
        hint: PUZZLE.hint,
        reward_correct: PUZZLE.reward_correct,
      },
      attempt: existing ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — submit answer
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req.headers.get('authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const userAnswer = Number(body.answer);

    if (!Number.isInteger(userAnswer) || userAnswer < 1 || userAnswer > 99) {
      return NextResponse.json({ error: 'Answer must be an integer between 1 and 99' }, { status: 400 });
    }

    // Check if already answered
    const { data: existing } = await supabaseAdmin
      .from('puzzle_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('puzzle_id', PUZZLE.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
    }

    const is_correct = userAnswer === PUZZLE.answer;

    // Save attempt
    await supabaseAdmin.from('puzzle_attempts').insert({
      user_id: user.id,
      puzzle_id: PUZZLE.id,
      user_answer: userAnswer,
      is_correct,
      submitted_at: new Date().toISOString(),
    });

    // Award points + title if correct
    if (is_correct) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('total_points, monthly_points, cosmetics')
        .eq('id', user.id)
        .single();

      const currentCosmetics: string[] = Array.isArray(profile?.cosmetics) ? profile.cosmetics : [];
      const newTitle = 'puzzle_title:Slow & Steady';

      // Add title only if not already owned
      if (!currentCosmetics.includes(newTitle)) {
        currentCosmetics.push(newTitle);
      }

      await supabaseAdmin.from('profiles').update({
        total_points: (profile?.total_points || 0) + PUZZLE.reward_correct,
        monthly_points: (profile?.monthly_points || 0) + PUZZLE.reward_correct,
        cosmetics: currentCosmetics,
      }).eq('id', user.id);
    }

    return NextResponse.json({
      is_correct,
      correct_answer: PUZZLE.answer,
      reward: is_correct ? PUZZLE.reward_correct : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
