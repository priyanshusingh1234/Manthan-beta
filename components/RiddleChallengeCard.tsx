'use client';

import React from 'react';
import { Sparkles, Sword, Search, ShieldAlert, ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function RiddleChallengeCard() {
  return (
    <div className="relative group overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-800 transition-all duration-500 hover:shadow-indigo-500/10 mb-8 mt-2">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] -ml-32 -mb-32" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <ShieldAlert className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-px w-6 bg-indigo-500/50" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Limited Shadow Battle</h3>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter italic flex items-center gap-3">
                The Forgotten Sage
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
             <Trophy className="w-4 h-4 text-amber-500" />
             <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">50,000,000 Points</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-slate-300 text-lg leading-relaxed font-medium">
              A <span className="text-white font-black underline decoration-indigo-500 decoration-2 underline-offset-4">Mysterious User</span> has entered the Scholar arena. He has hidden a cryptic riddle within his secret history. 
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 transition-all hover:bg-white/10 group/item hover:border-indigo-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-400 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">Discovery Mission</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-normal font-semibold">Track down the mysterious user using the search bar. He is hiding in the shadows.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 transition-all hover:bg-white/10 group/item hover:border-amber-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-amber-400 transition-colors">
                  <Sword className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">Shadow Kill</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-normal font-semibold">Solve his hidden riddle and comment the answer on his post to claim your bounty.</p>
            </div>
          </div>

          {/* Mobile Points Display */}
          <div className="flex sm:hidden items-center justify-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
             <Trophy className="w-4 h-4 text-amber-500" />
             <span className="text-sm font-black text-white uppercase tracking-widest">Prize: 50M Points</span>
          </div>

          <div className="pt-4">
            <Link 
              href="/search"
              className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-[1.5rem] bg-white px-8 py-5 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] hover:shadow-indigo-500/20"
            >
              <div className="relative flex items-center gap-3 font-black text-slate-900 text-base uppercase tracking-[0.2em]">
                Enter The Shadows
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
