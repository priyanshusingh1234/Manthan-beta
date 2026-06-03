import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, User, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  currentUserId: string | null;
  onUpdate?: () => void;
  isSinglePost?: boolean;
}

export default function PostCard({ post, currentUserId, onUpdate, isSinglePost = false }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [likingPost, setLikingPost] = useState(false);

  const author = post.author || {};
  const avatarUrl = author.avatar_url;
  const name = author.name || author.full_name || 'Scholar';
  const username = author.username || 'scholar';

  const images = post.image_urls && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== currentImageIndex && index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  const player = useVideoPlayer(post.video_url, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleLike = async () => {
    if (!currentUserId || likingPost) return;
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikingPost(true);

    try {
      if (!prevLiked) {
        // Like
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      } else {
        // Unlike
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      }
    } catch (e) {
      console.error(e);
      // Revert optimistic update on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLikingPost(false);
    }
  };

  // Basic formatting for @ and # mentions
  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[\w.-]+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <Text key={index} className="text-sky-500 font-bold">
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const handlePress = () => {
    if (!isSinglePost) {
      router.push(`/posts/${post.id}` as any);
    }
  };

  return (
    <Pressable 
      onPress={handlePress}
      disabled={isSinglePost}
      className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 ${!isSinglePost ? 'active:bg-slate-50 dark:active:bg-slate-850' : ''}`}
    >
      {post._feedLabel ? (
        <View className="flex-row items-center mb-3">
          <View className="bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-2.5 py-1 flex-row items-center border border-indigo-100 dark:border-indigo-800/50">
            <Sparkles size={12} color="#4f46e5" />
            <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold ml-1 tracking-wider uppercase">
              {post._feedLabel}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="flex-row">
        {/* Avatar */}
        <TouchableOpacity 
          onPress={() => router.push(`/user/${username}` as any)}
          activeOpacity={0.7}
          className="mr-3"
        >
          <View className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" />
            ) : (
              <User size={20} color="#94a3b8" />
            )}
          </View>
        </TouchableOpacity>

        {/* Content Area */}
        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-1">
            <TouchableOpacity 
              onPress={() => router.push(`/user/${username}` as any)}
              activeOpacity={0.7}
              className="flex-row items-center flex-1 mr-2"
            >
              <Text className="font-bold text-[15px] text-slate-900 dark:text-slate-100 mr-1" numberOfLines={1}>
                {name}
              </Text>
              <Text className="text-[14px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                @{username} · {formatTimeAgo(post.created_at)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="p-1 -mr-2">
              <MoreVertical size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Text Content */}
          <Text className="text-[15px] text-slate-800 dark:text-slate-200 leading-[22px] mb-3">
            {renderContent(post.content)}
          </Text>

          {/* Media Support */}
          {post.video_url ? (
            <View className="mb-3 w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
              <VideoView 
                player={player}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                nativeControls={true}
              />
            </View>
          ) : images.length > 0 && (
            <View className="mb-3">
              {images.length === 1 ? (
                <View className="w-full h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <Image source={{ uri: images[0] }} className="w-full h-full" resizeMode="cover" />
                </View>
              ) : (
                <View>
                  <ScrollView 
                    horizontal 
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    className="-mx-4"
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {images.map((item: string, index: number) => (
                      <View key={`img-${index}`} className="bg-slate-100 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700" style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }}>
                        <Image source={{ uri: item }} className="w-full h-full" resizeMode="cover" />
                      </View>
                    ))}
                  </ScrollView>
                  {images.length > 1 && (
                    <View className="flex-row justify-center items-center gap-1.5 mt-3">
                      {images.map((_: any, idx: number) => (
                        <View 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex 
                              ? 'w-4 bg-indigo-500' 
                              : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                          }`} 
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View className="flex-row items-center gap-6 mt-1">
            <TouchableOpacity 
              className="flex-row items-center gap-1.5 py-1"
              onPress={handlePress}
              disabled={isSinglePost}
            >
              <MessageCircle size={18} color="#64748b" />
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                {post.comments_count > 0 ? post.comments_count : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center gap-1.5 py-1"
              onPress={handleLike}
            >
              <Heart 
                size={18} 
                color={isLiked ? "#ef4444" : "#64748b"} 
                fill={isLiked ? "#ef4444" : "none"} 
              />
              <Text className={`text-[13px] font-medium ${isLiked ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                {likesCount > 0 ? likesCount : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-1.5 py-1">
              <Share2 size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
