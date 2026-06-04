import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, CheckCircle2, Zap, Users, AlertTriangle, Eye, ThumbsUp, ThumbsDown, Trophy, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

export default function CheckerFeedScreen() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [votingId, setVotingId] = useState<string | null>(null);
  const [myvotes, setMyVotes] = useState<Record<string, "correct" | "wrong">>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (mounted) {
        setToken(session.access_token);
        setIsTeacher(!!session.user.user_metadata?.isTeacher);
        setAuthChecked(true);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!token || isTeacher) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/checker-vote`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setItems([]); return; }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isTeacher]);

  useEffect(() => {
    if (authChecked && !isTeacher) fetchFeed();
    else if (authChecked && isTeacher) setLoading(false);
  }, [authChecked, isTeacher, fetchFeed]);

  const handleVote = async (submissionId: string, vote: "correct" | "wrong") => {
    if (!token || votingId) return;
    setVotingId(submissionId);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/checker-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId, vote }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.error || "Vote failed"); return; }

      setMyVotes(prev => ({ ...prev, [submissionId]: vote }));
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== submissionId));
      }, 1500);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setVotingId(null);
    }
  };

  if (!authChecked || (loading && !refreshing)) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 font-medium text-slate-500 dark:text-slate-400">Loading checker feed...</Text>
      </View>
    );
  }

  if (isTeacher) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-8">
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm items-center">
          <Shield size={64} color="#94a3b8" className="mb-4" />
          <Text className="text-2xl font-black text-slate-900 dark:text-slate-100 text-center">Checker Feed</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
            Teachers don't participate in peer checking.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed(true)} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="mb-6">
          <View className="self-start flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-3">
            <View className="w-2 h-2 rounded-full bg-indigo-600" />
            <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">Live Checker Feed</Text>
          </View>
          <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Peer Review</Text>
          <Text className="text-slate-600 dark:text-slate-400 font-medium">
            Review written answers submitted by your peers. Earn <Text className="font-bold text-indigo-600 dark:text-indigo-400">+2 points</Text> for correctly identifying wrong answers.
          </Text>

          <View className="flex-row items-center gap-3 mt-4">
            <TouchableOpacity
              onPress={() => fetchFeed(false)}
              className="flex-row items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <RefreshCw size={16} color="#475569" />
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Refresh</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-1.5">
              <Users size={16} color="#64748b" />
              <Text className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {items.length} waiting
              </Text>
            </View>
          </View>
        </View>

        {/* Reward Info */}
        <View className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-row gap-3 mb-6">
          <Trophy size={20} color="#f59e0b" className="mt-0.5" />
          <View className="flex-1">
            <Text className="font-bold text-slate-900 dark:text-slate-100 mb-1">How rewards work:</Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm mb-1">• Vote "Wrong" → if 2 flag it → AI verifies. Earn <Text className="text-indigo-600 font-bold">+2 pts</Text></Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm mb-1">• Vote "Correct" → if 2 agree → Earn <Text className="text-emerald-600 font-bold">+1 pt</Text></Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm">• Spamming "Wrong" → <Text className="text-red-600 font-bold">-1 pt penalty</Text></Text>
          </View>
        </View>

        {items.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm items-center mt-4">
            <View className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#10b981" />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-slate-100 text-center mb-2">All Caught Up!</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">No written answers waiting for peer review right now.</Text>
            <TouchableOpacity
              onPress={() => fetchFeed(false)}
              className="bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-xl"
            >
              <Text className="font-bold text-slate-700 dark:text-slate-300">Refresh Feed</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-5">
            {items.map((item) => {
              const voted = myvotes[item.id];
              const isExpanded = expandedItem === item.id;

              return (
                <View key={item.id} className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${voted ? 'opacity-60' : ''}`}>
                  <View className="p-5">
                    {/* Co-op Badge */}
                    {item.isCoopChallenge && (
                      <View className="flex-row items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-3 py-2 mb-4">
                        <Users size={14} color="#4f46e5" />
                        <Text className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Co-op Challenge Split</Text>
                      </View>
                    )}

                    <View className="flex-row justify-between gap-4 mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">{item.questions.title}</Text>
                        {item.questions.body && (
                          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1" numberOfLines={2}>{item.questions.body}</Text>
                        )}
                      </View>
                      <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl flex-row items-center gap-1 self-start">
                        <Zap size={12} color="#d97706" fill="#d97706" />
                        <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold">{item.questions.points} pts</Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap items-center gap-2 mb-4">
                      <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                        <AlertTriangle size={12} color="#f97316" />
                        <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">{item.wrongVotes}/{item.requiredToFlag} flags</Text>
                      </View>
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                        <CheckCircle2 size={12} color="#10b981" />
                        <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">{item.correctVotes ?? 0}/{item.requiredToFlag} approvals</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                      className="flex-row items-center gap-2 py-2 mb-2"
                    >
                      <Eye size={16} color="#4f46e5" />
                      <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{isExpanded ? "Hide Answers" : "View Answers"}</Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="mb-5 space-y-4">
                        <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Student's Answer</Text>
                          {item.submission_url ? (
                            <Image source={{ uri: item.submission_url }} className="w-full h-48 rounded-xl bg-white dark:bg-slate-950" resizeMode="contain" />
                          ) : (
                            <View className="h-32 items-center justify-center bg-white dark:bg-slate-950 rounded-xl"><Text className="text-slate-400">No image</Text></View>
                          )}
                        </View>

                        <View className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl">
                          <Text className="text-xs font-bold text-indigo-500 uppercase mb-2">Teacher's Model Answer</Text>
                          {item.teacherSolutionUrl ? (
                            <Image source={{ uri: item.teacherSolutionUrl }} className="w-full h-48 rounded-xl bg-white dark:bg-slate-950" resizeMode="contain" />
                          ) : (
                            <View className="h-32 items-center justify-center bg-white dark:bg-slate-950 rounded-xl px-4"><Text className="text-slate-400 text-center">Teacher hasn't uploaded a model answer.</Text></View>
                          )}
                        </View>
                      </View>
                    )}

                    {voted ? (
                      <View className={`py-4 rounded-xl flex-row justify-center items-center gap-2 ${voted === 'correct' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        {voted === 'correct' ? <ThumbsUp size={16} color="#10b981" /> : <ThumbsDown size={16} color="#ef4444" />}
                        <Text className={`font-bold ${voted === 'correct' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                          {voted === 'correct' ? 'Voted Correct' : 'Flagged Wrong'}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={() => handleVote(item.id, 'correct')}
                          disabled={!!votingId}
                          className="flex-1 bg-emerald-600 py-3.5 rounded-xl flex-row justify-center items-center gap-2"
                        >
                          {votingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <ThumbsUp size={16} color="#fff" />}
                          <Text className="text-white font-bold">Correct</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleVote(item.id, 'wrong')}
                          disabled={!!votingId}
                          className="flex-1 bg-red-600 py-3.5 rounded-xl flex-row justify-center items-center gap-2"
                        >
                          {votingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <ThumbsDown size={16} color="#fff" />}
                          <Text className="text-white font-bold">Flag Wrong</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
