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
      <div className="block w-full bg-gradient-to-r from-rose-500 to-purple-600 py-3 overflow-hidden shadow-lg border-b border-white/10 relative z-10">
        <div 
          className="whitespace-nowrap text-white font-bold text-sm sm:text-base inline-block"
          style={{ animation: 'marquee 40s linear infinite' }}
        >
          ✨ LIVE TEST: CLASS 10 ENGLISH ✨ Formative Assessment on Grammar, Literature, and Writing Skills ✨
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

          {/* Unit Test Card & Leaderboard */}
          <div className="mb-6 bg-indigo-600 rounded-2xl p-6 shadow-sm border border-indigo-500">
            <h2 className="text-white font-black text-xl mb-2">✍️ Live Test: Class 10 English</h2>
            <p className="text-indigo-100 font-medium text-sm leading-relaxed mb-6">
              The Formative Assessment for English is now LIVE!<br/>
              Test your knowledge on <span className="font-bold text-white">Grammar, Literature, and Writing Skills</span>.
            </p>

            <div className="bg-indigo-500/50 p-6 rounded-xl border border-indigo-400 flex flex-col items-center">
              <span className="text-white font-black text-xl mb-1">Take the Test Now!</span>
              <span className="text-indigo-200 text-sm font-medium mb-4">Your performance will be manually graded by your teacher.</span>
              <Link 
                href="/test/bdb02f09-92fa-4e49-8a77-d537b8bdfd89"
                className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black text-lg hover:bg-slate-50 transition-transform active:scale-95 shadow-md mb-3"
              >
                Start English Test
              </Link>
              <Link 
                href="/tests/leaderboard"
                className="text-indigo-100 font-bold text-sm hover:text-white"
              >
                View Previous Rankings
              </Link>
            </div>
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
