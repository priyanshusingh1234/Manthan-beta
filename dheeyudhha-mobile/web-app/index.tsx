import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LiveWarFeed from '@/components/LiveWarFeed'
import TopStudents from '@/components/TopStudents'
import BottomBanner from '@/components/BottomBanner'
import HomeSignPrompt from '@/components/HomeSignPrompt'
import QuestionsFeed from '@/components/QuestionsFeed'
import LandingPage from '@/components/LandingPage';
import { Loader2 } from 'lucide-react-native';
import { Link } from 'expo-router';
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

  if (isAuthenticated === null) {
    return (
      <View className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 pt-8">
        <View className="mx-auto max-w-6xl mt-6 pb-28">
          <View className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <View className="lg:col-span-2 space-y-4">
              <View className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-6" />
              <View className="h-[280px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse" />
              <View className="h-[280px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse delay-75" />
            </View>
            <View className="lg:col-span-1 hidden lg:block">
              <View className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-6" />
              <View className="h-[400px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse delay-100" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <View className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <HomeSignPrompt />
      <DailyPlannerModal />

      {/* Sliding Announcement Banner */}
      <Link href="/poetry-competition" className="block w-full bg-gradient-to-r from-rose-500 to-purple-600 py-3 overflow-hidden shadow-lg border-b border-white/10 relative z-10">
        <View 
          className="whitespace-nowrap text-white font-bold text-sm sm:text-base inline-block"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          ✨ GRAND POETRY COMPETITION - DAY AFTER TOMORROW! Click here to read the rules and participate to win exciting rewards! ✨
        </View>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </Link>
      {/* Main content grid */}
      <View className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 sm:px-6 lg:grid-cols-3 lg:px-8">
        <View className="lg:col-span-2">
          {/* <LiveWarFeed /> */}

          {/* Questions feed placed on the home screen */}
          <View className="mt-6">
            <DailyGoalCard />
            <RecentDuelsCard />
            <View className="flex items-center justify-between mb-4 flex-row">
              <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your Feed</Text>
              <Link
                href="/store"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-md transition-transform active:scale-95 flex-row"
              >
                <Check className="w-5 h-5 text-gray-500" />
                Points Store
              </Link>
            </View>
            <QuestionsFeed />
          </View>
        </View>
        <View className="lg:col-span-1">
          <TopStudents />
        </View>
      </View>

      {/* Sticky bottom banner */}
      <BottomBanner />
    </View>
  )
}
