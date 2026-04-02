'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Crown, ArrowLeft, ChevronRight, CheckCircle2, Lock, Sparkles, UserCheck, FlameKindling, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';

export default function StreakClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) setProfile(data as Profile);
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const streak = profile.streak_count || 0;
  const solvedToday = profile.daily_solved || 0;
  const goal = streak + 1;
  const isGoalMet = solvedToday >= goal;
  const progress = Math.min(100, (solvedToday / goal) * 100);

  const days = Array.from({ length: 31 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-32">
      {/* Native Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 pt-[env(safe-area-inset-top)]">
         <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button 
                  onClick={() => router.back()} 
                  className="p-2 -ml-2 text-indigo-600 dark:text-indigo-400 active:scale-90 transition-transform"
               >
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Scholar Streak</h1>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
               <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Level {streak}</span>
            </div>
         </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
         {/* Minimalist Fire Display */}
         <div className="text-center mb-12">
            <div className="relative inline-block group mb-6">
               {/* Background Orbitals */}
               <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl animate-pulse" />
               <div className="relative w-40 h-40 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner overflow-hidden active:scale-95 transition-transform duration-500">
                  <Flame className={`w-14 h-14 mb-1 transition-all ${isGoalMet ? 'text-orange-500 fill-orange-500 animate-bounce' : 'text-slate-300 dark:text-slate-700'}`} />
                  <p className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">{streak}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Days</p>
               </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Forge Your Intellect</h2>
            <p className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto mt-2">Achieve your daily quota to keep the sage fire burning.</p>
         </div>

         {/* Today's Directive Card - Clean Android Style */}
         <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50 mb-12 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today's Mission</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                     {isGoalMet ? 'Goal Reached!' : 'Progress: ' + solvedToday + ' / ' + goal}
                  </h3>
               </div>
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${isGoalMet ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-indigo-500'} transition-colors`}>
                  {isGoalMet ? <CheckCircle2 className="w-8 h-8" /> : <FlameKindling className="w-8 h-8" />}
               </div>
            </div>
            
            <div className="h-4 bg-white dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
               <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`} 
                  style={{ width: `${progress}%` }}
               />
            </div>
            
            <div className="mt-8 flex items-center gap-3">
               <Info className="w-4 h-4 text-indigo-500" />
               <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                  Complete 30 Days to obtain the <span className="text-indigo-600 dark:text-indigo-400 font-black">Sage’s Reward</span> & 1000 Pts.
               </p>
            </div>
         </div>

         {/* Clean Journey Path */}
         <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-6">The 30-Day Gauntlet</h3>
            <div className="space-y-4">
               {days.slice(1, 31).map((day) => {
                  const isPast = day < streak;
                  const isCurrent = day === streak && !isGoalMet;
                  const isCompletedToday = day === streak && isGoalMet;
                  const isFuture = day > (isGoalMet ? streak : streak + 1);

                  return (
                     <div key={day} className={`group flex items-center gap-5 p-5 rounded-3xl transition-all active:scale-[0.98] ${
                        isPast || isCompletedToday 
                          ? 'bg-emerald-50/50 dark:bg-emerald-500/5' 
                          : isCurrent 
                             ? 'bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/50' 
                             : 'bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800/50'
                     }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                           isPast || isCompletedToday 
                             ? 'bg-emerald-500 text-white' 
                             : isCurrent 
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/30' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                           {isPast || isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : (day % 7 === 0 ? <Trophy className="w-6 h-6" /> : <span className="font-black italic">{day}</span>)}
                        </div>

                        <div className="flex-1">
                           <div className="flex items-center justify-between mb-0.5">
                              <h4 className={`text-sm font-black uppercase tracking-tight italic ${isFuture ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
                                 {day % 7 === 0 ? (day === 30 ? 'The Final Sage' : 'Milestone Stage') : 'Quest Day ' + day}
                              </h4>
                              {isFuture && <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />}
                           </div>
                           <p className={`text-[11px] font-bold ${isFuture ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500'}`}>
                              Objective: {day} Correct Answer{day > 1 ? 's' : ''}
                           </p>
                        </div>

                        {isCurrent && (
                           <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
}
