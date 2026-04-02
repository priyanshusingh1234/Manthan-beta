'use client';

import React from 'react';
import { Sparkles, Sword, Search, ShieldAlert, ArrowRight, Trophy, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function RiddleChallengeCard() {
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?ref=shadow-battle` : 'https://dheeyudha.com';
    const title = '⚔️ Shadow Battle: The Forgotten Sage';
    const text = 'A mysterious user has appeared on Dheeyudha. Find him, solve the riddle, and claim the 500pt bounty! Can you crack the code?';

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title,
          text,
          url: shareUrl,
          dialogTitle: 'Recruit Scholars for the Hunt',
        });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        // Fallback for desktop: copy to clipboard
        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
        alert('Challenge link copied to clipboard!');
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  };

  return (
    <div className="relative group overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-800 transition-all duration-500 hover:shadow-indigo-500/10 mb-8 mt-2 select-none active:scale-[0.99] transition-transform">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] -ml-32 -mb-32" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-px w-6 bg-indigo-500/50" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Native Event • Active</h3>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter italic flex items-center gap-3">
                Shadow Battle
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
            </div>
          </div>

          <button 
            onClick={handleShare}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-110 text-slate-400 hover:text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="max-w-2xl bg-white/5 border-l-4 border-indigo-500 rounded-r-3xl p-5 mb-4">
            <p className="text-slate-300 text-lg leading-relaxed font-medium italic">
              "A mysterious user has entered the arena. He has hidden a cryptic riddle within his secret history."
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 transition-all hover:bg-white/10 group/item hover:border-indigo-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-400 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">The Hunt</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-normal font-semibold">Track down the mysterious user using Search. He is hiding in the shadows.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 transition-all hover:bg-white/10 group/item hover:border-amber-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-amber-400 transition-colors">
                  <Sword className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">The Bounty</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-normal font-semibold">Solve his hidden riddle and comment the answer on his wall for 500 Pts.</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/search"
              className="group/btn relative inline-flex w-full sm:w-auto flex-1 items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-indigo-600 px-8 py-5 transition-all hover:scale-[1.02] active:scale-95 shadow-xl hover:bg-indigo-500"
            >
              <div className="relative flex items-center gap-3 font-black text-white text-base uppercase tracking-[0.2em]">
                Enter The Shadows
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
              </div>
            </Link>
            
            <div className="flex items-center gap-3 px-6 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] w-full sm:w-auto">
               <Trophy className="w-5 h-5 text-amber-500" />
               <span className="text-sm font-black text-white uppercase tracking-widest whitespace-nowrap">Bounty: 500 Pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
