import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Dimensions, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowLeft, Heart, MessageCircle, Share2, User } from 'lucide-react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useFocusEffect } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Format time ago
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch {
    return '';
  }
}

// Video Clip Item
const VideoClipItem = React.memo(({ 
  item, 
  isActive, 
  onLike,
  onComment
}: { 
  item: any, 
  isActive: boolean,
  onLike: (id: string, isLiked: boolean) => void,
  onComment: (id: string) => void
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const [isLiked, setIsLiked] = useState(!!item.is_liked_by_me);
  const [likesCount, setLikesCount] = useState(Number(item.likes_count) || 0);

  const player = useVideoPlayer(item.video_url || item.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive && isFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isFocused, player]);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => prev + (newLiked ? 1 : -1));
    onLike(item.id, newLiked);
  };

  const author = item.author || {};
  const name = author.name || author.full_name || 'Scholar';
  const username = author.username || 'scholar';
  const avatarUrl = (author.avatar_url && !author.avatar_url.includes('googleusercontent.com')) ? author.avatar_url : null;

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* Top Gradient Overlay */}
      <View className="absolute top-0 w-full h-32 bg-black/40" style={{ paddingTop: insets.top }} />
      
      {/* Bottom Gradient Overlay */}
      <View className="absolute bottom-0 w-full h-64 bg-black/60 justify-end pb-8" />

      {/* Back Button */}
      <TouchableOpacity 
        className="absolute left-4 top-12 w-10 h-10 items-center justify-center bg-black/20 rounded-full"
        onPress={() => router.back()}
        style={{ marginTop: insets.top }}
      >
        <ArrowLeft color="#FFF" size={24} />
      </TouchableOpacity>

      {/* Right Action Buttons */}
      <View className="absolute right-4 bottom-28 items-center gap-6">
        <TouchableOpacity className="items-center" onPress={handleLike}>
          <View className={`w-12 h-12 rounded-full items-center justify-center bg-black/40 backdrop-blur-md`}>
            <Heart size={28} color={isLiked ? "#ef4444" : "#FFF"} fill={isLiked ? "#ef4444" : "transparent"} />
          </View>
          <Text className="text-white font-bold text-xs mt-1 drop-shadow-md">{formatNumber(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => onComment(item.id)}>
          <View className="w-12 h-12 rounded-full items-center justify-center bg-black/40 backdrop-blur-md">
            <MessageCircle size={26} color="#FFF" />
          </View>
          <Text className="text-white font-bold text-xs mt-1 drop-shadow-md">{formatNumber(item.comments_count || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <View className="w-12 h-12 rounded-full items-center justify-center bg-black/40 backdrop-blur-md">
            <Share2 size={26} color="#FFF" />
          </View>
          <Text className="text-white font-bold text-xs mt-1 drop-shadow-md">Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info Section */}
      <View className="absolute bottom-10 left-4 right-20">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => router.push(`/user/${author.id || item.author_id}` as any)}
          >
            <View className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border-2 border-white mr-3">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <User size={20} color="#cbd5e1" />
                </View>
              )}
            </View>
            <View>
              <Text className="text-white font-bold text-[15px] shadow-sm">{name}</Text>
              <Text className="text-white/80 font-medium text-xs">@{username} • {formatTimeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {item.content ? (
          <Text className="text-white font-medium text-sm leading-5 shadow-sm" numberOfLines={3}>
            {item.content}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

export default function ClipsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeViewableItems, setActiveViewableItems] = useState<string[]>([]);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  
  const fetchFeed = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      let newExclude = [...excludeIds];
      let initialTargetPost: any = null;

      if (isInitial && postId) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          initialTargetPost = await res.json();
          if (initialTargetPost) newExclude.push(postId);
        }
      }

      let url = `${process.env.EXPO_PUBLIC_API_URL}/api/clips/feed?limit=10&t=${Date.now()}`;
      if (newExclude.length > 0) {
        url += `&exclude=${newExclude.join(',')}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch clips');
      const data = await res.json();
      const fetchedPosts = data.posts || [];

      if (fetchedPosts.length === 0 && !initialTargetPost) {
        setHasMore(false);
      } else {
        setExcludeIds(data.excludeIds || []);
        setPosts(prev => {
          const combined = initialTargetPost 
            ? [initialTargetPost, ...fetchedPosts] 
            : fetchedPosts;

          if (isInitial) return combined;
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = combined.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        if (fetchedPosts.length < 5) setHasMore(false);
      }
    } catch (err) {
      console.error('Clips fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, excludeIds]);

  useEffect(() => {
    fetchFeed(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const itemKeys = viewableItems.map((v: any) => v.key);
    setActiveViewableItems(itemKeys);
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (id: string, isLiked: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${id}/like`, {
        method: isLiked ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleComment = (id: string) => {
    // In a full implementation, this would open a comments modal.
    // For now, we can route to the post detail screen if it exists.
    router.push(`/post/${id}` as any);
  };

  if (loading && posts.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoClipItem 
            item={item} 
            isActive={activeViewableItems.includes(item.id) || (activeViewableItems.length === 0 && posts[0]?.id === item.id)}
            onLike={handleLike}
            onComment={handleComment}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading) {
            fetchFeed(false);
          }
        }}
        onEndReachedThreshold={0.5}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}
