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

const SUBJECTS = [
  { label: 'All', value: '', emoji: '⚡' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
  { label: 'G.K', value: 'G.K', emoji: '🧠' },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳' },
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
  
  const allDataRef = useRef<any[]>([]);
  allDataRef.current = allData;
  const isMountedRef = useRef(false);

  const loadFeed = useCallback(async (isRefresh = false, silent = false) => {
    if (isRefresh && !silent) {
      setRefreshing(true);
    } else if (!silent && allDataRef.current.length === 0) {
      setLoading(true);
    }

    try {
      const data = await fetchFeed({ subject: subjectFilter, chapter: chapterFilter, limit: 40 });
      
      // Cache the feed for the default view to enable instant launch next time
      if (!subjectFilter && !chapterFilter) {
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
      }

      const currentAllData = allDataRef.current;
      if (silent && currentAllData.length > 0) {
        // Background refresh: check if new questions arrived
        const existingIds = new Set(currentAllData.map(q => q.id));
        const newItems = data.filter(q => !existingIds.has(q.id));
        if (newItems.length > 0) {
          setFreshItems(data); // store the full new feed to apply later
        }
      } else {
        setAllData(data);
        setVisibleCount(PAGE_SIZE);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
      setLoadingMore(false);
    }
  }, [subjectFilter, chapterFilter]);

  const loadFiltersFromStorage = async () => {
    try {
      const storedSubject = await AsyncStorage.getItem('dheeyudhha_feed_subject');
      const storedChapter = await AsyncStorage.getItem('dheeyudhha_feed_chapter');
      if (storedSubject !== null) setSubjectFilter(storedSubject);
      if (storedChapter !== null) setChapterFilter(storedChapter);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllData(parsed);
            setLoading(false); // Instantly dismiss loader since we have cached data
          }
        }
      } catch (e) {
        // ignore cache read errors
      }
    };
    initCache().then(() => {
      loadFiltersFromStorage().then(() => loadFeed());
    });

    const refreshListener = DeviceEventEmitter.addListener('refresh_feed_filters', () => {
      loadFiltersFromStorage();
    });

    const solvedListener = DeviceEventEmitter.addListener('question_solved', ({ questionId }) => {
      setAllData((prev) => prev.filter((q) => String(q.id) !== String(questionId)));
    });

    return () => {
      refreshListener.remove();
      solvedListener.remove();
    };
  }, []); // Initial load and event setup

  useEffect(() => {
    // Only fetch if filters actually change and it's not the initial mount
    // since initial mount is handled above.
    // For simplicity, we just trigger loadFeed when filters change.
    loadFeed();
  }, [subjectFilter, chapterFilter]);

  useFocusEffect(
    useCallback(() => {
      if (isMountedRef.current) {
        loadFeed(false, false);
      } else {
        isMountedRef.current = true;
      }
    }, [loadFeed])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    // Silent background polling every 30 seconds
    pollRef.current = setInterval(() => {
      loadFeed(false, true);
    }, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadFeed]);

  const applyNewPosts = () => {
    setAllData(freshItems);
    setFreshItems([]);
    setVisibleCount(PAGE_SIZE);
    // FlatList will naturally render the new items at top
  };

  const handleLoadMore = () => {
    if (visibleCount >= allData.length) {
      setLoadingMore(true);
      loadFeed(); // fetch another batch from the algorithm
    } else {
      setVisibleCount(prev => prev + PAGE_SIZE);
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
                          setChapterFilter(''); // Reset chapter when changing subject
                          await AsyncStorage.setItem('dheeyudhha_feed_subject', newSub);
                          await AsyncStorage.removeItem('dheeyudhha_feed_chapter');
                          setAllData([]);
                          setVisibleCount(PAGE_SIZE);
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
              onRefresh={() => loadFeed(true)}
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

