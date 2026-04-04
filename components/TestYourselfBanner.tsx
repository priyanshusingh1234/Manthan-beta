"use client";
import React from 'react';
import Link from 'next/link';
import { Target, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function TestYourselfBanner() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 mb-4">
      <Link 
        href="/test/class-9-hard"
        className="group relative block w-full overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-6 md:p-8 hover:border-slate-700 transition-all shadow-2xl"
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full group-hover:bg-red-500/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest italic">Ultimate Gauntlet</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
              Test Yourself
            </h2>
            <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
              Are you the toughest scholar? Take the ultimate Class 9 Hard MCQ challenge. 40 brutal questions. 1 Hour. No mercy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="flex gap-4">
              <div className="flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-700/50 min-w-[80px]">
                <Target className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-white font-black text-sm">40</span>
                <span className="text-[10px] text-slate-500 uppercase font-black">MCQs</span>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-700/50 min-w-[80px]">
                <Clock className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-white font-black text-sm">60</span>
                <span className="text-[10px] text-slate-500 uppercase font-black">Mins</span>
              </div>
            </div>

            <div className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-slate-100 transition-colors shadow-lg active:scale-95">
              <span>Start Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
