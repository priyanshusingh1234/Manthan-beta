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
import { ArrowUp } from 'lucide-react-native';

const PAGE_SIZE = 10;

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
  
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [freshItems, setFreshItems] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFeed = useCallback(async (isRefresh = false, silent = false) => {
    if (isRefresh && !silent) {
      setRefreshing(true);
    } else if (!silent && allData.length === 0) {
      setLoading(true);
    }

    try {
      // Use higher limit for feed generation to allow local pagination
      const data = await fetchFeed({ subject: subjectFilter, limit: 40 });
      
      if (silent && allData.length > 0) {
        // Background refresh: check if new questions arrived
        const existingIds = new Set(allData.map(q => q.id));
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
  }, [subjectFilter, allData]);

  useEffect(() => {
    loadFeed();
  }, [subjectFilter]); // Re-fetch on filter change

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

  const renderItem = ({ item }: { item: any }) => (
    <QuestionCard key={item.id} q={item} />
  );

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
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Building your feed...</Text>
        </View>
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
                        onPress={() => {
                          setSubjectFilter(isActive ? '' : sub.value);
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
                No questions found{subjectFilter ? ` for ${subjectFilter}` : ''}.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

