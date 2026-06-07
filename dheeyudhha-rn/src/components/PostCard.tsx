import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, User, Sparkles, X } from 'lucide-react-native';
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
  onImagePress?: (uri: string) => void;
}

export default function PostCard({ post, currentUserId, onUpdate, isSinglePost = false, onImagePress }: PostCardProps) {
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

  const handleImagePress = (uri: string) => {
    if (isSinglePost && onImagePress) {
      onImagePress(uri);
    } else {
      handlePress();
    }
  };

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
    router.push(`/posts/${post.id}` as any);
  };

  return (
    <View 
      className={`bg-white dark:bg-slate-900 ${
        isSinglePost 
          ? 'border-b border-slate-100 dark:border-slate-800 p-4 pt-5' 
          : 'mx-3 mb-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800/80 p-4'
      }`}
      style={!isSinglePost ? { shadowColor: '#6366f1', shadowOpacity: 0.04, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }, elevation: 2 } : {}}
    >
      {/* Header Row */}
      <View className="flex-row items-start justify-between mb-3">
        <TouchableOpacity 
          onPress={() => router.push(`/user/${username}` as any)}
          activeOpacity={0.7}
          className="flex-row items-center flex-1 mr-2"
        >
          {/* Avatar */}
          <View className={`w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 ${isSinglePost ? 'border-transparent' : 'border-white dark:border-slate-800'} justify-center items-center mr-3 shadow-sm`}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" />
            ) : (
              <User size={20} color="#94a3b8" />
            )}
          </View>

          {/* Name & Handle */}
          <View className="flex-1 justify-center">
            <View className="flex-row items-center flex-wrap">
              <BadgedName 
                name={name}
                userId={author.id}
                isTeacher={post.profiles?.is_teacher || author.is_teacher}
                textStyle={{ fontWeight: '900', fontSize: 16, letterSpacing: -0.2 }}
                style={{ marginRight: 6 }}
              />
              {post._feedLabel && (
                <View className="bg-indigo-50 dark:bg-indigo-900/40 rounded-md px-1.5 py-0.5 flex-row items-center mt-0.5">
                  <Sparkles size={10} color="#6366f1" />
                  <Text className="text-indigo-600 dark:text-indigo-400 text-[9px] font-bold ml-1 tracking-widest uppercase">
                    {post._feedLabel}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium" numberOfLines={1}>
              @{username} <Text className="text-slate-300 dark:text-slate-600">·</Text> {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* More Options */}
        <TouchableOpacity className="p-2 -mr-2 -mt-1 rounded-full active:bg-slate-50 dark:active:bg-slate-800">
          <MoreVertical size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View className="px-1">
          {/* Text Content */}
          {post.content ? (
            <Pressable onPress={handlePress} disabled={isSinglePost}>
              <Text className={`text-[15.5px] text-slate-800 dark:text-slate-200 leading-[24px] tracking-tight ${videoUrl || images.length > 0 ? 'mb-4' : 'mb-3'}`}>
                {renderContent(post.content)}
              </Text>
            </Pressable>
          ) : null}

          {/* Media Support */}
          {videoUrl ? (
            <View className={`mb-4 w-full h-64 bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative items-center justify-center ${isSinglePost ? 'rounded-xl' : 'rounded-[20px]'}`}>
              <View pointerEvents={isSinglePost ? 'auto' : 'none'} style={{ width: '100%', height: '100%', position: 'absolute' }}>
                <VideoView 
                  player={player}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  nativeControls={isSinglePost}
                  allowsFullscreen={true}
                />
              </View>
              {/* Play Button Overlay only on feed */}
              {!isSinglePost && (
                <Pressable onPress={handlePress} className="absolute inset-0 items-center justify-center bg-black/10">
                  <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center z-10 border border-white/30 shadow-sm" style={{ backdropFilter: 'blur(10px)' }}>
                    <Text className="text-white text-2xl ml-1">▶</Text>
                  </View>
                </Pressable>
              )}
            </View>
          ) : images.length > 0 && (
            <View className="mb-4">
              {images.length === 1 ? (
                <Pressable onPress={() => handleImagePress(images[0])} className={`w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 ${isSinglePost ? 'rounded-xl' : 'rounded-[20px]'}`}>
                  <Image source={{ uri: images[0] }} className="w-full h-full" resizeMode="cover" />
                </Pressable>
              ) : (
                <View>
                  <ScrollView 
                    horizontal 
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    className={isSinglePost ? '-mx-4' : ''}
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {images.map((item: string, index: number) => (
                      <Pressable key={`img-${index}`} onPress={() => handleImagePress(item)} className={`bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 ${isSinglePost ? 'border-y-0' : 'rounded-[20px] mr-2'}`} style={{ width: isSinglePost ? SCREEN_WIDTH : SCREEN_WIDTH - 64, height: 192 }}>
                        <Image source={{ uri: item }} className="w-full h-full" resizeMode="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                  {images.length > 1 && (
                    <View className="flex-row justify-center items-center gap-1.5 mt-3">
                      {images.map((_: any, idx: number) => (
                        <View 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex 
                              ? 'w-4 bg-indigo-600' 
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

          {/* Action Bar */}
          <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-[20px] px-2 py-1.5 border border-slate-100/50 dark:border-slate-700/30">
            <View className="flex-row items-center">
              <TouchableOpacity 
                className={`flex-row items-center justify-center px-3 py-1.5 rounded-xl active:bg-slate-200/50 dark:active:bg-slate-700/50 ${isLiked ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}
                onPress={handleLike}
                activeOpacity={0.7}
              >
                <Heart 
                  size={18} 
                  color={isLiked ? "#f43f5e" : "#64748b"} 
                  fill={isLiked ? "#f43f5e" : "none"} 
                />
                <Text className={`text-[13px] font-extrabold ml-1.5 ${isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {likesCount > 0 ? likesCount : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-center px-3 py-1.5 rounded-xl active:bg-slate-200/50 dark:active:bg-slate-700/50 ml-1"
                onPress={handlePress}
                disabled={isSinglePost}
                activeOpacity={0.7}
              >
                <MessageCircle size={18} color="#64748b" />
                <Text className="text-[13px] font-extrabold ml-1.5 text-slate-500 dark:text-slate-400">
                  {post.comments_count > 0 ? post.comments_count : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="flex-row items-center justify-center px-3 py-1.5 rounded-xl active:bg-slate-200/50 dark:active:bg-slate-700/50"
              activeOpacity={0.7}
            >
              <Share2 size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
    </View>
  );
}
