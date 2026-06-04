import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import {
  Swords,
  Clock,
  XCircle,
  Trophy,
  Flame,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DuelEntry = {
  id: string;
  status: string;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  isChallenger: boolean;
  myAnswer: number | null;
  myCorrect: boolean | null;
  winnerId: string | null;
  iWon: boolean;
  isDraw: boolean;
  question: { id: string; title: string; subject: string | null; points: number | null } | null;
  opponent: { id: string; name: string; username: string; avatar: string | null };
};

const FILTERS = ['All', 'Pending', 'Active', 'Done'] as const;
type Filter = typeof FILTERS[number];

function applyFilter(duels: DuelEntry[], f: Filter) {
  if (f === 'Pending') return duels.filter((d) => d.status === 'pending');
  if (f === 'Active') return duels.filter((d) => d.status === 'accepted');
  if (f === 'Done') {
    return duels.filter((d) => ['completed', 'rejected', 'expired'].includes(d.status));
  }
  return duels;
}

const STATUS_PILL: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  accepted: { label: 'Live ⚡', bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400' },
  completed: { label: 'Done', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400' },
  rejected: { label: 'Declined', bg: 'bg-red-100 dark:bg-red-950/40', text: 'text-rose-600 dark:text-rose-400' },
  expired: { label: 'Expired', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500' },
};

export default function MyDuelsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [duels, setDuels] = useState<DuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');

  const fetchDuels = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/duel/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setDuels(d.duels || []);
      }
    } catch (err) {
      console.error('Fetch duels error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDuels();
  }, [fetchDuels]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDuels();
  };

  const filtered = applyFilter(duels, filter);
  const pendingCount = duels.filter((d) => d.status === 'pending' && !d.isChallenger).length;
  const liveCount = duels.filter((d) => d.status === 'accepted' && !d.isChallenger).length;

  const renderAvatar = (opp: { name: string; avatar: string | null }, size = 38) => {
    if (opp.avatar) {
      return (
        <Image
          source={{ uri: opp.avatar }}
          alt={opp.name}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="border border-slate-200 dark:border-slate-800"
        />
      );
    }
    const initials = opp.name.substring(0, 1).toUpperCase();
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200 dark:border-orange-900/50"
      >
        <Text className="text-orange-600 dark:text-orange-400 font-extrabold text-sm">{initials}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header bar */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
        >
          <ChevronLeft size={20} color={isDark ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>
        <View className="items-center flex-1">
          <Text className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            My Duels
          </Text>
          <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            1v1 Challenges
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          {liveCount > 0 && (
            <View className="flex-row items-center gap-0.5 px-2.5 py-1 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/30 rounded-full">
              <Flame size={10} color="#ea580c" />
              <Text className="text-[9px] font-black text-orange-600 dark:text-orange-400">{liveCount} Live</Text>
            </View>
          )}
          {pendingCount > 0 && (
            <View className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 rounded-full">
              <Text className="text-[9px] font-black text-amber-700 dark:text-amber-400">
                {pendingCount} Action
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row gap-2 px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full border transition-all ${
                isActive
                  ? 'bg-slate-950 border-slate-950 dark:bg-white dark:border-white shadow-sm'
                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
          }
        >
          {filtered.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-10 items-center justify-center mt-6">
              <Swords size={40} color={isDark ? '#475569' : '#cbd5e1'} className="mb-4" />
              <Text className="font-black text-slate-800 dark:text-slate-200 text-base mb-2">
                {filter === 'All' ? 'No duels yet' : `No ${filter.toLowerCase()} duels`}
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mb-6 leading-relaxed">
                Start a duel challenge by tapping the ⚔️ Duel button on any multiple choice question in your feed.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)' as any)}
                className="bg-indigo-600 px-6 py-3 rounded-xl shadow-sm"
              >
                <Text className="text-white font-bold text-sm">Browse Questions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              {filtered.map((duel, idx) => {
                const pill = STATUS_PILL[duel.status] ?? STATUS_PILL.expired;
                const needsAction =
                  (duel.status === 'pending' || duel.status === 'accepted') && !duel.isChallenger;

                return (
                  <TouchableOpacity
                    key={duel.id}
                    onPress={() => router.push(`/duel/${duel.id}` as any)}
                    className={`flex-row items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800/80 active:bg-slate-50 dark:active:bg-slate-800/50 ${
                      needsAction ? 'bg-orange-50/20 dark:bg-orange-950/5' : ''
                    } ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}
                  >
                    {renderAvatar(duel.opponent)}

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Text className="font-bold text-sm text-slate-950 dark:text-slate-50 truncate">
                          {duel.isChallenger
                            ? `You → ${duel.opponent.name.split(' ')[0]}`
                            : `${duel.opponent.name.split(' ')[0]} → You`}
                        </Text>
                        {needsAction && (
                          <View className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        )}
                      </View>

                      {duel.question && (
                        <Text className="text-xs text-slate-400 dark:text-slate-500 truncate" numberOfLines={1}>
                          {duel.question.subject ? (
                            <Text className="text-indigo-500 dark:text-indigo-400 font-semibold">
                              {duel.question.subject}
                            </Text>
                          ) : null}
                          {duel.question.subject ? ' • ' : ''}
                          {duel.question.title}
                        </Text>
                      )}
                    </View>

                    <View className="items-end gap-1.5 shrink-0">
                      <View className={`px-2 py-0.5 rounded-full ${pill.bg}`}>
                        <Text className={`text-[9px] font-black uppercase tracking-wide ${pill.text}`}>
                          {pill.label}
                        </Text>
                      </View>
                      {duel.status === 'completed' && (
                        <View className="flex-row items-center gap-0.5">
                          {duel.iWon ? (
                            <>
                              <Trophy size={10} color="#eab308" />
                              <Text className="text-[10px] font-black text-yellow-600 dark:text-yellow-500">🏆 Win</Text>
                            </>
                          ) : duel.isDraw ? (
                            <Text className="text-[10px] font-bold text-slate-400">Draw</Text>
                          ) : (
                            <>
                              <XCircle size={10} color="#f43f5e" />
                              <Text className="text-[10px] font-black text-rose-500">Loss</Text>
                            </>
                          )}
                        </View>
                      )}
                      <Text className="text-[9px] text-slate-400 dark:text-slate-600">
                        {new Date(duel.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>

                    <ChevronRight size={16} color={isDark ? '#475569' : '#cbd5e1'} className="ml-1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
