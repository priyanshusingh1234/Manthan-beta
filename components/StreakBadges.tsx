'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Info, X, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';

interface StreakBadgesProps {
  userId: string;
}

export default function StreakBadges({ userId }: StreakBadgesProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showModal, setShowModal] = useState(false);
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

    // Subscribe to profile changes for real-time streak updates
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
  const progress = Math.min(100, (solvedToday / goal) * 100);
  const isGoalMet = solvedToday >= goal;

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
          isGoalMet 
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' 
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
        }`}
      >
        <Flame className={`w-4 h-4 ${isGoalMet ? 'animate-pulse fill-current' : ''}`} />
        <span className="text-[11px] font-black tracking-widest">{streak}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-orange-500 to-amber-600 p-8 flex flex-col justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Flame className="w-6 h-6 text-white fill-current" />
                 </div>
                 <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tighter italic">Path of the Sage</h3>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Daily Streak • Day {streak}</p>
                 </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-8 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-end justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">Today's Progress</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white">{solvedToday} <span className="text-slate-300 dark:text-slate-700 font-medium italic text-xl">/ {goal}</span></h4>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">Level Progress</p>
                        <p className="text-sm font-black text-orange-500 italic">{Math.round(progress)}%</p>
                     </div>
                  </div>
                  
                  {/* Progress Bar UI */}
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                     <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        style={{ width: `${progress}%` }}
                     />
                  </div>
               </div>

               {/* Quest Details */}
               <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <Trophy className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                           {isGoalMet ? 'Goal Reached!' : 'Daily Mission'}
                        </p>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                           {isGoalMet 
                              ? 'The fire is burning bright! You have secured your streak for today. Tomorrow requires ' + (goal + 1) + ' solves.'
                              : 'Solve ' + (goal - solvedToday) + ' more correct questions today to advance your streak and maintain your flame.'}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Mystery Hint */}
               <div className="flex items-center gap-3 py-4 border-t border-slate-100 dark:border-slate-800">
                  <Info className="w-4 h-4 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                     Complete 30 Days for a <span className="text-indigo-400">Mysterious Reward...</span>
                  </p>
               </div>

               <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95 transition-all"
               >
                  Keep Solving
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
