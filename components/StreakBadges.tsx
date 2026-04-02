'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';
import Link from 'next/link';

interface StreakBadgesProps {
  userId: string;
}

export default function StreakBadges({ userId }: StreakBadgesProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data as Profile);
      setLoading(false);
    }

    if (userId) fetchProfile();

    const channel = supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
      (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading || !profile) return null;

  const streak = profile.streak_count || 0;
  const solvedToday = profile.daily_solved || 0;
  const goal = streak + 1;
  const isGoalMet = solvedToday >= goal;

  return (
    <Link 
      href="/streaks"
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
        isGoalMet 
          ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm shadow-orange-500/5' 
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
      }`}
    >
      <Flame className={`w-4 h-4 ${isGoalMet ? 'animate-pulse fill-current' : ''}`} />
      <span className="text-[11px] font-black tracking-widest">{streak}</span>
    </Link>
  );
}
