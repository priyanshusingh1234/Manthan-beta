import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { ArrowLeft, BookOpen } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
const PAGE_SIZE = 20;

function normalizeForCard(q: any) {
  const parsedOptions = (() => {
    try {
      if (typeof q.options === 'string') return JSON.parse(q.options);
      return q.options || null;
    } catch { return null; }
  })();

  const profile = q.profiles || null;

  return {
    ...q,
    id: String(q.id),
    title: q.title || q.question_text || 'Question',
    body: q.body || null,
    subject: q.subject || 'General',
    chapter: q.chapter || null,
    classGrade: q.class_grade || q.classGrade || null,
    points: q.points || 5,
    timeLimit: q.time_limit || q.timeLimit || 60,
    difficulty: q.difficulty || null,
    options: parsedOptions,
    correctOption: q.correct_option ?? q.correctOption ?? null,
    questionType: q.question_type || q.questionType || 'mcq',
    matchPairs: (() => {
      try {
        if (typeof q.match_pairs === 'string') return JSON.parse(q.match_pairs);
        return q.match_pairs || null;
      } catch { return null; }
    })(),
    imageUrl: q.image_url || q.imageUrl || null,
    imagePath: q.image_path || q.imagePath || null,
    hasAttempted: q.hasAttempted || false,
    hasFailed: q.hasFailed || false,
    totalAttempts: 0,
    solvedCount: 0,
    // Teacher profile from DB join
    profiles: profile,
    createdByName: profile?.full_name || 'Teacher',
    createdByAvatar: profile?.avatar_url || null,
    createdByUsername: profile?.username || null,
    createdByIsTeacher: profile?.is_teacher ?? true,
    _feedLabel: q.hasAttempted ? '✅ Solved' : '📖 Practice',
    _feedScore: 0,
  };
}

export default function PracticeQuestionsScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams<{ chapter: string }>();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);

  const fetchPage = useCallback(async (cursor: string | null, isRefresh = false) => {
    if (!chapter) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const params = new URLSearchParams({
        chapter,
        limit: String(PAGE_SIZE),
        ...(cursor ? { cursor } : {}),
      });

      const res = await fetch(`${API_URL}/api/practice/questions?${params}`, { headers });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const normalized = (data.questions || []).map(normalizeForCard);

      if (isRefresh) {
        setQuestions(normalized);
      } else {
        setQuestions(prev => {
          const existingIds = new Set(prev.map(q => q.id));
          const unique = normalized.filter((q: any) => !existingIds.has(q.id));
          return [...prev, ...unique];
        });
      }

      cursorRef.current = data.nextCursor || null;
      setHasMore(!!data.hasMore);
    } catch (e: any) {
      console.error('Error fetching practice questions:', e);
    }
  }, [chapter]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      cursorRef.current = null;
      await fetchPage(null);
      setLoading(false);
    }
    init();
  }, [chapter]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    await fetchPage(cursorRef.current);
    setLoadingMore(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    cursorRef.current = null;
    await fetchPage(null, true);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <QuestionCard q={item} />
  );

  const ListHeader = (
    <View style={{
      paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24,
      backgroundColor: '#0f172a',
    }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}
        activeOpacity={0.7}
      >
        <ArrowLeft size={20} color="#94a3b8" />
        <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 14 }}>All Chapters</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 14,
          backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={22} color="#60a5fa" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, letterSpacing: -0.3, flexShrink: 1 }}>
            {chapter}
          </Text>
          {!loading && (
            <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
              {questions.length} questions loaded{hasMore ? ', scroll for more' : ' · All loaded'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {loading ? (
        <>
          {ListHeader}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{ color: '#475569', marginTop: 12, fontWeight: '600' }}>
              Loading questions...
            </Text>
          </View>
        </>
      ) : questions.length === 0 ? (
        <>
          {ListHeader}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: '#475569', fontWeight: '700', fontSize: 16 }}>
              No questions found
            </Text>
          </View>
        </>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={6}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4f46e5"
              colors={['#4f46e5']}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={{ color: '#475569', marginTop: 8, fontWeight: '600', fontSize: 13 }}>
                  Loading more...
                </Text>
              </View>
            ) : !hasMore && questions.length > 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: '#334155', fontWeight: '700', fontSize: 13 }}>
                  ✅ All {questions.length} questions loaded
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📭</Text>
              <Text style={{ color: '#475569', fontWeight: '700' }}>No questions yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
