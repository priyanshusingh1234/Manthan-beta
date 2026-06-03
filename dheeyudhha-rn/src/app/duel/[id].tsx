import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import {
  Swords,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Flame,
  Shield,
  ChevronLeft,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── countdown component ──────────────────────────────── */
function Countdown({ expiresAt, onExpired }: { expiresAt: string; onExpired?: () => void }) {
  const [t, setT] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setT('Expired');
        if (onExpired) onExpired();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setT(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  return <Text className="font-bold text-slate-700 dark:text-slate-300">{t}</Text>;
}

export default function DuelRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(() => Date.now());

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDuel = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta.vercel.app';
      const res = await fetch(`${API_URL}/api/duel/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Fetch duel error:', err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDuel();

    // 30s slow poll fallback
    pollRef.current = setInterval(fetchDuel, 30000);

    // Instant Realtime updates
    const channelName = `duel-${id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duel_challenges', filter: `id=eq.${id}` },
        () => {
          fetchDuel();
        }
      )
      .subscribe();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchDuel, id]);

  // Stop polling once terminal state
  useEffect(() => {
    const s = data?.duel?.status;
    if (['completed', 'rejected', 'expired'].includes(s)) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [data?.duel?.status]);

  const doAction = async (action: string, extra: object = {}) => {
    setActing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta.vercel.app';
      
      const res = await fetch(`${API_URL}/api/duel/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action, ...extra }),
      });

      const json = await res.json();
      if (res.ok) {
        await fetchDuel();
      } else {
        alert(json.error || 'Action failed');
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setActing(false);
    }
  };

  const renderAvatar = (player: { name: string; avatar: string | null }, size = 32) => {
    if (player.avatar) {
      return (
        <Image
          source={{ uri: player.avatar }}
          alt={player.name}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="border border-slate-200 dark:border-slate-800"
        />
      );
    }
    const initials = player.name.substring(0, 1).toUpperCase();
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200 dark:border-orange-900/50"
      >
        <Text className="text-orange-600 dark:text-orange-400 font-extrabold text-xs">{initials}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
        <Swords size={40} color={isDark ? '#475569' : '#cbd5e1'} className="mb-4" />
        <Text className="font-bold text-slate-800 dark:text-slate-200 mb-2">Duel not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { duel, question, challenger, challenged, currentUserId } = data;
  const isChallenger = currentUserId === challenger.id;
  const isChallenged = currentUserId === challenged.id;
  const options: string[] = Array.isArray(question?.options)
    ? question.options
    : typeof question?.options === 'string'
    ? JSON.parse(question.options)
    : [];

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Live ⚡',
    completed: 'Done',
    rejected: 'Declined',
    expired: 'Expired',
  };

  const statusPillClass = () => {
    if (duel.status === 'pending') return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
    if (duel.status === 'accepted') return 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with VS bar */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
        >
          <ChevronLeft size={16} color={isDark ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>

        {/* Players Row */}
        <View className="flex-1 flex-row items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2">
          <View className="flex-row items-center gap-2 max-w-[40%]">
            {renderAvatar(challenger, 28)}
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" numberOfLines={1}>
              {challenger.name.split(' ')[0]}
            </Text>
          </View>
          <View className="bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full flex-row items-center gap-0.5">
            <Swords size={10} color="#ea580c" />
            <Text className="text-[9px] font-black text-orange-600 dark:text-orange-400">VS</Text>
          </View>
          <View className="flex-row items-center gap-2 max-w-[40%] justify-end">
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right truncate" numberOfLines={1}>
              {challenged.name.split(' ')[0]}
            </Text>
            {renderAvatar(challenged, 28)}
          </View>
        </View>

        {/* Status Tag */}
        <View className={`px-2 py-1.5 rounded-xl border border-transparent ${statusPillClass()}`}>
          <Text className="text-[9px] font-black uppercase tracking-wide">
            {statusLabel[duel.status] ?? duel.status}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Taunt text */}
        {duel.message && (
          <Text className="text-center text-sm text-slate-500 dark:text-slate-400 italic px-4 mb-4">
            &ldquo;{duel.message}&rdquo;
          </Text>
        )}

        {/* ══ PENDING — challenged sees accept / reject ══ */}
        {duel.status === 'pending' && isChallenged && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 gap-5">
            <View className="items-center gap-2 text-center">
              <Text className="text-4xl">⚔️</Text>
              <Text className="text-lg font-black text-slate-950 dark:text-white text-center">
                {challenger.name.split(' ')[0]} challenged you!
              </Text>
              <Text className="text-xs text-slate-400 text-center">
                Can you answer this question?
              </Text>
            </View>

            {question?.title && (
              <View className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
                {question.subject && (
                  <Text className="text-[9px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">
                    {question.subject}
                  </Text>
                )}
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {question.title}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => doAction('reject')}
                disabled={acting}
                className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 active:scale-95"
              >
                {acting ? <ActivityIndicator size="small" color="#64748b" /> : <XCircle size={14} color="#f43f5e" />}
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => doAction('accept')}
                disabled={acting}
                className="flex-1 py-4 rounded-2xl bg-orange-600 flex-row items-center justify-center gap-2 active:scale-95"
              >
                {acting ? <ActivityIndicator size="small" color="white" /> : <Swords size={14} color="white" />}
                <Text className="text-white font-black text-sm uppercase tracking-wide">Accept ⚔️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══ PENDING — challenger waits ══ */}
        {duel.status === 'pending' && isChallenger && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-3">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="font-black text-lg text-slate-950 dark:text-white text-center">
              Waiting for {challenged.name.split(' ')[0]}…
            </Text>
            <View className="flex-row gap-1 items-center">
              <Clock size={12} color="#94a3b8" />
              <Countdown expiresAt={duel.expiresAt} />
              <Text className="text-xs text-slate-400 font-bold">remaining</Text>
            </View>

            {question?.title && (
              <View className="w-full mt-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Your challenge
                </Text>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {question.title}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ══ ACCEPTED — challenger waits for the answer ══ */}
        {duel.status === 'accepted' && isChallenger && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 items-center justify-center">
              <Flame size={28} color="#ea580c" />
            </View>
            <Text className="font-black text-lg text-slate-950 dark:text-white text-center">
              {challenged.name.split(' ')[0]} is answering…
            </Text>
            <Text className="text-slate-400 text-xs text-center">
              You will be notified once they submit their answer.
            </Text>
            <ActivityIndicator size="small" color="#94a3b8" className="mt-2" />
          </View>
        )}

        {/* ══ ACCEPTED — challenged answers ══ */}
        {duel.status === 'accepted' && isChallenged && !submitted && (
          <View className="gap-4">
            {/* Question card */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 gap-2">
              {question?.subject && (
                <View className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg self-start">
                  <Text className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                    {question.subject}
                  </Text>
                </View>
              )}
              <Text className="font-black text-base leading-snug text-slate-950 dark:text-white">
                {question?.title}
              </Text>
              {question?.body && (
                <Text className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {question.body}
                </Text>
              )}
            </View>

            {/* Options */}
            <View className="gap-2">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Choose your answer
              </Text>
              {options.map((opt, i) => {
                const isSelected = selectedOption === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedOption(i)}
                    className={`w-full flex-row items-center p-4 rounded-2xl border-2 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                        isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <View className="w-2 h-2 bg-white rounded-full" />}
                    </View>
                    <Text
                      className={`flex-1 text-sm ${
                        isSelected
                          ? 'text-orange-900 dark:text-orange-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 font-semibold'
                      }`}
                    >
                      <Text className="text-orange-500 font-black">{String.fromCharCode(65 + i)}. </Text>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedOption !== null && (
              <TouchableOpacity
                onPress={async () => {
                  setSubmitted(true);
                  await doAction('answer', {
                    answer: selectedOption,
                    timeMs: Date.now() - startTime,
                  });
                }}
                disabled={acting}
                className="w-full py-4 rounded-2xl bg-orange-600 flex-row items-center justify-center gap-2 shadow-md shadow-orange-200 dark:shadow-none active:scale-[0.98]"
              >
                {acting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Shield size={16} color="white" />
                    <Text className="text-white font-black text-base uppercase tracking-wider">
                      Lock In Answer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {duel.status === 'accepted' && isChallenged && submitted && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-3">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="font-black text-slate-950 dark:text-white">Answer submitted!</Text>
            <Text className="text-slate-400 text-xs">Calculating result…</Text>
          </View>
        )}

        {/* ══ COMPLETED ══ */}
        {duel.status === 'completed' && (
          <View className="gap-4">
            {/* Result hero */}
            {duel.winnerId === currentUserId ? (
              <View className="bg-white dark:bg-slate-900 border-2 border-yellow-300 dark:border-yellow-700/30 rounded-3xl shadow-md p-8 items-center gap-2">
                <Text className="text-5xl">🏆</Text>
                <Text className="text-2xl font-black text-slate-950 dark:text-white">You Won!</Text>
                <Text className="text-slate-400 text-xs text-center leading-relaxed">
                  {isChallenger
                    ? `${challenged.name.split(' ')[0]} couldn't crack your question!`
                    : 'You answered it correctly! Points awarded.'}
                </Text>
              </View>
            ) : (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-2">
                <Text className="text-5xl">💀</Text>
                <Text className="text-2xl font-black text-slate-950 dark:text-white">You Lost!</Text>
                <Text className="text-slate-400 text-xs text-center leading-relaxed">
                  {isChallenger
                    ? `${challenged.name.split(' ')[0]} cracked your question!`
                    : 'Wrong answer this time. Better luck next challenge!'}
                </Text>
              </View>
            )}

            {/* Breakdown card */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 gap-4">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Result Breakdown
              </Text>

              <View className="flex-row items-center gap-3">
                {renderAvatar(challenged, 40)}
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-xs text-slate-950 dark:text-white">
                    {challenged.name.split(' ')[0]}'s answer
                  </Text>
                  {duel.challengedAnswer !== null && options[duel.challengedAnswer] ? (
                    <Text className="text-[11px] text-slate-400 truncate mt-0.5">
                      {String.fromCharCode(65 + duel.challengedAnswer)}.{' '}
                      {options[duel.challengedAnswer]}
                    </Text>
                  ) : (
                    <Text className="text-[11px] text-slate-400 truncate mt-0.5">No answer</Text>
                  )}
                </View>
                {duel.challengedCorrect ? (
                  <View className="flex-row items-center gap-1">
                    <CheckCircle size={14} color="#10b981" />
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      Correct
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1">
                    <XCircle size={14} color="#f43f5e" />
                    <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">Wrong</Text>
                  </View>
                )}
              </View>

              {question?.correct_option !== undefined && options[question.correct_option] ? (
                <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3">
                  <Text className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    <Text className="font-black text-emerald-600 dark:text-emerald-400">
                      ✓ Correct Option:{' '}
                    </Text>
                    {String.fromCharCode(65 + question.correct_option)}.{' '}
                    {options[question.correct_option]}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ══ REJECTED ══ */}
        {duel.status === 'rejected' && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-3">
            <XCircle size={44} color="#f43f5e" />
            <Text className="text-lg font-black text-slate-950 dark:text-white">Duel Declined</Text>
            <Text className="text-slate-400 text-xs text-center leading-relaxed">
              {isChallenged
                ? 'You declined this duel challenge.'
                : `${challenged.name.split(' ')[0]} declined your challenge.`}
            </Text>
          </View>
        )}

        {/* ══ EXPIRED ══ */}
        {duel.status === 'expired' && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 items-center gap-3">
            <Clock size={44} color={isDark ? '#475569' : '#cbd5e1'} />
            <Text className="text-lg font-black text-slate-950 dark:text-white">Duel Expired</Text>
            <Text className="text-slate-400 text-xs text-center leading-relaxed">
              The 24-hour response window passed without a submission.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
