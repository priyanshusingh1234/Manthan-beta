import React, { useEffect, useState, useCallback } from 'react';
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

const SUBJECTS = [
  { label: 'All', value: '', emoji: '⚡' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
  { label: 'G.K', value: 'G.K', emoji: '🧠' },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳' },
];

export default function QuestionsFeed() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchFeed({ subject: subjectFilter, limit: 30 });
      setQuestions(data);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subjectFilter]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const renderItem = ({ item }: { item: any }) => (
    <QuestionCard key={item.id} q={item} />
  );

  return (
    <View className="flex-1">
      {/* Subject filters */}
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
                onPress={() => setSubjectFilter(isActive ? '' : sub.value)}
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

      {/* Feed */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Building your feed...</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
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

