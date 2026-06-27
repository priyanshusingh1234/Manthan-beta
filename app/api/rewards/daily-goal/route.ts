import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const SUBJECTS = ['Maths', 'English', 'Science', 'SST', 'Hindi', 'G.K'];

const SUBJECT_ALIASES: Record<string, string[]> = {
  'Maths':   ['Maths', 'Mathematics', 'Math', 'maths', 'mathematics'],
  'English': ['English', 'english', 'Eng'],
  'Science': ['Science', 'science', 'Physics', 'Chemistry', 'Biology'],
  'SST':     ['SST', 'sst', 'Social Science', 'Social Studies', 'History', 'Geography', 'Civics', 'S.St'],
  'Hindi':   ['Hindi', 'hindi'],
  'G.K':     ['G.K', 'GK', 'General Knowledge', 'g.k'],
};

function matchesSubject(dbSubject: string | null | undefined, goalSubject: string): boolean {
  if (!dbSubject) return false;
  const aliases = SUBJECT_ALIASES[goalSubject] || [goalSubject];
  return aliases.some(a => dbSubject.toLowerCase() === a.toLowerCase());
}

function getDailyGoal(userId: string, dateStr: string) {
  const hashStr = userId + dateStr;
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) hash = (hash << 5) - hash + hashStr.charCodeAt(i);

  const sub1Idx = Math.abs(hash) % SUBJECTS.length;
  let sub2Idx = Math.abs(hash >> 4) % (SUBJECTS.length - 1);
  if (sub2Idx >= sub1Idx) sub2Idx++;

  const count1 = 3 + (Math.abs(hash >> 8) % 3);
  const count2 = 2 + (Math.abs(hash >> 12) % 3);
  const safe1 = count1 + count2 > 10 ? 10 - count2 : count1;

  return { subject1: SUBJECTS[sub1Idx], count1: safe1, subject2: SUBJECTS[sub2Idx], count2 };
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

    // Fetch attempts from last 24h then filter to IST-today
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: attempts } = await supabaseAdmin
      .from('question_attempts')
      .select('question_id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since);

    const todayAttempts = (attempts || []).filter(a => {
      const istDate = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);
      return istDate === today;
    });

    let progress1 = 0, progress2 = 0;

    if (todayAttempts.length) {
      const qIds = [...new Set(todayAttempts.map(a => a.question_id))];
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id, subject')
        .in('id', qIds);

      const subjectMap = new Map((questions || []).map(q => [q.id, q.subject]));

      todayAttempts.forEach(a => {
        const sub = subjectMap.get(a.question_id);
        if (matchesSubject(sub, goal.subject1)) progress1++;
        if (matchesSubject(sub, goal.subject2)) progress2++;
      });
    }

    if (progress1 < goal.count1 || progress2 < goal.count2) {
      return NextResponse.json({ error: 'Goal not met yet', progress: { progress1, progress2, goal } }, { status: 400 });
    }

    // Give rewards
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('xp, total_points')
      .eq('id', user.id)
      .single();

    await supabaseAdmin.from('profiles').update({
      xp: Number(profile?.xp || 0) + 10,
      total_points: Number(profile?.total_points || 0) + 5
    }).eq('id', user.id);

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, daily_goal_claimed_date: today }
    });

    // Notify followers that this user just completed their Daily Goal!
    try {
      const solverName = meta.full_name || 'Your friend';
      const solverAvatar = meta.avatar_url || undefined;

      const { data: followerRows } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (followerRows && followerRows.length > 0) {
        const followerIds = followerRows.map((r: any) => r.follower_id);

        const { data: followerProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, daily_solve_date, daily_solve_count')
          .in('id', followerIds);

        // Find followers who haven't met their own simple daily solve count goal today
        const pendingFollowers = (followerProfiles || []).filter((fp: any) => {
          const metGoal = fp.daily_solve_date === today && Number(fp.daily_solve_count) >= 2;
          return !metGoal;
        });

        // We can dynamically import createNotification here or at the top
        const { createNotification } = await import('@/lib/createNotification');

        await Promise.allSettled(pendingFollowers.map((fp: any) =>
          createNotification({
            userId: fp.id,
            type: 'streak_friend',
            title: `Your friend ${solverName} has answered daily goal questions, can you?`,
            body: `They just hit their daily goal! Open the app to complete yours.`,
            href: '/streaks',
            actorId: user.id,
            actorName: solverName,
            actorAvatar: solverAvatar,
          })
        ));
      }
    } catch (e) {
      console.error('[daily-goal] streak_friend notif error:', e);
    }

    return NextResponse.json({ success: true, xp: 10, points: 5 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
