'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Target, Gift, CheckCircle2, Loader2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

// ── Subjects that actually exist in the DB ─────────────────────────────────
const SUBJECTS = ['Maths', 'English', 'Science', 'SST', 'Hindi', 'G.K'];

// Aliases: subject label → all DB values that should count toward it
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
  if (sub2Idx >= sub1Idx) sub2Idx++; // ensure different subject

  const count1 = 3 + (Math.abs(hash >> 8) % 3);   // 3, 4, or 5
  const count2 = 2 + (Math.abs(hash >> 12) % 3);  // 2, 3, or 4
  const safe1 = count1 + count2 > 10 ? 10 - count2 : count1;

  return {
    subject1: SUBJECTS[sub1Idx],
    count1: safe1,
    subject2: SUBJECTS[sub2Idx],
    count2,
  };
}

export default function DailyGoalCard() {
  const [goal, setGoal] = useState<any>(null);
  const [progress, setProgress] = useState({ count1: 0, count2: 0 });
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const g = getDailyGoal(session.user.id, today);
        setGoal(g);

        // Check claimed
        const meta = session.user.user_metadata || {};
        if (meta.daily_goal_claimed_date === today) { setClaimed(true); return; }

        // Build today's start timestamp in UTC for the query
        // IST midnight = UTC 18:30 of previous day — use a simpler approach:
        // just get all attempts from past 24h then filter by IST date
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Step 1: get today's attempt question_ids
        const { data: attempts, error: aErr } = await supabase
          .from('question_attempts')
          .select('question_id, created_at')
          .eq('user_id', session.user.id)
          .gte('created_at', since);

        if (aErr) { console.error('attempts error', aErr); return; }

        // Filter to only IST-today attempts
        const todayAttempts = (attempts || []).filter(a => {
          const istDate = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
          return istDate === today;
        });

        if (!todayAttempts.length) { setProgress({ count1: 0, count2: 0 }); return; }

        // Step 2: fetch subjects for those question_ids
        const qIds = [...new Set(todayAttempts.map(a => a.question_id))];
        const { data: questions, error: qErr } = await supabase
          .from('questions')
          .select('id, subject')
          .in('id', qIds);

        if (qErr) { console.error('questions error', qErr); return; }

        // Build a map: questionId -> subject
        const subjectMap = new Map((questions || []).map(q => [q.id, q.subject]));

        // Step 3: count per-attempt (same question answered twice = counts twice)
        let p1 = 0, p2 = 0;
        todayAttempts.forEach(a => {
          const sub = subjectMap.get(a.question_id);
          if (matchesSubject(sub, g.subject1)) p1++;
          if (matchesSubject(sub, g.subject2)) p2++;
        });

        setProgress({ count1: p1, count2: p2 });

      } catch (err) {
        console.error('Daily goal error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Re-check progress when user answers a question
    window.addEventListener('question_answered', load);
    return () => window.removeEventListener('question_answered', load);
  }, []);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/rewards/daily-goal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setClaimed(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        window.dispatchEvent(new Event('xp_earned'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !goal) return null;
  if (claimed) return null;

  const pct1 = Math.min(100, Math.round((progress.count1 / goal.count1) * 100));
  const pct2 = Math.min(100, Math.round((progress.count2 / goal.count2) * 100));
  const completed = progress.count1 >= goal.count1 && progress.count2 >= goal.count2;

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-[2px] shadow-lg mb-6">
      <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Daily Goal
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Solve questions to earn rewards</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg">
              <Zap className="w-3 h-3" /> +10 XP
            </span>
            <span className="flex items-center gap-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
              <Gift className="w-3 h-3" /> +5 Points
            </span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {[
            { label: goal.subject1, target: goal.count1, done: progress.count1, pct: pct1, color: 'from-indigo-500 to-purple-500', textColor: 'text-indigo-500' },
            { label: goal.subject2, target: goal.count2, done: progress.count2, pct: pct2, color: 'from-purple-500 to-fuchsia-500', textColor: 'text-fuchsia-500' },
          ].map((g, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  Solve {g.target} <span className="text-indigo-600 dark:text-indigo-400">{g.label}</span>
                </span>
                <span className={g.pct === 100 ? 'text-green-500' : g.textColor}>
                  {Math.min(g.done, g.target)}/{g.target}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${g.pct === 100 ? 'bg-green-500' : `bg-gradient-to-r ${g.color}`}`}
                  style={{ width: `${g.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {completed && !claimed && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="mt-5 w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Claim Reward</>}
          </button>
        )}
      </div>
    </div>
  );
}
