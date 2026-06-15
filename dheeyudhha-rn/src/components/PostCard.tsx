import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView, Dimensions, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, User, Sparkles, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { VideoView, useVideoPlayer } from 'expo-video';
import ShareModal from './ShareModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Formatter for time
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  } catch {
    return '';
  }
}

// Inline video player ONLY used when in single post view
const PostVideoPlayer = React.memo(({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = false;
  });
  return (
    <View className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mt-3 mb-1">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={true}
      />
    </View>
  );
});

export default React.memo(function PostCard({ 
  post, 
  currentUserId, 
  isSinglePost = false, 
  onImagePress 
}: { 
  post: any, 
  currentUserId: string | null, 
  isSinglePost?: boolean, 
  onImagePress?: (uri: string) => void,
  onUpdate?: () => void,
  isFeed?: boolean
}) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Safe data extraction
  const author = post?.author || {};
  const name = author.name || author.full_name || 'Scholar';
  const username = author.username || 'scholar';
  const avatarUrl = (author.avatar_url && !author.avatar_url.includes('googleusercontent.com')) ? author.avatar_url : null;
  const isTeacher = !!(author.isTeacher || author.is_teacher);
  
  const content = post?.content || '';
  const videoUrl = post?.video_url || post?.videoUrl || null;
  const videoThumbnail = post?.video_thumbnail || post?.videoThumbnail || null;
  const images = Array.isArray(post?.image_urls) && post.image_urls.length > 0 
    ? post.image_urls 
    : (post?.image_url ? [post.image_url] : []);

  const [isLiked, setIsLiked] = useState<boolean>(!!post?.is_liked_by_me);
  const [likesCount, setLikesCount] = useState<number>(Number(post?.likes_count) || 0);
  const [likingPost, setLikingPost] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletedLocally, setIsDeletedLocally] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleOptions = () => {
    const isOwner = currentUserId && (author.id === currentUserId || post?.author_id === currentUserId);
    if (isOwner) {
      setShowDeleteModal(true);
    } else {
      Alert.alert("Options", "Report this post?", [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Thank you for reporting. Our team will review this post.") }
      ]);
    }
  };

  if (isDeletedLocally) return null;

  const handlePress = () => {
    if (isSinglePost) return;
    try {
      router.push(`/posts/${post.id}` as any);
    } catch { /* silent */ }
  };

  const handleProfilePress = () => {
    try {
      router.push(`/user/${username}` as any);
    } catch { /* silent */ }
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
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      } else {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLikingPost(false);
    }
  };

  const handleScroll = (event: any) => {
    try {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const offset = event.nativeEvent.contentOffset.x;
      const index = Math.round(offset / slideSize);
      if (index !== currentImageIndex && index >= 0 && index < images.length) {
        setCurrentImageIndex(index);
      }
    } catch { /* silent */ }
  };

  // Text Highlighting (mentions and hashtags)
  const renderContent = (text: string) => {
    if (!text) return null;
    try {
      const parts = text.split(/([@#][\w.-]+)/g);
      return parts.map((part, index) => {
        if (part.startsWith('@') || part.startsWith('#')) {
          return <Text key={index} className="text-sky-500 font-bold">{part}</Text>;
        }
        return <Text key={index}>{part}</Text>;
      });
    } catch {
      return <Text>{text}</Text>;
    }
  };

  return (
    <View className={`bg-white dark:bg-slate-900 px-4 py-4 ${isSinglePost ? 'border-b border-slate-100 dark:border-slate-800' : 'mx-3 mb-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm'}`}>
      
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <TouchableOpacity activeOpacity={0.8} onPress={handleProfilePress}>
          <View className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mr-3 justify-center items-center">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <User size={20} color={isDark ? "#94a3b8" : "#cbd5e1"} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={handleProfilePress} className="flex-1 justify-center">
          <View className="flex-row items-center flex-wrap">
            <Text className="font-black text-[15px] tracking-tight text-slate-900 dark:text-slate-100 mr-1.5">
              {name}
            </Text>
            {isTeacher && (
              <View className="bg-green-100 dark:bg-green-900/40 rounded px-1.5 py-0.5 flex-row items-center">
                <Text className="text-green-700 dark:text-green-400 text-[10px] font-bold">✓ Teacher</Text>
              </View>
            )}
          </View>
          <Text className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            @{username} · {formatTimeAgo(post?.created_at || '')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-2" onPress={handleOptions} disabled={deleting}>
          <MoreVertical size={18} color={isDark ? "#64748b" : "#94a3b8"} />
        </TouchableOpacity>
      </View>

      {/* Feed Label */}
      {post?._feedLabel ? (
        <View className="flex-row items-center mb-2">
          <Sparkles size={12} color="#6366f1" />
          <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold ml-1.5 tracking-widest uppercase">
            {post._feedLabel}
          </Text>
        </View>
      ) : null}

      {/* Content */}
      {content ? (
        <Pressable onPress={handlePress} disabled={isSinglePost} className="mb-3">
          <Text className="text-[15.5px] text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight">
            {renderContent(content)}
          </Text>
        </Pressable>
      ) : null}

      {/* Media Rendering */}
      {videoUrl ? (
        isSinglePost ? (
          <PostVideoPlayer url={videoUrl} />
        ) : (
          <Pressable onPress={handlePress} className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden mb-3 justify-center items-center">
            {videoThumbnail || images[0] ? (
              <Image source={{ uri: videoThumbnail || images[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <View className="absolute inset-0 bg-black/20 justify-center items-center">
              <View className="w-14 h-14 bg-white/20 rounded-full justify-center items-center border border-white/40">
                <Text className="text-white text-2xl ml-1 font-black">▶</Text>
              </View>
            </View>
          </Pressable>
        )
      ) : images.length > 0 ? (
        <View className="mb-3">
          {images.length === 1 ? (
            <Pressable 
              onPress={() => onImagePress ? onImagePress(images[0]) : handlePress()} 
              className={`w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 ${isSinglePost ? 'rounded-xl' : 'rounded-2xl'}`}
            >
              <Image source={{ uri: images[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </Pressable>
          ) : (
            <View>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll}>
                {images.map((uri: string, idx: number) => (
                  <Pressable 
                    key={`img-${idx}`} 
                    onPress={() => onImagePress ? onImagePress(uri) : handlePress()} 
                    className={`h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 ${isSinglePost ? '' : 'rounded-2xl mr-2'}`}
                    style={{ width: isSinglePost ? SCREEN_WIDTH : SCREEN_WIDTH - 64 }}
                  >
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View className="flex-row justify-center items-center mt-3 gap-1.5">
                  {images.map((_: any, idx: number) => (
                    <View key={idx} className={`h-1.5 rounded-full ${idx === currentImageIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      ) : null}

      {/* Action Bar */}
      <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-2 py-1.5 border border-slate-200/50 dark:border-slate-700/50 mt-1">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleLike} activeOpacity={0.7} className={`flex-row items-center px-3 py-1.5 rounded-xl ${isLiked ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
            <Heart size={18} color={isLiked ? '#f43f5e' : (isDark ? '#94a3b8' : '#64748b')} fill={isLiked ? '#f43f5e' : 'none'} />
            {likesCount > 0 && (
              <Text className={`text-[13px] font-black ml-1.5 ${isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePress} disabled={isSinglePost} activeOpacity={0.7} className="flex-row items-center px-3 py-1.5 rounded-xl ml-1">
            <MessageCircle size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            {(post?.comments_count || 0) > 0 && (
              <Text className="text-[13px] font-black ml-1.5 text-slate-500 dark:text-slate-400">
                {post.comments_count}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7} className="px-3 py-1.5" onPress={() => setShowShareModal(true)}>
          <Share2 size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* View Insights Button (Only for author) */}
      {(author?.id === currentUserId || post?.user_id === currentUserId) && (
        <TouchableOpacity 
          onPress={() => router.push(`/insights/${post.id}` as any)}
          className="mt-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl items-center justify-center border border-indigo-100 dark:border-indigo-800/30"
        >
          <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[13px]">View Insights</Text>
        </TouchableOpacity>
      )}

      {/* Custom Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl items-center">
            <View className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-4">
              <Trash2 size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">Delete Post?</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center"
              >
                <Text className="font-bold text-slate-700 dark:text-slate-300">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
                    const response = await fetch(`${API_URL}/api/posts/${post.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': session ? `Bearer ${session.access_token}` : ''
                      }
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete');
                    
                    setShowDeleteModal(false);
                    setIsDeletedLocally(true);
                    if (onUpdate) onUpdate();
                  } catch (error) {
                    console.error(error);
                    Alert.alert("Error", "Failed to delete post. Please check your connection.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-3.5 bg-red-500 rounded-2xl items-center flex-row justify-center"
              >
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text className="font-bold text-white">Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ShareModal 
        url={`https://manthan-beta-c975.vercel.app/posts/${post.id}`}
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </View>
  );
});
