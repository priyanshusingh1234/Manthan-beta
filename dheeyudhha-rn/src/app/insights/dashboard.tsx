import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Eye, Heart, MessageCircle, TrendingUp, BarChart2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

export default function InsightsDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all posts authored by the user
        const { data, error } = await supabase
          .from('posts')
          .select('id, content, created_at, likes_count, comments_count, views_count, image_url, image_urls, video_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching dashboard insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Aggregate Metrics
  const totalPosts = posts.length;
  const totalViews = posts.reduce((acc, p) => acc + (Number(p.views_count) || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (Number(p.likes_count) || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (Number(p.comments_count) || 0), 0);

  // Top Performing Posts (sort by views + likes)
  const topPosts = [...posts]
    .sort((a, b) => {
      const scoreA = (Number(a.views_count) || 0) + (Number(a.likes_count) || 0);
      const scoreB = (Number(b.views_count) || 0) + (Number(b.likes_count) || 0);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
          <ArrowLeft size={20} color={isDark ? '#cbd5e1' : '#334155'} />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-black text-slate-900 dark:text-white text-center mr-6">Professional Dashboard</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Account Overview Header */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Account Overview</Text>
          <Text className="text-2xl font-black text-slate-900 dark:text-white">Your Performance</Text>
        </View>

        {/* Big Views Card */}
        <View className="bg-gradient-to-br from-indigo-500 to-purple-600 mx-4 mt-3 rounded-3xl p-6 shadow-md shadow-indigo-500/20 relative overflow-hidden">
          <View className="absolute -right-4 -top-4 opacity-20">
            <BarChart2 size={120} color="#fff" />
          </View>
          <View className="flex-row items-center gap-2 mb-2">
            <Eye size={20} color="#fff" />
            <Text className="text-white/80 font-bold text-sm uppercase tracking-widest">Total Views</Text>
          </View>
          <Text className="text-4xl font-black text-white">{formatNumber(totalViews)}</Text>
          <View className="mt-4 flex-row items-center gap-1.5 bg-white/20 self-start px-3 py-1.5 rounded-full">
            <TrendingUp size={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Across {totalPosts} Posts</Text>
          </View>
        </View>

        {/* Aggregate Stats Row */}
        <View className="flex-row mx-4 mt-4 gap-3">
          <View className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <View className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 items-center justify-center mb-3">
              <Heart size={20} color="#f43f5e" fill="#f43f5e" />
            </View>
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-0.5">{formatNumber(totalLikes)}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Likes</Text>
          </View>

          <View className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-3">
              <MessageCircle size={20} color="#3b82f6" fill="#3b82f6" />
            </View>
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-0.5">{formatNumber(totalComments)}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide">Comments</Text>
          </View>
        </View>

        {/* Top Posts Section */}
        <View className="px-5 mt-10 mb-4">
          <Text className="text-lg font-black text-slate-900 dark:text-white">Top Performing Posts</Text>
        </View>

        {topPosts.length === 0 ? (
          <View className="px-5 py-8 items-center">
            <Text className="text-slate-500 font-medium text-center">You haven't posted anything yet. Make your first post to see insights!</Text>
          </View>
        ) : (
          <View className="px-4 gap-3">
            {topPosts.map((post, idx) => {
              const previewText = post.content ? post.content.substring(0, 50) + '...' : 'Media Post';
              const imageArray = Array.isArray(post.image_urls) && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
              
              return (
                <TouchableOpacity 
                  key={post.id}
                  onPress={() => router.push(`/insights/${post.id}` as any)}
                  activeOpacity={0.7}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3 flex-row items-center border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <View className="w-8 justify-center items-center">
                    <Text className="text-lg font-black text-slate-300 dark:text-slate-700">#{idx + 1}</Text>
                  </View>
                  
                  {imageArray.length > 0 ? (
                    <Image source={{ uri: imageArray[0] }} className="w-12 h-12 rounded-xl mx-3" resizeMode="cover" />
                  ) : (
                    <View className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 mx-3 items-center justify-center">
                      <Text className="text-xl font-bold text-slate-400">📝</Text>
                    </View>
                  )}

                  <View className="flex-1 justify-center">
                    <Text className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-tight mb-1" numberOfLines={2}>
                      {previewText}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1">
                        <Eye size={10} color="#6366f1" />
                        <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{formatNumber(Number(post.views_count) || 0)}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Heart size={10} color="#f43f5e" />
                        <Text className="text-[11px] font-bold text-rose-500">{formatNumber(Number(post.likes_count) || 0)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
