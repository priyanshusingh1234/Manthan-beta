"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, RotateCcw, ArrowRight } from 'lucide-react';

export default function AbortedTestNotice() {
  const router = useRouter();

  const handleReattempt = () => {
    // Clear the local block to ensure they can actually re-attempt
    if (typeof window !== 'undefined') {
        localStorage.removeItem('dheeyudha_class9_hard_test_completed');
    }
    router.push('/tests');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-3 bg-orange-500/20 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-orange-800 dark:text-orange-300 uppercase tracking-tight mb-1">
              Mission Aborted
            </h3>
            <p className="text-sm md:text-base text-orange-700/80 dark:text-orange-400/80 font-medium max-w-xl">
              Your previous Class 9 Hard Gauntlet was terminated due to a sync error. We've archived the partial data—you can now re-attempt the full challenge from the Arena Hub.
            </p>
          </div>
        </div>

        <button 
          onClick={handleReattempt}
          className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          Re-attempt Challenge
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
