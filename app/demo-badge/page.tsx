"use client";

import React from 'react';
import TopperBadge from '@/ticks/topper';
import { Trophy, Star, Award, Zap, ArrowRight, Sparkles } from 'lucide-react';

export default function BadgeDemoPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-20 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-400/10 dark:bg-amber-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <main className="max-w-4xl mx-auto relative">
        {/* Header Section */}
        <header className="mb-16 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Visual Design Assets
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600">Topper Badge</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            A premium recognition system for the highest achievers in Dheeyudhha. Designed to inspire excellence through cinematic aesthetics and smooth interactions.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Showcase Section: Main Badge */}
          <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Master Asset</h3>
            <div className="transform transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6 relative">
               <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-150 group-hover:animate-pulse"></div>
               {/* Large version of the badge */}
               <div className="scale-[4] p-4">
                 <TopperBadge />
               </div>
            </div>
            <div className="pt-8 text-center space-y-2">
              <p className="font-bold text-lg">Multi-layered Gradient</p>
              <p className="text-sm text-slate-500">Amber-400 to Amber-800 with White iconography</p>
            </div>
          </section>

          {/* Context Section: User Profile Preview */}
          <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Live Context</h3>
             
             <div className="space-y-6">
                {/* Profile row mockup */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-black">PS</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xl">Priyanshu Singh</span>
                      <TopperBadge />
                    </div>
                    <p className="text-sm text-slate-500">Global Rank #1</p>
                  </div>
                </div>

                {/* Post author mockup */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">Aditya Verma</span>
                      <TopperBadge />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Solved 2,450 questions</p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                    The badge automatically illuminates and pulses based on hover interactions, ensuring it catches the eye without being intrusive.
                  </p>
                </div>
             </div>
          </section>

          {/* Cards Section: Variations */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-amber-400 transition-colors">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-bold mb-1">Rank 1-10</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Exclusive for the global top decile achievers.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 transition-colors">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold mb-1">Star Quality</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Integrated glow system for maximum prestige.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-purple-400 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold mb-1">Responsive</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Perfectly scales from 16px to 256px.</p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <footer className="mt-20 border-t border-slate-100 dark:border-slate-800 pt-10 text-center pb-20">
          <p className="text-slate-400 text-sm mb-6">Ready to implement across the ecosystem?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl">
              Integrate Badge <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Copy SVG Code
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
