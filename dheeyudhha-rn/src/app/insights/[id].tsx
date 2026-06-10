import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Eye, Heart, MessageCircle, BarChart3, TrendingUp, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width } = Dimensions.get('window');

// Formatter for large numbers (e.g., 1200 -> 1.2k)
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const PostVideoPreview = React.memo(({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
  });
  return (
    <View className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
});

export default function PostInsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        };

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${id}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch post');

        const postData = await response.json();
        setPost(postData);
      } catch (err) {
        console.error('Error fetching post insights:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <Text className="text-slate-500 font-bold">Post not found</Text>
      </View>
    );
  }

  const viewsCount = Number(post.views_count) || 0;
  const likesCount = Number(post.likes_count) || 0;
  const commentsCount = Number(post.comments_count) || 0;
  const totalInteractions = likesCount + commentsCount;

  // Media preview logic
  const videoUrl = post.video_url || post.videoUrl;
  const images = Array.isArray(post.image_urls) && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
  const hasMedia = videoUrl || images.length > 0;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
          <ArrowLeft size={20} color={isDark ? '#cbd5e1' : '#334155'} />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-black text-slate-900 dark:text-white text-center mr-6">Post Insights</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Post Preview Card */}
        <View className="bg-white dark:bg-slate-900 m-4 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Preview</Text>
          
          {hasMedia && (
            <View className="mb-3">
              {videoUrl ? (
                <PostVideoPreview url={videoUrl} />
              ) : (
                <Image source={{ uri: images[0] }} className="w-full h-48 rounded-2xl" resizeMode="cover" />
              )}
            </View>
          )}

          {post.content ? (
            <Text className="text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed" numberOfLines={3}>
              {post.content}
            </Text>
          ) : null}
          <Text className="text-xs text-slate-400 mt-2 font-medium">
            Posted {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Discovery / Overview Section */}
        <View className="px-5 mb-2 mt-2 flex-row justify-between items-end">
          <Text className="text-lg font-black text-slate-900 dark:text-white">Discovery</Text>
          <BarChart3 size={18} color="#6366f1" />
        </View>

        <View className="bg-white dark:bg-slate-900 mx-4 mt-2 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center">
                <Eye size={24} color="#6366f1" />
              </View>
              <View>
                <Text className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Total Views</Text>
                <Text className="text-2xl font-black text-slate-900 dark:text-white">{formatNumber(viewsCount)}</Text>
              </View>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full flex-row items-center gap-1">
              <TrendingUp size={12} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">Active</Text>
            </View>
          </View>

          {/* Progress bar aesthetic for reach */}
          <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
            <View className="h-full bg-indigo-500 rounded-full w-full" />
          </View>
          <Text className="text-xs font-semibold text-slate-400 text-center">Accounts Reached: {formatNumber(viewsCount)}</Text>
        </View>

        {/* Interactions Section */}
        <View className="px-5 mb-2 mt-8 flex-row justify-between items-end">
          <Text className="text-lg font-black text-slate-900 dark:text-white">Interactions</Text>
          <Users size={18} color="#f43f5e" />
        </View>

        <View className="flex-row mx-4 mt-2 mb-10 gap-3">
          {/* Likes Box */}
          <View className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm items-center">
            <View className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 items-center justify-center mb-2">
              <Heart size={20} color="#f43f5e" fill="#f43f5e" />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-white">{formatNumber(likesCount)}</Text>
            <Text className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">Likes</Text>
          </View>

          {/* Comments Box */}
          <View className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm items-center">
            <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-2">
              <MessageCircle size={20} color="#3b82f6" fill="#3b82f6" />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-white">{formatNumber(commentsCount)}</Text>
            <Text className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">Comments</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
