import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Medal } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

export default function TestLeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(`${API_URL}/api/tests/leaderboard`);
        
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="bg-indigo-600 dark:bg-indigo-900 pt-16 pb-12 px-6 rounded-b-[40px]">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-6"
        >
          <ArrowLeft size={24} color="#e0e7ff" />
          <Text className="text-indigo-100 font-bold text-lg">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 bg-white/20 self-start px-4 py-1.5 rounded-full mb-4">
          <Trophy size={16} color="#fde047" />
          <Text className="text-white font-black text-xs uppercase tracking-widest">Unit Tests Rankings</Text>
        </View>
        <Text className="text-white font-black text-4xl mb-2">Hall of Fame</Text>
        <Text className="text-indigo-200 font-medium text-base">See who is leading the scoreboard!</Text>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-6 -mt-6">
        <View className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-10">
          
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#4f46e5" className="mb-4" />
              <Text className="text-slate-500 font-bold">Loading rankings...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View className="py-20 px-6 items-center">
              <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                <Trophy size={32} color="#94a3b8" />
              </View>
              <Text className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">No Rankings Yet</Text>
              <Text className="text-slate-500 text-center font-medium">Be the first to complete a test and claim the top spot!</Text>
            </View>
          ) : (
            <View>
              {leaderboard.map((user, idx) => (
                <View 
                  key={user.userId} 
                  className={`flex-row items-center p-4 border-b border-slate-100 dark:border-slate-800/50 ${idx === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                >
                  {/* Rank */}
                  <View className="w-10 items-center justify-center mr-2">
                    {idx === 0 ? <Medal size={28} color="#f59e0b" /> :
                     idx === 1 ? <Medal size={28} color="#94a3b8" /> :
                     idx === 2 ? <Medal size={28} color="#b45309" /> :
                     <Text className="text-slate-400 font-black text-lg">#{idx + 1}</Text>}
                  </View>

                  {/* Avatar */}
                  <View className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-800 mr-4">
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-indigo-50 dark:bg-indigo-900/30">
                        <Text className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{user.name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="font-black text-base text-slate-900 dark:text-slate-100" numberOfLines={1}>{user.name}</Text>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>{user.school}</Text>
                  </View>

                  {/* Score */}
                  <View className="items-end ml-2">
                    <View className="bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-xl min-w-[50px] items-center">
                      <Text className="text-indigo-700 dark:text-indigo-400 font-black text-base">{user.score}</Text>
                    </View>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pts</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
