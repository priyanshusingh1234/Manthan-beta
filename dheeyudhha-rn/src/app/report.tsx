import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Minus,
  ChevronUp,
  ChevronDown,
  BookOpen
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function Delta({ cur, prev, unit = '' }: { cur: number; prev: number; unit?: string }) {
  const diff = cur - prev;
  if (!prev) return null;
  if (diff === 0) {
    return (
      <View className="flex-row items-center gap-1 mt-1">
        <Minus size={12} color="#94a3b8" />
        <Text className="text-[10px] text-slate-400 font-bold">Same as last week</Text>
      </View>
    );
  }
  const up = diff > 0;
  return (
    <View className="flex-row items-center gap-1 mt-1">
      {up ? <ChevronUp size={12} color="#10b981" /> : <ChevronDown size={12} color="#f43f5e" />}
      <Text className={`text-[10px] font-bold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
        {Math.abs(diff)}{unit} vs last week
      </Text>
    </View>
  );
}

function Tile({ icon: Icon, iconBg, iconColor, label, value, unit, cur, prev }: any) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex-1 shadow-sm">
      <View className={`w-8 h-8 rounded-xl items-center justify-center mb-2 ${iconBg}`}>
        <Icon size={16} color={iconColor} />
      </View>
      <Text className="text-xl font-black text-slate-900 dark:text-white">
        {value}{unit}
      </Text>
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
        {label}
      </Text>
      <Delta cur={cur} prev={prev} unit={unit} />
    </View>
  );
}

function BarChart({ current, previous }: {
  current: { label: string; total: number }[];
  previous: { label: string; total: number }[];
}) {
  const maxVal = Math.max(1, ...current.map(d => d.total), ...previous.map(d => d.total));
  
  return (
    <View className="w-full mt-2">
      <View className="flex-row items-end justify-between h-24">
        {current.map((day, i) => {
          const prevDay = previous[i];
          const curH = Math.max(4, (day.total / maxVal) * 100);
          const preH = Math.max(4, (prevDay.total / maxVal) * 100);
          return (
            <View key={day.label} className="flex-1 items-center">
              <View className="w-full flex-row items-end justify-center gap-0.5 h-full">
                <View 
                  className="w-2.5 rounded-t bg-slate-300 dark:bg-slate-700" 
                  style={{ height: `${preH}%` }} 
                />
                <View 
                  className="w-2.5 rounded-t bg-indigo-500" 
                  style={{ height: `${curH}%` }} 
                />
              </View>
              <Text className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="flex-row gap-4 mt-3">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
          <Text className="text-[10px] text-slate-400 font-bold">This week</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700" />
          <Text className="text-[10px] text-slate-400 font-bold">Last week</Text>
        </View>
      </View>
    </View>
  );
}

const RATING_GRADIENT: Record<string, string[]> = {
  purple: ['#a855f7', '#c084fc'],
  green: ['#22c55e', '#4ade80'],
  blue: ['#6366f1', '#818cf8'],
  orange: ['#f97316', '#fb923c'],
  red: ['#ef4444', '#f87171'],
  slate: ['#64748b', '#94a3b8'],
};

export default function WeeklyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/report`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error('Failed to load report:', e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!report?.rating || report.rating.label === 'Not Rated') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <AlertTriangle size={56} color={isDark ? '#475569' : '#cbd5e1'} />
        <Text className="text-2xl font-black text-slate-900 dark:text-white mt-5 mb-2">
          No Data Yet
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center mb-8">
          Solve some questions this week to unlock your Report Card.
        </Text>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)')}
          className="bg-indigo-600 px-8 py-3 rounded-xl shadow-sm"
        >
          <Text className="text-white font-black text-base">Start Solving →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, prevStats, rating } = report;
  const ratingColors = RATING_GRADIENT[rating.color] ?? RATING_GRADIENT.slate;
  const mainColor = ratingColors[0];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
        >
          <ArrowLeft size={20} color={isDark ? '#f8fafc' : '#334155'} />
        </TouchableOpacity>
        <Text className="font-black text-base text-slate-900 dark:text-white">
          Weekly Report Card
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Card */}
        <Animated.View entering={FadeInUp.duration(400)} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm mb-4 relative overflow-hidden">
          <View className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: mainColor }} />
          
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Overall Rating
              </Text>
              <Text className="text-3xl font-black mb-1" style={{ color: mainColor }}>
                {rating.label}
              </Text>
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 leading-tight pr-4">
                {rating.message}
              </Text>
              
              {prevStats.score > 0 && (
                <View className="flex-row items-center gap-1.5 mt-3">
                  {stats.score >= prevStats.score ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#f43f5e" />}
                  <Text className={`text-[12px] font-bold ${stats.score >= prevStats.score ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.score >= prevStats.score ? '+' : ''}{stats.score - prevStats.score} pts vs last week
                  </Text>
                </View>
              )}
            </View>
            
            {/* Native Score Circle */}
            <View className="w-20 h-20 rounded-full border-[6px] items-center justify-center border-slate-100 dark:border-slate-800 relative">
              <View className="absolute inset-0 rounded-full border-[6px]" style={{ borderColor: mainColor, borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] }} />
              <Text className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {stats.score}
              </Text>
              <Text className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                /100
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Stat Tiles */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-row flex-wrap justify-between gap-2 mb-4">
          <Tile 
            icon={Target} 
            iconBg="bg-blue-100 dark:bg-blue-900/30" 
            iconColor="#3b82f6" 
            label="Attempted" 
            value={stats.totalAttempts} 
            cur={stats.totalAttempts} 
            prev={prevStats.totalAttempts} 
          />
          <Tile 
            icon={Trophy} 
            iconBg="bg-emerald-100 dark:bg-emerald-900/30" 
            iconColor="#10b981" 
            label="Accuracy" 
            value={stats.accuracy} 
            unit="%" 
            cur={stats.accuracy} 
            prev={prevStats.accuracy} 
          />
        </Animated.View>

        {/* Bar Chart */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mb-4">
          <Text className="font-black text-slate-900 dark:text-white text-sm mb-0.5">
            Questions Per Day
          </Text>
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            This week vs last week
          </Text>
          <BarChart current={stats.daily} previous={prevStats.daily} />
        </Animated.View>

        {/* Answer Breakdown */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mb-4">
          <Text className="font-black text-slate-900 dark:text-white text-sm mb-3">
            Answer Breakdown
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 items-center">
              <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.correctAttempts}
              </Text>
              <Text className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">
                Correct
              </Text>
              <Delta cur={stats.correctAttempts} prev={prevStats.correctAttempts} />
            </View>
            <View className="flex-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4 items-center">
              <Text className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {stats.totalAttempts - stats.correctAttempts}
              </Text>
              <Text className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1">
                Wrong
              </Text>
              <Delta cur={stats.totalAttempts - stats.correctAttempts} prev={prevStats.totalAttempts - prevStats.correctAttempts} />
            </View>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
