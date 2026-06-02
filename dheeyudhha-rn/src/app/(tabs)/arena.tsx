import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Crown,
  Trophy,
  Clock,
  BarChart3,
  Sparkles,
  Play,
  Medal,
  Share2,
  Zap,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

type Gauntlet = {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  class_grade: string | null;
  difficulty: string;
  question_count: number;
  time_minutes: number;
  color: string;
  reward: string;
  reward_points?: number;
  reward_threshold_percent?: number;
};

// Map Tailwind gradient strings → native colors
function gradientToColor(color: string): string {
  if (color.includes('indigo')) return '#4f46e5';
  if (color.includes('emerald') || color.includes('teal')) return '#059669';
  if (color.includes('rose') || color.includes('red')) return '#e11d48';
  if (color.includes('violet') || color.includes('fuchsia')) return '#7c3aed';
  if (color.includes('amber') || color.includes('orange')) return '#d97706';
  if (color.includes('sky') || color.includes('blue')) return '#0284c7';
  return '#4f46e5';
}

function difficultyBadgeColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'easy': return { bg: '#d1fae5', text: '#065f46' };
    case 'medium': return { bg: '#fef3c7', text: '#92400e' };
    case 'hard': return { bg: '#fee2e2', text: '#991b1b' };
    case 'nightmare': return { bg: '#f3e8ff', text: '#6b21a8' };
    default: return { bg: '#e0e7ff', text: '#3730a3' };
  }
}

export default function ArenaScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [gauntlets, setGauntlets] = useState<Gauntlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGauntlets = useCallback(async () => {
    try {
      // Direct Supabase query — no external URL needed
      const { data, error } = await supabase
        .from('gauntlets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGauntlets(data || []);
    } catch (err: any) {
      console.error('Arena fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchGauntlets(); }, [fetchGauntlets]);

  const handleShare = async (g: Gauntlet) => {
    try {
      await Share.share({
        message: `Challenge Alert: ${g.title} at Dheeyudha Academy! 🧠🔥`,
        title: g.title,
      });
    } catch (e) { /* ignore */ }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          Loading Arena…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchGauntlets(); }}
          tintColor="#4f46e5"
        />
      }
    >
      {/* ── Hero Header ── */}
      <View className="mb-8">
        <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start mb-4">
          <Crown size={14} color="#facc15" />
          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
            Global Competition Center
          </Text>
        </View>
        <Text className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
          The Arena
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-2 leading-relaxed">
          Competitive gauntlets designed to isolate the top 1% of scholars. Enter if you dare.
        </Text>
      </View>

      {/* ── Gauntlet Cards ── */}
      {gauntlets.length === 0 ? (
        <View className="items-center justify-center py-20">
          <Zap size={40} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text className="text-slate-400 dark:text-slate-600 font-bold mt-4 text-sm">
            No gauntlets active yet
          </Text>
        </View>
      ) : (
        gauntlets.map((g) => {
          const accentColor = gradientToColor(g.color);
          const diff = difficultyBadgeColor(g.difficulty);
          return (
            <View
              key={g.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 mb-5 overflow-hidden"
              style={{
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 20,
                elevation: 6,
              }}
            >
              {/* Accent glow top strip */}
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 3,
                  backgroundColor: accentColor,
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                }}
              />

              {/* Top row */}
              <View className="flex-row items-start justify-between mb-5">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }}
                    />
                    <Text
                      className="text-[10px] font-black uppercase tracking-widest ml-1"
                      style={{ color: accentColor }}
                    >
                      {g.difficulty} Challenge
                    </Text>
                  </View>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {g.subject}{g.class_grade ? ` • Class ${g.class_grade}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleShare(g)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full"
                >
                  <Share2 size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Title & description */}
              <Text
                className="text-xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-2 leading-tight"
                numberOfLines={3}
              >
                {g.title}
              </Text>
              <Text
                className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-5"
                numberOfLines={3}
              >
                {g.description}
              </Text>

              {/* Stats */}
              <View className="flex-row gap-3 mb-5">
                <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <BarChart3 size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400">Structure</Text>
                  </View>
                  <Text className="font-black text-xs text-slate-900 dark:text-white">{g.question_count} Questions</Text>
                </View>
                <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Clock size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration</Text>
                  </View>
                  <Text className="font-black text-xs text-slate-900 dark:text-white">{g.time_minutes} Minutes</Text>
                </View>
              </View>

              {/* Reward banner */}
              <View
                className="flex-row items-center gap-3 p-4 rounded-2xl mb-5"
                style={{ backgroundColor: isDark ? `${accentColor}18` : `${accentColor}12`, borderWidth: 1, borderColor: `${accentColor}30` }}
              >
                <View className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl items-center justify-center shadow-sm">
                  <Sparkles size={18} color="#facc15" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: accentColor }}>Arena Reward</Text>
                  <Text className="text-xs font-black italic text-slate-800 dark:text-white">
                    {g.reward_points ? `+${g.reward_points} PTS • ` : ''}{g.reward}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push(`/arena/${g.slug}` as any)}
                  className="flex-[3] py-4 rounded-2xl flex-row items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor }}
                  activeOpacity={0.85}
                >
                  <Play size={16} color="#fff" fill="#fff" />
                  <Text className="text-white font-black italic uppercase tracking-widest text-xs">Initiate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/arena/${g.slug}?view=records` as any)}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Medal size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
