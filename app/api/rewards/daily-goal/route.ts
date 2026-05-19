import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function getDailyGoal(userId: string, dateStr: string) {
  const hashStr = userId + dateStr;
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) hash = (hash << 5) - hash + hashStr.charCodeAt(i);
  
  const subjects = ['Mathematics', 'English', 'Science', 'Social Science', 'Hindi'];
  const sub1Idx = Math.abs(hash) % subjects.length;
  const sub2Idx = Math.abs(hash >> 3) % (subjects.length - 1);
  
  const sub1 = subjects[sub1Idx];
  const remaining = subjects.filter(s => s !== sub1);
  const sub2 = remaining[sub2Idx];

  const count1 = 3 + (Math.abs(hash >> 6) % 3); // 3, 4, 5
  const count2 = 2 + (Math.abs(hash >> 9) % 3); // 2, 3, 4
  
  const finalCount1 = count1 + count2 > 10 ? 10 - count2 : count1;

  return { subject1: sub1, count1: finalCount1, subject2: sub2, count2: count2 };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const meta = user.user_metadata || {};
    
    if (meta.daily_goal_claimed_date === today) {
      return NextResponse.json({ error: 'Already claimed today' }, { status: 400 });
    }

    const goal = getDailyGoal(user.id, today);

    // Verify progress
    const todayStart = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    todayStart.setHours(0,0,0,0);
    const isoStart = todayStart.toISOString();

    const { data: attempts } = await supabaseAdmin
      .from('question_attempts')
      .select('questions(subject)')
      .eq('user_id', user.id)
      .gte('created_at', isoStart);

    let progress1 = 0;
    let progress2 = 0;

    if (attempts) {
      for (const a of attempts) {
        const sub = (a.questions as any)?.subject;
        if (sub === goal.subject1) progress1++;
        if (sub === goal.subject2) progress2++;
      }
    }

    if (progress1 < goal.count1 || progress2 < goal.count2) {
      return NextResponse.json({ error: 'Goal not met yet' }, { status: 400 });
    }

    // Give rewards: 10 XP, 5 Points
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('xp, total_points')
      .eq('id', user.id)
      .single();

    const currentXp = Number(profile?.xp || 0);
    const currentPoints = Number(profile?.total_points || 0);

    await supabaseAdmin.from('profiles').update({
      xp: currentXp + 10,
      total_points: currentPoints + 5
    }).eq('id', user.id);

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, daily_goal_claimed_date: today }
    });

    return NextResponse.json({ success: true, xp: 10, points: 5 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
