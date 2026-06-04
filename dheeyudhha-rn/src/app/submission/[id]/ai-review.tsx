import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bot, CheckCircle2, XCircle, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

type AIReviewData = {
  verdict: 'correct' | 'wrong';
  breakdown: string;
  raw: string;
  timestamp: string;
};

export default function AIReviewScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<AIReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paddingTop = Platform.OS === 'android' ? Math.max(insets.top, 16) : insets.top;

  useEffect(() => {
    if (!params.id) return;

    const fetchReview = async () => {
      try {
        // Fetch the JSON from the public storage bucket
        const res = await fetch(`https://ivkrupsksxibaibmiibk.supabase.co/storage/v1/object/public/written-answers/ai-reviews/${params.id}.json`);
        if (!res.ok) {
          throw new Error("AI Review not found or still processing.");
        }
        const data = await res.json();
        setReviewData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [params.id]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-slate-500 dark:text-slate-400 font-medium">Loading AI analysis...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View 
        className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-100 dark:border-slate-800 z-50 px-4 pb-3"
        style={{ paddingTop }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="flex-row items-center gap-2 mt-2 py-2 -ml-2"
        >
          <ArrowLeft size={20} className="text-slate-500 dark:text-slate-400" />
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Back to Submission</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}>
        <View className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative p-6 sm:p-8">
          
          {/* Decorative Blur Background - Simplified for React Native via opacity blocks or just clean UI */}
          
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center border border-violet-200 dark:border-violet-800/50">
              <Bot size={24} color={isDark ? '#a78bfa' : '#7c3aed'} />
            </View>
            <View>
              <Text className="text-2xl font-black text-slate-800 dark:text-slate-100">AI Analysis Report</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">Independent Gemini Verification</Text>
            </View>
          </View>

          {error ? (
            <View className="p-6 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 items-center gap-3">
              <XCircle size={32} color={isDark ? '#f87171' : '#dc2626'} style={{ opacity: 0.7 }} />
              <Text className="font-semibold text-center text-red-700 dark:text-red-400">{error}</Text>
            </View>
          ) : reviewData ? (
            <View className="gap-6 flex-col">
              {/* Verdict Pill */}
              <View className={`self-start flex-row items-center gap-2 px-4 py-2 rounded-xl border ${
                reviewData.verdict === "correct"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
              }`}>
                {reviewData.verdict === "correct" 
                  ? <CheckCircle2 size={20} color={isDark ? '#34d399' : '#059669'} /> 
                  : <XCircle size={20} color={isDark ? '#f87171' : '#dc2626'} />
                }
                <Text className={`text-sm font-bold tracking-wide uppercase ${
                  reviewData.verdict === "correct" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}>
                  FINAL VERDICT: {reviewData.verdict}
                </Text>
              </View>

              {/* Auto-Delete Storage Notice for Wrong Answers */}
              {reviewData.verdict === "wrong" && (
                <View className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-900/50">
                  <Text className="font-bold text-amber-900 dark:text-amber-500 mb-1">⚠️ Space Saving Policy</Text>
                  <Text className="text-sm font-medium text-amber-800 dark:text-amber-600 leading-relaxed">
                    Because your answer was marked wrong, this submission and its review will be automatically deleted in 2 days to keep our servers fast and clean.
                  </Text>
                </View>
              )}

              {/* Breakdown */}
              <View className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center gap-2 mb-3">
                  <Sparkles size={16} color={isDark ? '#94a3b8' : '#94a3b8'} />
                  <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    The Breakdown
                  </Text>
                </View>
                <Text className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg">
                  {reviewData.breakdown}
                </Text>
              </View>

              {/* Raw Details Placeholder */}
              <View className="mt-4">
                <Text className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2">
                  Raw Diagnostics (truncated for mobile)
                </Text>
                <ScrollView 
                  horizontal 
                  className="bg-slate-900 rounded-xl border border-slate-700" 
                  contentContainerStyle={{ padding: 16 }}
                >
                  <Text className="text-slate-300 text-xs font-mono">
                    {JSON.stringify(reviewData, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
