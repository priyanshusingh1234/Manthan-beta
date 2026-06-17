'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skull, Clock, Trophy, ShieldAlert, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BossLobby() {
  const router = useRouter();
  
  const [timeRemaining, setTimeRemaining] = useState<string>('--:--:--');
  const [canFight, setCanFight] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // IST is UTC + 5:30
      const utcOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + utcOffset);
      
      const target = new Date(istTime);
      target.setUTCHours(19, 0, 0, 0); // 7 PM IST
      
      if (istTime.getUTCHours() >= 19) {
        // If it's already past 7 PM today, the target is 7 PM tomorrow
        target.setUTCDate(target.getUTCDate() + 1);
      }

      const diff = target.getTime() - istTime.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      
      if (istTime.getUTCHours() === 19) {
        // Between 7:00 PM and 8:00 PM IST
        setCanFight(true);
      } else {
        setCanFight(false); 
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEnterLair = () => {
    router.push('/boss/fight');
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen px-4 pt-8 pb-32 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center mt-8 mb-12"
      >
        <div className="w-24 h-24 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
          <Skull size={48} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 text-center">
          DAILY BOSS
        </h1>
        <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 text-center max-w-md leading-relaxed">
          The ultimate challenge. One massive MCQ. Huge rewards. Resets every day at 7:00 PM (IST).
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Next Rotation In
          </span>
          <Clock size={16} className="text-slate-500 dark:text-slate-400" />
        </div>
        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-widest text-center mb-2 tabular-nums">
          {timeRemaining}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex justify-between mb-12 w-full max-w-md px-4"
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3 shadow-sm">
            <Trophy size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">Epic Rewards</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-3 shadow-sm">
            <Zap size={24} className="text-orange-500 dark:text-orange-400" />
          </div>
          <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">High Stakes</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3 shadow-sm">
            <ShieldAlert size={24} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">1 Attempt</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.button
          onClick={handleEnterLair}
          disabled={!canFight}
          animate={canFight ? { scale: [1, 1.05, 1] } : {}}
          transition={canFight ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
          className={`w-full py-5 rounded-2xl flex items-center justify-center shadow-xl border focus:outline-none transition-colors ${
            canFight 
              ? 'bg-rose-600 border-rose-400/50 shadow-rose-500/30 hover:bg-rose-700' 
              : 'bg-slate-300 dark:bg-slate-800 border-transparent text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          <span className="text-white text-xl font-black tracking-widest uppercase">
            {canFight ? 'Enter The Lair' : 'Awaiting Boss...'}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
