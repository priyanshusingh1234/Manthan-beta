'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Crown, ArrowLeft, ChevronRight, CheckCircle2, Lock, Sparkles, UserCheck, FlameKindling, MousePointer2 } from 'lucide-react';
import Link from 'next/link';
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
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const streak = profile.streak_count || 0;
  const solvedToday = profile.daily_solved || 0;
  const goal = streak + 1;
  const isGoalMet = solvedToday >= goal;

  // Generate 31 days (Day 0 to Day 30)
  const days = Array.from({ length: 31 }, (_, i) => i);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-20 animate-in fade-in duration-700 pb-32">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-12">
         <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:-translate-x-1 transition-transform shadow-sm">
               <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hub Exit</span>
         </Link>
         <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Crown className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Scholar Gauntlet</span>
         </div>
      </div>

      {/* Hero Section - Brand Unified */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-[3.5rem] p-8 sm:p-14 mb-14 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.4)] border border-white/10 active:scale-[0.99] transition-transform cursor-default">
         {/* Premium Glows */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] -ml-40 -mb-40" />

         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                  <div className="h-px w-8 bg-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Sage Initiative</span>
               </div>
               <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
                  Forge Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 italic">Intellect</span>
               </h1>
               <p className="text-indigo-50 text-base sm:text-lg font-medium leading-relaxed max-w-md opacity-90">
                   Achieve your daily quota to keep your sage fire burning. Consistency breeds mastery.
               </p>
            </div>

            <div className="shrink-0">
               <div className="relative group">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse group-hover:bg-white/30" />
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                     <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/30 to-white/10 transition-all duration-1000 ease-out"
                        style={{ height: `${Math.min(100, (solvedToday / goal) * 100)}%` }}
                     />
                     <Flame className={`w-16 h-16 sm:w-20 sm:h-20 mb-2 transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] ${isGoalMet ? 'text-amber-300 fill-amber-300 z-10 animate-flicker scale-110' : 'text-white/40'}`} />
                     <p className="text-5xl sm:text-7xl font-black text-white italic z-10 tracking-tighter">{streak}</p>
                     <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-[0.3em] z-10">Sage Streak</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Target Progress Card - Glassmorphic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
         <div className="md:col-span-2 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 flex items-center gap-8 group hover:border-indigo-500/40 transition-all shadow-sm">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg ${isGoalMet ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'} transition-colors`}>
               {isGoalMet ? <CheckCircle2 className="w-10 h-10" /> : <FlameKindling className="w-10 h-10 animate-pulse" />}
            </div>
            <div className="flex-1">
               <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Primary Objective</h3>
               <div className="flex items-end gap-3 mb-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{solvedToday} / {goal}</span>
                  <span className="text-sm font-bold text-indigo-500 italic">Solved Today</span>
               </div>
               <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${isGoalMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]'}`} 
                    style={{ width: `${Math.min(100, (solvedToday/goal)*100)}%` }}
                  />
               </div>
            </div>
         </div>

         <div className="bg-slate-900 dark:bg-zinc-900 rounded-[3rem] p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl border border-white/5 group active:scale-95 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/40 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-400">Milestone Reward</p>
            <div className="flex items-center gap-4 mb-2">
               <div className="p-2 bg-indigo-500/20 rounded-xl">
                 <Crown className="w-6 h-6 text-amber-400" />
               </div>
               <span className="text-3xl font-black italic tracking-tighter">30 Days</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-normal">
               Reach Day 30 to unlock the <span className="text-white font-bold italic">Mysterious Sage Badge</span> & 1k Pts.
            </p>
         </div>
      </div>

      {/* The Journey Path */}
      <div className="relative pt-10">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-10 flex items-center gap-3">
             <Sparkles className="w-6 h-6 text-indigo-500" />
             The 30-Day Gauntlet
         </h2>

         <div className="relative">
            {/* The Connecting Line (Brand Path) */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full md:left-1/2 md:-ml-0.5" />
            
            {/* Content Nodes */}
            <div className="space-y-12 relative z-10">
               {days.slice(1).map((day) => {
                  const isPast = day < streak;
                  const isCurrent = day === streak && !isGoalMet;
                  const isCompletedToday = day === streak && isGoalMet;
                  const isUnlocked = day <= (isGoalMet ? streak : streak + 1);
                  const isFuture = day > (isGoalMet ? streak : streak + 1);

                  return (
                    <div key={day} className={`flex flex-col md:flex-row items-center gap-6 ${day % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                       {/* Date / Node */}
                       <div className="flex-1 hidden md:block text-right">
                          {day % 2 !== 0 && (
                             <div className={`p-4 ${isPast || isCompletedToday ? 'opacity-30' : ''}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Stage Requirement</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">Solve {day} Questions</p>
                             </div>
                          )}
                       </div>

                       <div className="shrink-0 relative group">
                          <button 
                            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center z-10 relative transition-all duration-500 active:scale-90 ${
                             isPast || isCompletedToday 
                               ? 'bg-amber-500 shadow-[0_10px_20px_rgba(245,158,11,0.3)] text-white' 
                               : isCurrent
                                  ? 'bg-white dark:bg-slate-900 border-4 border-indigo-600 text-indigo-600 shadow-xl shadow-indigo-500/20 animate-pulse'
                                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-300'
                          }`}>
                            {isPast || isCompletedToday ? <CheckCircle2 className="w-8 h-8" /> : (isFuture ? <Lock className="w-5 h-5 opacity-40" /> : <span className="text-xl font-black italic">{day}</span>)}
                            
                            {/* Connector Highlight */}
                            {(isPast || isCompletedToday) && (
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-500/10 rounded-full animate-ping pointer-events-none" />
                            )}
                          </button>
                       </div>

                       <div className="flex-1 text-center md:text-left">
                          <div className={`md:p-4 ${isPast || isCompletedToday ? 'opacity-30' : isFuture ? 'opacity-20' : ''}`}>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">
                                {day % 7 === 0 ? 'Sage Milestone' : 'Tier ' + day}
                             </p>
                             <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center justify-center md:justify-start gap-2 italic">
                                {day % 7 === 0 ? (
                                   <>
                                      <Trophy className="w-6 h-6 text-amber-500" />
                                      {day === 30 ? 'The Sage’s Reward' : 'Level ' + (day/7) + ' Champion'}
                                   </>
                                ) : (
                                   <>
                                      Solve {day} Questions
                                   </>
                                )}
                             </h4>
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <style jsx global>{`
        @keyframes flicker {
           0%, 100% { opacity: 1; transform: scale(1.1); }
           50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-flicker {
           animation: flicker 1.5s infinite alternate;
        }
      `}</style>
    </div>
  );
}
