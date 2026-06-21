import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Trophy, Target, Zap, Play, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import QuestionsFeed from '@/components/QuestionsFeed';
import RecentDuels from '@/components/RecentDuels';
import DailyGoalCard from '@/components/DailyGoalCard';

export default function FeedScreen() {
  const router = useRouter();
  
  const [rsvpStatus, setRsvpStatus] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRsvp = async (status: 'in' | 'out') => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await fetch(`${API_URL}/api/events/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          eventId: 'class10_unit_test_1',
          status: status
        })
      });
      
      if (res.ok) {
        setRsvpStatus(status);
      }
    } catch (e) {
      console.error('RSVP Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text className="text-white font-black text-lg mb-2">✨ Upcoming Class 10 Unit Test</Text>
          <Text className="text-indigo-100 font-medium text-sm leading-5 mb-4">
            <Text className="font-bold text-white">History:</Text> Ch 1 | <Text className="font-bold text-white">Geo:</Text> Ch 1 | <Text className="font-bold text-white">Eco:</Text> Ch 1 | <Text className="font-bold text-white">Civics:</Text> Ch 1{'\n'}
            <Text className="font-bold text-white">Hindi:</Text> Bade Bhai Sahab, Harihar Kaka, Grammar: Samash{'\n'}
            <Text className="font-bold text-white">English:</Text> A Letter to God, Fire and Ice, Grammar: Tense{'\n'}
            <Text className="font-bold text-white">Bio:</Text> Ch 1 | <Text className="font-bold text-white">Chem:</Text> Ch 1 | <Text className="font-bold text-white">Physics:</Text> Ch 1
          </Text>

          {rsvpStatus ? (
            <View className="bg-indigo-500/50 p-3 rounded-xl items-center border border-indigo-400">
              <Text className="text-white font-bold">
                {rsvpStatus === 'in' ? "🔥 Awesome! You're In!" : "👍 No worries, maybe next time!"}
              </Text>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => handleRsvp('in')}
                disabled={isSubmitting}
                className="flex-1 bg-white py-3 rounded-xl items-center active:scale-95 transition-transform"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                <Text className="text-indigo-600 font-black text-base">I'm In! ✋</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleRsvp('out')}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-500/50 border border-indigo-400 py-3 rounded-xl items-center active:scale-95 transition-transform"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                <Text className="text-white font-bold text-base">I'm Out 🙅</Text>
              </TouchableOpacity>
            </View>
          )}
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

