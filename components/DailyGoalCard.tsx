'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Target, Gift, CheckCircle2, Loader2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

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

        const meta = session.user.user_metadata || {};
        if (meta.daily_goal_claimed_date === today) {
          setClaimed(true);
        }

        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const isoStart = todayStart.toISOString();

        const { data: attempts } = await supabase
          .from('question_attempts')
          .select('questions(subject)')
          .eq('user_id', session.user.id)
          .gte('created_at', isoStart);

        let p1 = 0, p2 = 0;
        if (attempts) {
          attempts.forEach(a => {
            const sub = (a.questions as any)?.subject;
            if (sub === g.subject1) p1++;
            if (sub === g.subject2) p2++;
          });
        }
        setProgress({ count1: p1, count2: p2 });

      } catch (err) {
        console.error("Daily goal error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        window.dispatchEvent(new Event('xp_earned'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !goal) return null;

  const pct1 = Math.min(100, Math.round((progress.count1 / goal.count1) * 100));
  const pct2 = Math.min(100, Math.round((progress.count2 / goal.count2) * 100));
  const completed = progress.count1 >= goal.count1 && progress.count2 >= goal.count2;

  if (claimed) return null; // Hide completely if claimed, to save space on home feed

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-[2px] shadow-lg mb-6 transform transition-all hover:scale-[1.01]">
      <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 h-full relative overflow-hidden">
        {/* Background glow */}
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
          {/* Goal 1 */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-1.5">
              <span className="text-slate-700 dark:text-slate-300">Solve {goal.count1} {goal.subject1}</span>
              <span className={pct1 === 100 ? "text-green-500" : "text-indigo-500"}>{progress.count1}/{goal.count1}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${pct1 === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                style={{ width: `${pct1}%` }}
              />
            </div>
          </div>

          {/* Goal 2 */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-1.5">
              <span className="text-slate-700 dark:text-slate-300">Solve {goal.count2} {goal.subject2}</span>
              <span className={pct2 === 100 ? "text-green-500" : "text-fuchsia-500"}>{progress.count2}/{goal.count2}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${pct2 === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'}`}
                style={{ width: `${pct2}%` }}
              />
            </div>
          </div>
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
