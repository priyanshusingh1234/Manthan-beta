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

      {/* Practice Mode Entry */}
      <TouchableOpacity
        onPress={() => router.push('/practice' as any)}
        activeOpacity={0.85}
        className="mx-6 mb-5 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#1e1b4b',
          borderWidth: 1, borderColor: '#312e81',
          shadowColor: '#4f46e5', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
        }}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center',
        }}>
          <Target size={24} color="#a5b4fc" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: -0.3 }}>Practice Mode</Text>
          <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600', marginTop: 2 }}>Browse all questions by chapter</Text>
        </View>
        <Play size={20} color="#818cf8" fill="#818cf8" />
      </TouchableOpacity>

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

