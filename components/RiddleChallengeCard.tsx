'use client';

import React from 'react';
import { Sparkles, Sword, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RiddleChallengeCard() {
  return (
    <div className="relative group overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-800 transition-all duration-500 hover:shadow-indigo-500/10">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Limited Event</h3>
              <h2 className="text-2xl font-black text-white tracking-tighter italic">Shadow Battle</h2>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            A mysterious scholar has entered the arena. They have hidden a <span className="text-white font-black underline decoration-indigo-500">Subject Riddle</span> deep within the shadows.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/10 group/item">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-400 transition-colors" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Discovery</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Find @TheUnknownSage using the Search Bar.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/10 group/item">
              <div className="flex items-center gap-3 mb-2">
                <Sword className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-400 transition-colors" />
                <span className="text-xs font-black text-white uppercase tracking-widest">The Bounty</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Post the answer on their wall to win 500 Points.</p>
            </div>
          </div>

          <div className="pt-4">
            <Link 
              href="/search"
              className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 transition-all hover:bg-indigo-50 active:scale-95"
            >
              <div className="relative flex items-center gap-2 font-black text-slate-900 text-sm uppercase tracking-widest">
                Begin Search
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
