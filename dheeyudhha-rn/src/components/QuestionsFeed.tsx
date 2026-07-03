import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { fetchFeed } from '@/lib/feedService';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import ArenaFeedCard from './ArenaFeedCard';
import FeedSkeleton from './FeedSkeleton';
import { ArrowUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';

const PAGE_SIZE = 10;
const CACHE_KEY = 'dheeyudhha_feed_cache';
const CACHE_TS_KEY = 'dheeyudhha_feed_cache_ts';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — stale after this

const SUBJECTS = [
  { label: 'All', value: '', emoji: '⚡' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
  { label: 'G.K', value: 'G.K', emoji: '🧠' },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳' },
  { label: 'Hindi Gr', value: 'Hindi Gr', emoji: '📖' },
];

export default function QuestionsFeed({ ListHeaderComponent }: { ListHeaderComponent?: React.ReactElement }) {
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [freshItems, setFreshItems] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track all question IDs seen so far — sent to API on load-more to avoid duplicates
  const seenIdsRef = useRef<Set<string>>(new Set());
  const allDataRef = useRef<any[]>([]);
  allDataRef.current = allData;
  const isMountedRef = useRef(false);

  const saveCache = useCallback((data: any[]) => {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    AsyncStorage.setItem(CACHE_TS_KEY, String(Date.now())).catch(() => {});
  }, []);

  const clearCache = useCallback(() => {
    AsyncStorage.multiRemove([CACHE_KEY, CACHE_TS_KEY]).catch(() => {});
  }, []);

  const loadFeed = useCallback(async (isRefresh = false, silent = false, isLoadMore = false) => {
    if (isRefresh && !silent) {
      setRefreshing(true);
    } else if (!silent && !isLoadMore && allDataRef.current.length === 0) {
      setLoading(true);
    }

    try {
      // For load-more, pass seen IDs so server avoids returning the same ones
      const excludeIds = isLoadMore ? [...seenIdsRef.current] : [];

      const data = await fetchFeed({
        subject: subjectFilter,
        chapter: chapterFilter,
        limit: 40,
        excludeIds,
      });

      // Cache only the default (no filters) fresh fetch
      if (!subjectFilter && !chapterFilter && !isLoadMore) {
        saveCache(data);
      }

      const currentAllData = allDataRef.current;

      if (isLoadMore) {
        const existingIds = new Set(currentAllData.map((q: any) => String(q.id)));
        const uniqueNew = data.filter((q: any) => !existingIds.has(String(q.id)));
        uniqueNew.forEach((q: any) => seenIdsRef.current.add(String(q.id)));
        setAllData(prev => [...prev, ...uniqueNew]);
        setVisibleCount(prev => prev + PAGE_SIZE);
      } else if (silent && currentAllData.length > 0) {
        const existingIds = new Set(currentAllData.map((q: any) => String(q.id)));
        const newItems = data.filter((q: any) => !existingIds.has(String(q.id)));
        if (newItems.length > 0) {
          setFreshItems(data);
        }
      } else {
        // Full load/refresh: reset seen IDs
        seenIdsRef.current = new Set(data.map((q: any) => String(q.id)));
        setAllData(data);
        setVisibleCount(PAGE_SIZE);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      if (!silent && !isLoadMore) {
        setLoading(false);
        setRefreshing(false);
      }
      setLoadingMore(false);
    }
  }, [subjectFilter, chapterFilter, saveCache]);

  // Parallel init: read cache + filters simultaneously, then fetch fresh
  useEffect(() => {
    const init = async () => {
      const [cachedRaw, cacheTs, storedSubject, storedChapter] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY).catch(() => null),
        AsyncStorage.getItem(CACHE_TS_KEY).catch(() => null),
        AsyncStorage.getItem('dheeyudhha_feed_subject').catch(() => null),
        AsyncStorage.getItem('dheeyudhha_feed_chapter').catch(() => null),
      ]);

      if (storedSubject !== null) setSubjectFilter(storedSubject);
      if (storedChapter !== null) setChapterFilter(storedChapter);

      // Only serve cache if it's within TTL
      const cacheAge = cacheTs ? Date.now() - Number(cacheTs) : Infinity;
      if (cachedRaw && cacheAge < CACHE_TTL_MS) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            seenIdsRef.current = new Set(parsed.map((q: any) => String(q.id)));
            setAllData(parsed);
            setLoading(false);
          }
        } catch { /* ignore */ }
      }
    };

    init().then(() => loadFeed());

    const refreshListener = DeviceEventEmitter.addListener('refresh_feed_filters', () => {
      clearCache();
      loadFeed(true);
    });

    const solvedListener = DeviceEventEmitter.addListener('question_solved', ({ questionId }) => {
      const id = String(questionId);
      seenIdsRef.current.add(id); // prevent it from coming back on load-more
      setAllData(prev => prev.filter((q: any) => String(q.id) !== id));
      clearCache(); // cache now has a solved question — invalidate it
    });

    return () => {
      refreshListener.remove();
      solvedListener.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadFeed();
  }, [subjectFilter, chapterFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      if (isMountedRef.current) {
        loadFeed(false, true);
      } else {
        isMountedRef.current = true;
      }
    }, [loadFeed])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    // Background poll every 60s (reduced from 30s)
    pollRef.current = setInterval(() => {
      loadFeed(false, true);
    }, 60000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadFeed]);

  const applyNewPosts = () => {
    seenIdsRef.current = new Set(freshItems.map((q: any) => String(q.id)));
    setAllData(freshItems);
    setFreshItems([]);
    setVisibleCount(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    if (visibleCount < allData.length) {
      // Still have buffered items — just reveal more without a network call
      setVisibleCount(prev => prev + PAGE_SIZE);
    } else {
      // Buffer exhausted — fetch fresh batch, excluding seen IDs
      setLoadingMore(true);
      loadFeed(false, false, true);
    }
  };

  const visibleData = allData.slice(0, visibleCount);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'post') {
      return (
        <View className="mb-4">
          <PostCard
            post={item}
            currentUserId={currentUserId}
            onUpdate={() => {}}
          />
        </View>
      );
    }
    if (item.type === 'gauntlet') {
      return <ArenaFeedCard key={item.id} gauntlet={item} />;
    }
    return <QuestionCard key={item.id} q={item} />;
  };

  return (
    <View className="flex-1">
      {/* "New questions available" Floating Banner */}
      {freshItems.length > 0 && (
        <TouchableOpacity
          onPress={applyNewPosts}
          activeOpacity={0.9}
          className="absolute top-4 self-center z-50 flex-row items-center gap-2 bg-indigo-600 px-5 py-3 rounded-full shadow-lg shadow-indigo-500/40"
        >
          <ArrowUp size={16} color="white" />
          <Text className="text-white font-black text-sm">New questions available</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {ListHeaderComponent}
          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
            >
              {SUBJECTS.map((sub) => (
                <View key={sub.label} className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 opacity-50 border border-slate-200 dark:border-slate-800">
                  <Text className="text-transparent font-bold">{sub.emoji} {sub.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <FeedSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={visibleData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              {ListHeaderComponent}
              <View className="mb-4">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
                >
                  {SUBJECTS.map((sub) => {
                    const isActive = subjectFilter === sub.value;
                    return (
                      <TouchableOpacity
                        key={sub.label}
                        onPress={async () => {
                          const newSub = isActive ? '' : sub.value;
                          setSubjectFilter(newSub);
                          setChapterFilter('');
                          await AsyncStorage.setItem('dheeyudhha_feed_subject', newSub);
                          await AsyncStorage.removeItem('dheeyudhha_feed_chapter');
                          setAllData([]);
                          setVisibleCount(PAGE_SIZE);
                          clearCache();
                        }}
                        className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Text className={isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}>{sub.emoji}</Text>
                        <Text className={`font-bold ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                clearCache();
                loadFeed(true);
              }}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-4">🔍</Text>
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-center">
                No questions found{subjectFilter ? ` for ${subjectFilter}` : ''}{chapterFilter ? ` - ${chapterFilter}` : ''}.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
