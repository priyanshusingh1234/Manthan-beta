"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LiveWarFeed from '@/components/LiveWarFeed'
import TopStudents from '@/components/TopStudents'
import BottomBanner from '@/components/BottomBanner'
import HomeSignPrompt from '@/components/HomeSignPrompt'
import QuestionsFeed from '@/components/QuestionsFeed'
import LandingPage from '@/components/LandingPage';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import RecentDuelsCard from '@/components/RecentDuelsCard';
import DailyGoalCard from '@/components/DailyGoalCard';
import DailyPlannerModal from '@/components/DailyPlannerModal';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (hasToken) return true;
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Removed RSVP logic as requested

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mx-auto max-w-6xl mt-6 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-6" />
              <div className="h-[280px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse" />
              <div className="h-[280px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse delay-75" />
            </div>
            <div className="lg:col-span-1 hidden lg:block">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-6" />
              <div className="h-[400px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse delay-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <HomeSignPrompt />
      <DailyPlannerModal />

      {/* Sliding Announcement Banner */}
      <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-3 overflow-hidden shadow-lg border border-white/10 relative z-10">
        <div 
          className="whitespace-nowrap text-white font-bold text-sm sm:text-base inline-block"
          style={{ animation: 'marquee 40s linear infinite' }}
        >
          ✨ LIVE TEST: CLASS 10 MATHS ✨ Formative Assessment on Algebra, Geometry, and Arithmetic ✨
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </div>
      {/* Main content grid */}
      <main className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          {/* <LiveWarFeed /> */}

          {/* Practice & League Banner */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/practice" className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0 group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
              <h2 className="text-white font-black text-xl mb-1">Practice Mode</h2>
              <p className="text-indigo-100 font-medium text-sm leading-snug">
                Master chapters at your own pace without time limits.
              </p>
            </Link>
            
            <Link href="/league" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0 group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
              <h2 className="text-white font-black text-xl mb-1">Weekly League</h2>
              <p className="text-amber-100 font-medium text-sm leading-snug">
                Compete for the top rank and earn your promotion.
              </p>
            </Link>
          </div>

          {/* Questions feed placed on the home screen */}
          <div className="mt-6">
            <DailyGoalCard />
            <RecentDuelsCard />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your Feed</h2>
              <Link
                href="/store"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-md transition-transform active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                Points Store
              </Link>
            </div>
            <QuestionsFeed />
          </div>
        </div>
        <div className="lg:col-span-1">
          <TopStudents />
        </div>
      </main>

      {/* Sticky bottom banner */}
      <BottomBanner />
    </div>
  )
}
