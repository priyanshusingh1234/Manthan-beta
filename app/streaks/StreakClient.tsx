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
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-20 animate-in fade-in duration-700">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-12">
         <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:-translate-x-1 transition-transform">
               <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Back to Feed</span>
         </Link>
         <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400">
            <Crown className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">The Path of Sage</span>
         </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 sm:p-14 mb-14 shadow-2xl border border-slate-800">
         {/* Decorativebg */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />

         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="h-px w-8 bg-orange-500/50" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Daily Directive</span>
               </div>
               <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6">
                  Forge Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 italic">Intellect</span>
               </h1>
               <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                   Consistency is the key to true mastery. Solve your daily quota to keep your sage fire burning bright.
               </p>
            </div>

            <div className="shrink-0">
               <div className="relative group">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl animate-pulse group-hover:bg-orange-500/30" />
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-slate-800 border-8 border-slate-700 flex flex-col items-center justify-center shadow-inner overflow-hidden">
                     {/* Progress Liquid fill effect */}
                     <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-1000 ease-out opacity-20"
                        style={{ height: `${Math.min(100, (solvedToday / goal) * 100)}%` }}
                     />
                     <Flame className={`w-16 h-16 sm:w-20 sm:h-20 mb-2 transition-all ${isGoalMet ? 'text-orange-500 fill-orange-500 z-10 animate-flicker scale-110' : 'text-slate-600'}`} />
                     <p className="text-5xl sm:text-7xl font-black text-white italic z-10">{streak}</p>
                     <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest z-10">Current Streak</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Target Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
         <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex items-center gap-8 group hover:border-indigo-500/30 transition-all">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${isGoalMet ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'} transition-colors`}>
               {isGoalMet ? <CheckCircle2 className="w-10 h-10" /> : <FlameKindling className="w-10 h-10 animate-pulse" />}
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Today's Quest Progress</h3>
               <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{solvedToday} / {goal}</span>
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-600 italic">Correct Answers</span>
               </div>
               {/* Custom Bar */}
               <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isGoalMet ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                    style={{ width: `${Math.min(100, (solvedToday/goal)*100)}%` }}
                  />
               </div>
            </div>
         </div>

         <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-xl shadow-indigo-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Next Milestone</p>
            <div className="flex items-center gap-4 mb-2">
               <Crown className="w-8 h-8 text-amber-300" />
               <span className="text-3xl font-black italic">30 Days</span>
            </div>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
               Secure the Mysterious Sage Badge & 1000 Bonus Pts.
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
            {/* The Connecting Line (Progressive) */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full md:left-1/2 md:-ml-0.5" />
            
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
                             <div className={`p-4 ${isPast || isCompletedToday ? 'opacity-40' : ''}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Objective</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">Solve {day} Questions</p>
                             </div>
                          )}
                       </div>

                       <div className="shrink-0 relative">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 relative transition-all duration-500 ${
                             isPast || isCompletedToday 
                               ? 'bg-orange-500 shadow-lg shadow-orange-500/20 text-white' 
                               : isCurrent
                                  ? 'bg-white dark:bg-slate-900 border-4 border-orange-500 text-orange-500 animate-pulse'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}>
                            {isPast || isCompletedToday ? <CheckCircle2 className="w-8 h-8" /> : <span className="text-xl font-black">{day}</span>}
                            
                            {/* Connector Highlight (Only for past/active) */}
                            {(isPast || isCompletedToday) && (
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-orange-500/10 rounded-full animate-ping pointer-events-none" />
                            )}
                          </div>
                       </div>

                       <div className="flex-1 text-center md:text-left">
                          <div className={`md:p-4 ${isPast || isCompletedToday ? 'opacity-40' : isFuture ? 'opacity-30' : ''}`}>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                {day % 7 === 0 ? 'Milestone' : 'Stage ' + day}
                             </p>
                             <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                                {day % 7 === 0 ? (
                                   <>
                                      <Trophy className="w-5 h-5 text-amber-500" />
                                      {day === 30 ? 'The Sage’s Reward' : 'Tier ' + (day/7) + ' Champion'}
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
