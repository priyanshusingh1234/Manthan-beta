import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Trophy, Target, Zap, Play, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import QuestionsFeed from '@/components/QuestionsFeed';
import RecentDuels from '@/components/RecentDuels';
import DailyGoalCard from '@/components/DailyGoalCard';

export default function FeedScreen() {
  const router = useRouter();
  
  // Removed RSVP logic as requested

  const Header = (
    <View style={{ paddingTop: 40, paddingBottom: 16 }}>
      {/* Top Banner */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Welcome Back</Text>
            <Text className="text-2xl font-black text-slate-900 dark:text-slate-50">Student</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/store' as any)}
            className="bg-indigo-100 dark:bg-indigo-950/40 p-2.5 rounded-full border border-indigo-200/50 dark:border-indigo-900/50 active:scale-95 shadow-sm"
          >
            <ShoppingBag size={22} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Unit Test Announcement Banner */}
      <View className="px-6 mb-6">
        <View className="bg-indigo-600 rounded-2xl p-4 shadow-sm border border-indigo-500">
          <Text className="text-white font-black text-lg mb-2">✍️ Live Test: Class 10 English</Text>
          <Text className="text-indigo-100 font-medium text-sm leading-5 mb-4">
            The Formative Assessment for English is now LIVE!{'\n'}
            Test your knowledge on <Text className="font-bold text-white">Grammar, Literature, and Writing Skills</Text>.
          </Text>

          <View className="bg-indigo-500/50 p-4 rounded-xl items-center border border-indigo-400 mt-2">
            <Text className="text-white font-black text-lg mb-1">Take the Test Now!</Text>
            <Text className="text-indigo-200 text-xs font-medium mb-4 text-center">Your performance will be manually graded by your teacher.</Text>
            <TouchableOpacity 
              onPress={() => router.push('/test/bdb02f09-92fa-4e49-8a77-d537b8bdfd89' as any)}
              className="bg-white px-8 py-3 rounded-xl active:scale-95 transition-transform w-full items-center mb-2"
            >
              <Text className="text-indigo-600 font-black text-base">Start English Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/test-leaderboard' as any)}
              className="px-8 py-2 w-full items-center"
            >
              <Text className="text-indigo-100 font-bold text-sm">View Previous Rankings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daily Goal Card */}
      <DailyGoalCard />

      {/* Recent Duels */}
      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-4 px-6">
          <View className="flex-row items-center gap-2">
            <Zap size={18} color="#6366f1" />
            <Text className="text-lg font-black text-slate-900 dark:text-slate-100">Recent Duels</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/duels' as any)}>
            <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">View All</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontally scrollable duel cards — no px-6 so cards go edge to edge */}
        <View className="pl-6">
          <RecentDuels />
        </View>
      </View>

        {/* Questions Feed Section Header */}
        <View className="mt-4 px-6 mb-4">
          <Text className="text-xl font-black text-slate-900 dark:text-slate-100">For You</Text>
        </View>
      </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <QuestionsFeed ListHeaderComponent={Header} />
    </View>
  );
}

