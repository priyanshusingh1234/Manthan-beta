import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, User, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import BadgedName from './BadgedName';

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

  const videoUrl = post.video_url || post.videoUrl;

  const player = useVideoPlayer(videoUrl, (p) => {
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
    if (isSinglePost) return;
    if (videoUrl) {
      // If it's a video post, redirect to the Clips tab
      router.push({ pathname: '/clips', params: { videoId: post.id } } as any);
    } else {
      router.push(`/posts/${post.id}` as any);
    }
  };

  return (
    <View 
      className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4`}
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

      {/* Header Row (Avatar + Name) */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity 
          onPress={() => router.push(`/user/${username}` as any)}
          activeOpacity={0.7}
          className="flex-row items-center flex-1 mr-2"
        >
          {/* Avatar */}
          <View className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center mr-3">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" />
            ) : (
              <User size={20} color="#94a3b8" />
            )}
          </View>

          {/* Name & Username */}
          <View className="flex-1 justify-center">
            <BadgedName 
              name={name}
              userId={author.id}
              isTeacher={post.profiles?.is_teacher || author.is_teacher}
              textStyle={{ fontWeight: 'bold', fontSize: 15 }}
              style={{ marginBottom: 2 }}
            />
            <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
              @{username} · {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* More Options */}
        <TouchableOpacity className="p-2 -mr-2">
          <MoreVertical size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View>
          {/* Text Content */}
          <Pressable onPress={handlePress} disabled={isSinglePost}>
            <Text className="text-[15px] text-slate-800 dark:text-slate-200 leading-[22px] mb-3">
              {renderContent(post.content)}
            </Text>
          </Pressable>

          {/* Media Support */}
          {videoUrl ? (
            <Pressable onPress={handlePress} disabled={isSinglePost} className="mb-3 w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative items-center justify-center">
              <View pointerEvents="none" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                <VideoView 
                  player={player}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  nativeControls={false}
                />
              </View>
              {/* Play Button Overlay */}
              <View className="w-14 h-14 bg-black/50 rounded-full items-center justify-center z-10 border border-white/20">
                <Text className="text-white text-2xl ml-1">▶</Text>
              </View>
            </Pressable>
          ) : images.length > 0 && (
            <View className="mb-3">
              {images.length === 1 ? (
                <Pressable onPress={handlePress} disabled={isSinglePost} className="w-full h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <Image source={{ uri: images[0] }} className="w-full h-full" resizeMode="cover" />
                </Pressable>
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
  );
}
