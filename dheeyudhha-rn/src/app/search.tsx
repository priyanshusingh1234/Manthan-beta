// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, ArrowLeft, User, MessageSquare, FileQuestion } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import PostCard from '@/components/PostCard';

type SearchResults = {
  users: any[];
  posts: any[];
  questions: any[];
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(params.q || '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'questions'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.q) {
      performSearch(params.q);
    }
  }, [params.q, performSearch]);

  const handleSearchSubmit = () => {
    router.setParams({ q: query });
    performSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    router.setParams({ q: '' });
  };

  // Safe area padding for the status bar
  const paddingTop = Platform.OS === 'android' ? Math.max(insets.top, 16) : insets.top;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header & Search Bar */}
      <View
        className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-100 dark:border-slate-800 z-50 px-4 pb-3"
        style={{ paddingTop }}
      >
        <View className="flex-row items-center gap-3 mt-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-indigo-600 dark:text-indigo-400" />
          </TouchableOpacity>

          <View className="flex-1 relative justify-center">
            <View className="absolute left-3 z-10">
              <SearchIcon size={18} className="text-slate-400" />
            </View>
            <TextInput
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text.length > 0) performSearch(text);
              }}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search friends, posts, or topics..."
              placeholderTextColor="#94a3b8"
              returnKeyType="search"
              autoFocus={true}
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-full pl-10 pr-10 py-3 text-base font-medium"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} className="absolute right-3 p-1 bg-slate-200 dark:bg-slate-800 rounded-full">
                <X size={14} className="text-slate-500" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Bar */}
        {results && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'All', icon: SearchIcon },
              { id: 'users', label: 'Users', icon: User },
              { id: 'posts', label: 'Community', icon: MessageSquare },
              { id: 'questions', label: 'Questions', icon: FileQuestion },
            ].map((tab) => {
              const isTabActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as any)}
                  className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${isTabActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                    : 'bg-transparent border-transparent'
                    }`}
                >
                  <tab.icon size={14} className={isTabActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"} />
                  <Text className={`text-xs font-black uppercase tracking-wider ${isTabActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                    }`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Results Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="mt-4 font-bold text-xs uppercase tracking-widest text-slate-400">Hunting for results...</Text>
          </View>
        ) : !results ? (
          <View className="py-20 items-center justify-center px-4">
            <View className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full items-center justify-center mb-6">
              <SearchIcon size={48} className="text-indigo-400 dark:text-indigo-600" />
            </View>
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Find anything on Dheeyudha</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center">Search for your friends, interesting community posts, or questions you want to solve.</Text>
          </View>
        ) : (
          <View className="space-y-10">
            {/* Users */}
            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-4 px-1">
                  <User size={16} className="text-slate-400" />
                  <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Users</Text>
                </View>
                <View className="gap-3">
                  {results.users.map(u => (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => router.push(u.is_teacher ? `/teacher/${u.username}` : `/user/${u.username}`)}
                      className="flex-row items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl"
                    >
                      <View className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center overflow-hidden">
                        {u.avatar_url ? (
                          <Image source={{ uri: u.avatar_url }} className="w-full h-full" />
                        ) : (
                          <User size={24} className="text-slate-400" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900 dark:text-slate-100">{u.full_name}</Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">@{u.username}</Text>
                        {u.school && <Text className="text-[10px] font-bold text-indigo-500 uppercase mt-1">{u.school}</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Questions */}
            {(activeTab === 'all' || activeTab === 'questions') && results.questions.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-4 px-1 mt-4">
                  <FileQuestion size={16} className="text-slate-400" />
                  <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Questions</Text>
                </View>
                <View className="gap-4">
                  {results.questions.map(q => (
                    <QuestionCard key={q.id} q={q} />
                  ))}
                </View>
              </View>
            )}

            {/* Posts */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-4 px-1 mt-4">
                  <MessageSquare size={16} className="text-slate-400" />
                  <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Community Posts</Text>
                </View>
                <View className="gap-4">
                  {results.posts.map(p => (
                    <PostCard
                      key={p.id}
                      post={p}
                      currentUserId={currentUserId}
                      onUpdate={() => performSearch(query)}
                      isFeed={false}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {results.users.length === 0 && results.posts.length === 0 && results.questions.length === 0 && (
              <View className="py-20 items-center justify-center">
                <Text className="font-bold text-slate-500 dark:text-slate-400 italic">No results found for "{query}"</Text>
                <TouchableOpacity onPress={clearSearch} className="mt-4">
                  <Text className="font-bold text-indigo-600 dark:text-indigo-400">Clear search and try again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
