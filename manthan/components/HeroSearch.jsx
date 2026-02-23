'use client';

import { Search, Sword, Target } from 'lucide-react'

export default function HeroSearch() {
  return (
    <section className="hidden md:block relative px-4 sm:px-6 lg:px-8 py-8 mb-4">
      {/* Container with premium glassmorphism and deep soft shadow */}
      <div className="mx-auto max-w-4xl rounded-[3rem] bg-white/70 backdrop-blur-2xl p-10 sm:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-black/[0.02]">

        {/* Descriptive Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5 shadow-sm border border-indigo-100/50">
            <Target className="w-7 h-7 text-indigo-600 animate-pulse-slow" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Challenge a Peer</h2>
          <p className="text-slate-500 text-base font-medium mt-2 max-w-md">Search for top students or rival schools and declare war to earn massive points.</p>
        </div>

        {/* Enhanced Search Input */}
        <div className="relative group max-w-2xl mx-auto">
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-[2.5rem] opacity-0 blur-2xl group-focus-within:opacity-100 transition-opacity duration-700"></div>

          <div className="relative flex items-center gap-5 bg-white rounded-[2rem] border border-slate-100 px-8 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-500 hover:border-slate-200 focus-within:shadow-[0_20px_40px_rgba(0,0,0,0.06)] focus-within:border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-500/5">
            <Search className="h-7 w-7 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-300" />
            <input
              id="doubt"
              type="text"
              placeholder="Enter username or school name..."
              className="w-full bg-transparent border-0 text-xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12 flex justify-center">
          <button className="group relative inline-flex items-center justify-center gap-4 rounded-2xl bg-indigo-600 px-12 py-5 text-white font-black text-lg shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 hover:-translate-y-1 transition-all duration-300 active:scale-95 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Sword className="w-6 h-6 relative z-10 transition-transform duration-500 group-hover:rotate-12" />
            <span className="relative z-10">Declare War</span>
          </button>
        </div>
      </div>
    </section>
  )
}
