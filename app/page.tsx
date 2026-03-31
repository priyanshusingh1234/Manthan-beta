"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LiveWarFeed from '@/components/LiveWarFeed'
import TopStudents from '@/components/TopStudents'
import BottomBanner from '@/components/BottomBanner'
import HomeSignPrompt from '@/components/HomeSignPrompt'
import QuestionsFeed from '@/components/QuestionsFeed'
import QuestionOfDayBanner from '@/components/QuestionOfDayBanner';
import LandingPage from '@/components/LandingPage';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <QuestionOfDayBanner />
      <HomeSignPrompt />

      {/* Main content grid */}
      <main className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          {/* <LiveWarFeed /> */}

          {/* Questions feed placed on the home screen */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Your Feed</h2>
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
