'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Target, Gift, CheckCircle2, Loader2, Zap, PartyPopper } from 'lucide-react-native';
const confetti = Object.assign(() => {}, { reset: () => {} });

const CACHE_KEY = 'daily_goal_cache';
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

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Only valid for today
    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (cached.date !== today) return null;
    return cached;
  } catch { return null; }
}

function saveCache(data: any) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function DailyGoalCard() {
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Initialise instantly from cache — no flicker
  const cached = typeof window !== 'undefined' ? loadCache() : null;
  const [goal, setGoal] = useState<any>(cached?.goal ?? null);
  const [progress, setProgress] = useState(cached?.progress ?? { count1: 0, count2: 0 });
  const [claimed, setClaimed] = useState(cached?.claimed ?? false);
  const [fetching, setFetching] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data: { user: freshUser } } = await supabase.auth.getUser();

        const g = getDailyGoal(session.user.id, today);
        setGoal(g);

        const meta = freshUser?.user_metadata || session.user.user_metadata || {};
        const metadataClaimed = meta.daily_goal_claimed_date === today;
        const cacheClaimed = cached?.claimed === true;
        if (cacheClaimed && !metadataClaimed) {
          console.warn('Daily goal claimed cache mismatch: cache=true but metadata=false');
        }
        if (metadataClaimed && !cacheClaimed) {
          console.warn('Daily goal claimed cache mismatch: metadata=true but cache=false');
        }
        const isClaimed = metadataClaimed || cacheClaimed;
        setClaimed(isClaimed);

        if (isClaimed) {
          saveCache({ date: today, goal: g, progress: { count1: g.count1, count2: g.count2 }, claimed: true });
          return;
        }

        // Fetch progress in background
        setFetching(true);
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: attempts } = await supabase
          .from('question_attempts')
          .select('question_id, created_at')
          .eq('user_id', session.user.id)
          .gte('created_at', since);

        const todayAttempts = (attempts || []).filter(a => {
          const istDate = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
          return istDate === today;
        });

        let p1 = 0, p2 = 0;
        if (todayAttempts.length) {
          const qIds = [...new Set(todayAttempts.map(a => a.question_id))];
          const { data: questions } = await supabase
            .from('questions').select('id, subject').in('id', qIds);
          const subMap = new Map((questions || []).map(q => [q.id, q.subject]));
          todayAttempts.forEach(a => {
            const sub = subMap.get(a.question_id);
            if (matchesSubject(sub, g.subject1)) p1++;
            if (matchesSubject(sub, g.subject2)) p2++;
          });
        }

        const newProgress = { count1: p1, count2: p2 };
        setProgress(newProgress);
        saveCache({ date: today, goal: g, progress: newProgress, claimed: false });
      } catch (err) {
        console.error('Daily goal error:', err);
      } finally {
        setFetching(false);
      }
    };

    load();
    window.addEventListener('question_answered', load);
    return () => window.removeEventListener('question_answered', load);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        saveCache({ date: today, goal, progress: { count1: goal.count1, count2: goal.count2 }, claimed: true });
        confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 } });
        window.dispatchEvent(new Event('xp_earned'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  // ── Skeleton while no data at all (first ever load) ───────────────────────
  if (!goal) {
    return (
      <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6 animate-pulse">
        <View className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <View className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-2" />
        <View className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </View>
    );
  }

  // ── Completed state ───────────────────────────────────────────────────────
  if (claimed) {
    return (
      <View className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-[2px] shadow-lg mb-6">
        <View className="bg-white dark:bg-slate-900 rounded-[22px] px-5 py-4 flex items-center gap-4 flex-row">
          <View className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 flex-row">
            <PartyPopper className="w-6 h-6 text-green-500" />
          </View>
          <View className="flex-1 flex-row">
            <Text className="font-black text-[15px] text-slate-900 dark:text-white">Today's Goal Done! 🎉</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You earned <Text className="font-bold text-amber-500">+10 XP</Text> and <Text className="font-bold text-indigo-500">+5 Points</Text>. Come back tomorrow!</Text>
          </View>
        </View>
      </View>
    );
  }

  const pct1 = Math.min(100, Math.round((progress.count1 / goal.count1) * 100));
  const pct2 = Math.min(100, Math.round((progress.count2 / goal.count2) * 100));
  const completed = progress.count1 >= goal.count1 && progress.count2 >= goal.count2;

  return (
    <View className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-[2px] shadow-lg mb-6">
      <View className="bg-white dark:bg-slate-900 rounded-[22px] p-5 relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/20 blur-3xl rounded-full pointer-events-none" />

        <View className="flex items-start justify-between mb-4 relative z-10 flex-row">
          <View>
            <Text className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 flex-row">
              <Target className="w-5 h-5 text-indigo-500" />
              Daily Goal
              {fetching && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin ml-1" />}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Solve questions to earn rewards</Text>
          </View>
          <View className="flex flex-col items-end gap-1">
            <Text className="flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg flex-row">
              <Zap className="w-3 h-3" /> +10 XP
            </Text>
            <Text className="flex items-center gap-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg flex-row">
              <Gift className="w-3 h-3" /> +5 Points
            </Text>
          </View>
        </View>

        <View className="space-y-4 relative z-10">
          {[
            { label: goal.subject1, target: goal.count1, done: progress.count1, pct: pct1, color: 'from-indigo-500 to-purple-500', textColor: 'text-indigo-500' },
            { label: goal.subject2, target: goal.count2, done: progress.count2, pct: pct2, color: 'from-purple-500 to-fuchsia-500', textColor: 'text-fuchsia-500' },
          ].map((item, i) => (
            <View key={i}>
              <View className="flex justify-between text-sm font-bold mb-1.5 flex-row">
                <Text className="text-slate-700 dark:text-slate-300">
                  Solve {item.target} <Text className="text-indigo-600 dark:text-indigo-400">{item.label}</Text>
                </Text>
                <Text className={item.pct === 100 ? 'text-green-500' : item.textColor}>
                  {Math.min(item.done, item.target)}/{item.target}
                </Text>
              </View>
              <View className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full transition-all duration-700 ${item.pct === 100 ? 'bg-green-500' : `bg-gradient-to-r ${item.color}`}`}
                  style={{ width: `${item.pct}%` }}
                />
              </View>
            </View>
          ))}
        </View>

        {completed && (
          <View
            onPress={handleClaim}
            disabled={claiming}
            className="mt-5 w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 flex-row"
          >
            {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Claim Reward</>}
          </View>
        )}
      </View>
    </View>
  );
}
