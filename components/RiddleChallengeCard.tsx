'use client';

import React from 'react';
import { Sparkles, Trophy, Crown, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function RiddleChallengeCard() {
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}` : 'https://dheeyudha.com';
    const title = '🏆 Shadow Battle Champion Crowned!';
    const text = 'Scholar @sahu has cracked the Shadow Battle code and claimed the 500pt Bounty! The hunt is over... for now.';

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url: shareUrl });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  };

  return (
    <div className="relative group overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-800 transition-all duration-500 hover:shadow-amber-500/10 mb-8 mt-2 active:scale-[0.99] transition-transform">
      {/* Victory Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] -ml-32 -mb-32" />

      <div className="relative z-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
              <Crown className="w-10 h-10 text-amber-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="h-px w-6 bg-amber-500/50" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 font-sans">Shadow Battle Concluded</h3>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter italic leading-tight">
                Champion Crowned
                <Sparkles className="w-6 h-6 text-indigo-400 inline-block ml-3" />
              </h2>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Bounty Claimed</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="max-w-3xl mx-auto sm:mx-0">
            <div className="inline-flex items-center gap-4 bg-white/5 border border-white/20 p-5 rounded-[2rem] pr-8 shadow-sm group/winner hover:bg-white/10 transition-colors">
               <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                  <UserCheck className="w-7 h-7 text-white" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">The Victor</p>
                  <p className="text-2xl font-black text-white tracking-tight">@sahu</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left">
                <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                  Scholar <span className="text-white font-black">@sahu</span> has managed to track down the Mysterious Sage and decode the secret history. The first 500pt Bounty has been officially awarded.
                </p>
             </div>
             <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                   <p className="text-3xl font-black text-white">500</p>
                   <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Points Won</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                   <p className="text-3xl font-black text-white">#1</p>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Global Rank</p>
                </div>
             </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/leaderboard"
              className="group/btn relative inline-flex w-full sm:w-auto flex-1 items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-white px-8 py-5 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
            >
              <div className="relative flex items-center gap-3 font-black text-slate-900 text-base uppercase tracking-[0.2em]">
                View Leaderboard
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
              </div>
            </Link>
            
            <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] w-full sm:w-auto text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
            >
               Tribute to the Champion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
