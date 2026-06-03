import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Trophy, Target, Zap, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import QuestionsFeed from '@/components/QuestionsFeed';
import RecentDuels from '@/components/RecentDuels';

export default function FeedScreen() {
  const router = useRouter();
  
  const Header = (
    <View style={{ paddingTop: 40, paddingBottom: 16 }}>
      {/* Top Banner */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Welcome Back</Text>
            <Text className="text-2xl font-black text-slate-900 dark:text-slate-50">Student</Text>
          </View>
          <View className="bg-indigo-100 dark:bg-indigo-950/40 p-2 rounded-full">
            <Trophy size={24} color="#4f46e5" />
          </View>
        </View>
      </View>

      {/* Daily Goal Card */}
      <View className="px-6 mb-8">
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Target size={20} color="#f59e0b" />
              <Text className="text-lg font-black text-slate-900 dark:text-slate-100">Daily Goal</Text>
            </View>
            <Text className="text-amber-500 font-bold">0 / 50 XP</Text>
          </View>
          
          <View className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
            <View className="h-full bg-amber-500" style={{ width: '0%' }} />
          </View>
          
          <TouchableOpacity className="bg-indigo-600 px-4 py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm">
            <Play size={16} color="white" fill="white" />
            <Text className="text-white font-bold">Start Quick Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

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

