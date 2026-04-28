'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Swords, Star, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function GauntletProgressCard() {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/gauntlet/progress?chapter=nationalism-europe', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const json = await res.json();
        if (json.success && json.unlockedLevel) {
          setLevel(Math.max(1, json.unlockedLevel));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProgress();
  }, []);

  if (level === null) return null; // Don't show while loading

  // Total levels is 10
  const totalLevels = 10;
  const rawProgress = ((level - 1) / totalLevels) * 100;
  // If they beat level 10, level is 11
  const progressPercent = Math.min(100, Math.max(0, rawProgress));

  // Determine State
  const isCompleted = level > totalLevels;
  const isBossPhase = level === totalLevels;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Link href="/gauntlet/nationalism-europe">
        <div className="relative overflow-hidden rounded-3xl bg-indigo-950 p-6 flex flex-col justify-between border-2 border-indigo-500/20 shadow-xl shadow-indigo-900/10 group cursor-pointer active:scale-[0.98] transition-transform">
          
          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6">
            <div className="w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
          </div>
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6">
            <div className="w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-500/20 text-indigo-300 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-400/20">
                  Featured Course
                </span>
                {isBossPhase && (
                  <span className="bg-rose-500/20 text-rose-400 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-rose-400/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Boss Fight
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white leading-tight mb-1">
                Nationalism in Europe
              </h3>
              <p className="text-indigo-200/80 text-sm font-medium">
                {isCompleted 
                  ? 'Mastery Achieved. You have defeated the Gauntlet!' 
                  : isBossPhase ? 'The Final Boss awaits. Claim your 10 Points!' : 'Continue your epic journey across 18th century Europe.'}
              </p>
            </div>
            
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <span className="text-2xl drop-shadow-md">{isCompleted ? '👑' : isBossPhase ? '💀' : '⚔️'}</span>
            </div>
          </div>

          <div className="relative z-10 mt-6 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-sm font-bold text-white">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Level {Math.min(level, totalLevels)} of {totalLevels}
              </div>
              <div className="font-extrabold text-indigo-300 text-sm">
                {Math.round(progressPercent)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 mb-3 overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-2.5 rounded-full ${isBossPhase ? 'bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
              />
            </div>

            {/* Reward Preview */}
            {!isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 
                  {isBossPhase ? 'Reward: 10 Points + 5 XP' : `Win to earn ${(level) * 20} XP`}
                </div>
                <div className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-0.5 group-hover:text-indigo-300 transition-colors">
                  Resume <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}
            
            {isCompleted && (
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
                  <span className="text-emerald-500">✓</span> Completed with Mastery
                </div>
                <div className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-0.5 group-hover:text-indigo-300 transition-colors">
                  Review <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
