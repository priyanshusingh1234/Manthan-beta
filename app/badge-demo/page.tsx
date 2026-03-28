import React from 'react';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import TeacherBadge from '@/ticks/teacher';

export default function BadgeDemo() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full border border-slate-100 dark:border-slate-800">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Dheeyudha Rank Badges</h1>
        <p className="text-slate-500 text-center mb-10 font-bold uppercase tracking-widest text-xs">Excellence & Achievement</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Podium Badges */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Podium Ranks</h2>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1">
              <GoldBadge />
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">Champion</p>
                <p className="text-[10px] text-slate-500 font-bold">Awarded for 1st Rank</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1">
              <SilverBadge />
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">Elite Challenger</p>
                <p className="text-[10px] text-slate-500 font-bold">Awarded for 2nd Rank</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1">
              <BronzeBadge />
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">Pro Warrior</p>
                <p className="text-[10px] text-slate-500 font-bold">Awarded for 3rd Rank</p>
              </div>
            </div>
          </div>
          
          {/* Special Verification Badges */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Achievements</h2>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1">
              <TopperBadge />
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">Topper</p>
                <p className="text-[10px] text-slate-500 font-bold">1500+ Lifetime Points</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1">
              <TeacherBadge />
              <div>
                <p className="font-black text-slate-900 dark:text-white leading-none mb-1">Verified Teacher</p>
                <p className="text-[10px] text-slate-500 font-bold">Authenticated Educator</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
           <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl">
                    <img src="https://ui-avatars.com/api/?name=User+One&background=fef3c7&color=d97706" alt="demo" />
                 </div>
                 <div className="flex items-center gap-1">
                    <span className="font-black text-sm text-slate-900 dark:text-white">Topper Demo</span>
                    <GoldBadge />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
