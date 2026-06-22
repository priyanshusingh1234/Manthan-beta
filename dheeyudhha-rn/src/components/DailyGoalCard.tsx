import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Target, Gift, CheckCircle2, Zap, PartyPopper } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

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

export default function DailyGoalCard() {
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [goal, setGoal] = useState<any>(null);
  const [progress, setProgress] = useState({ count1: 0, count2: 0 });
  const [claimed, setClaimed] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const checkMarkStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: opacity.value }],
    };
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        let cached = raw ? JSON.parse(raw) : null;
        if (cached && cached.date !== today) {
          cached = null;
        }

        if (cached) {
          setGoal(cached.goal);
          setProgress(cached.progress);
          setClaimed(cached.claimed);
          if (cached.claimed) {
            opacity.value = 1;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data: { user: freshUser } } = await supabase.auth.getUser();

        const g = getDailyGoal(session.user.id, today);
        if (!cached) setGoal(g);

        const meta = freshUser?.user_metadata || session.user.user_metadata || {};
        const metadataClaimed = meta.daily_goal_claimed_date === today;
        const cacheClaimed = cached?.claimed === true;
        const isClaimed = metadataClaimed || cacheClaimed;
        
        setClaimed(isClaimed);

        if (isClaimed) {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, goal: g, progress: { count1: g.count1, count2: g.count2 }, claimed: true }));
          opacity.value = 1;
          return;
        }

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
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, goal: g, progress: newProgress, claimed: false }));
      } catch (err) {
        console.error('Daily goal error:', err);
      } finally {
        setFetching(false);
      }
    };

    load();
  }, []);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/rewards/daily-goal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setClaimed(true);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, goal, progress: { count1: goal.count1, count2: goal.count2 }, claimed: true }));
        
        // Success animation
        scale.value = withSpring(1.05, {}, () => {
          scale.value = withSpring(1);
        });
        opacity.value = withTiming(1, { duration: 500 });
        setShowConfetti(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (!goal) {
    return (
      <View className="mx-6 mb-8 bg-slate-100 dark:bg-slate-900/50 rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 items-center justify-center min-h-[160px]">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  if (claimed) {
    return (
      <Animated.View style={animatedStyle} className="mx-6 mb-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-[24px] p-6 shadow-sm border border-emerald-200 dark:border-emerald-900/50 flex-row items-center gap-4">
        <Animated.View style={checkMarkStyle} className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 items-center justify-center">
          <PartyPopper size={24} color="#10b981" />
        </Animated.View>
        <View className="flex-1">
          <Text className="font-extrabold text-[16px] text-emerald-900 dark:text-emerald-100 mb-0.5">Today's Goal Done! 🎉</Text>
          <Text className="text-[12px] text-emerald-700 dark:text-emerald-400 font-medium">You earned +10 XP and +5 Points. Come back tomorrow!</Text>
        </View>
        {showConfetti && (
          <ConfettiCannon count={100} origin={{ x: 150, y: -20 }} fallSpeed={2000} fadeOut />
        )}
      </Animated.View>
    );
  }

  const pct1 = Math.min(100, Math.round((progress.count1 / goal.count1) * 100));
  const pct2 = Math.min(100, Math.round((progress.count2 / goal.count2) * 100));
  const completed = progress.count1 >= goal.count1 && progress.count2 >= goal.count2;

  return (
    <View 
      className="mx-6 mb-8 bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800/80 p-5"
      style={{ shadowColor: '#6366f1', shadowOpacity: 0.04, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      <View className="flex-row justify-between items-start mb-5">
        <View>
          <View className="flex-row items-center gap-2 mb-1">
            <Target size={20} color="#6366f1" />
            <Text className="text-[18px] font-black text-slate-900 dark:text-slate-100 tracking-tight">Daily Goal</Text>
            {fetching && <ActivityIndicator size="small" color="#94a3b8" style={{ marginLeft: 4 }} />}
            <TouchableOpacity 
              onPress={() => {
                import('react-native').then(m => m.DeviceEventEmitter.emit('open_daily_planner'));
              }}
              className="ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
            >
              <Text className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Change Plan</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Solve questions to earn rewards</Text>
        </View>
        <View className="items-end gap-1.5 mt-0.5">
          <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded-md border border-amber-100/50 dark:border-amber-800/50">
            <Zap size={10} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">+10 XP</Text>
          </View>
          <View className="flex-row items-center gap-1 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md border border-indigo-100/50 dark:border-indigo-800/50">
            <Gift size={10} color="#6366f1" />
            <Text className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">+5 Pts</Text>
          </View>
        </View>
      </View>

      <View className="gap-4">
        {[
          { label: goal.subject1, target: goal.count1, done: progress.count1, pct: pct1, color: 'bg-indigo-500' },
          { label: goal.subject2, target: goal.count2, done: progress.count2, pct: pct2, color: 'bg-purple-500' },
        ].map((item, i) => (
          <View key={i}>
            <View className="flex-row justify-between mb-2">
              <Text className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                Solve {item.target} <Text className="text-indigo-600 dark:text-indigo-400">{item.label}</Text>
              </Text>
              <Text className={`text-[13px] font-extrabold ${item.pct === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {Math.min(item.done, item.target)}/{item.target}
              </Text>
            </View>
            <View className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${item.pct === 100 ? 'bg-emerald-500' : item.color}`}
                style={{ width: `${item.pct}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      {completed && (
        <TouchableOpacity
          onPress={handleClaim}
          disabled={claiming}
          activeOpacity={0.8}
          className="mt-6 w-full py-3.5 bg-emerald-500 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        >
          {claiming ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle2 size={16} color="white" />
              <Text className="text-white font-black text-[14px] uppercase tracking-wide">Claim Reward</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
