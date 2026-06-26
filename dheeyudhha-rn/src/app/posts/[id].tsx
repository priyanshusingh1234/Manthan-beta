import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import { User, Send, X, CornerDownRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

type ReplyingTo = {
  userId: string;
  username: string;
  commentId: string;
};

export default function SinglePostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', session.user.id)
        .single();

      setCurrentUser({
        id: session.user.id,
        ...profile,
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        name: profile?.full_name || session.user.user_metadata?.full_name || 'You'
      });
    }
  };

  const fetchPostAndComments = async () => {
    if (!id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      };

      const [postRes, commentsRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${id}`, { headers }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${id}/comments`, { headers }),
      ]);

      if (!postRes.ok) throw new Error('Failed to fetch post');
      if (!commentsRes.ok) throw new Error('Failed to fetch comments');

      const [postData, commentsData] = await Promise.all([postRes.json(), commentsRes.json()]);

      setPost(postData);
      setComments(commentsData || []);

      // Increment views count silently
      supabase.rpc('increment_post_views', { p_post_id: id }).catch(() => {
        // Fallback if RPC doesn't exist yet, attempt direct update (might fail due to RLS, but safe to try)
        if (postData) {
          const currentViews = Number(postData.views_count) || 0;
          supabase.from('posts').update({ views_count: currentViews + 1 }).eq('id', id).then().catch();
        }
      });
    } catch (error) {
      console.error('Error fetching single post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser().then(fetchPostAndComments);
  }, [id]);

  const handleReply = (comment: any) => {
    const author = comment.author || {};
    const username = author.username || 'scholar';
    setReplyingTo({
      userId: author.id,
      username,
      commentId: comment.id,
    });
    // Pre-fill @mention and focus input
    setNewComment(`@${username} `);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentUser || submitting) return;

    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url
      }
    };

    setComments(prev => [optimisticComment, ...prev]);
    setPost((prev: any) => ({ ...prev, comments_count: (prev?.comments_count || 0) + 1 }));
    setNewComment('');
    setReplyingTo(null);
    Keyboard.dismiss();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          content: optimisticComment.content,
          replying_to_user_id: replyingTo?.userId || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const commentData = await response.json();

      // Replace optimistic comment with the real one
      setComments(prev => prev.map(c => c.id === tempId ? commentData : c));
    } catch (e) {
      console.error('Error posting comment:', e);
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== tempId));
      setPost((prev: any) => ({ ...prev, comments_count: Math.max((prev?.comments_count || 1) - 1, 0) }));
      setNewComment(optimisticComment.content);
      alert('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Highlight @mentions in comment text
  const renderCommentContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[\w.-]+)/g);
    return (
      <Text className="text-[15px] text-slate-800 dark:text-slate-200 leading-[22px]">
        {parts.map((part, i) =>
          part.startsWith('@') ? (
            <Text key={i} className="text-indigo-600 dark:text-indigo-400 font-semibold">{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const renderComment = ({ item }: { item: any }) => {
    const author = item.author || {};
    const name = author.name || author.full_name || 'Scholar';
    const username = author.username || 'scholar';
    const isCurrentUser = currentUser?.id === author.id;

    return (
      <View className="flex-row px-4 py-3 border-b border-slate-50 dark:border-slate-800/60">
        {/* Avatar */}
        <View className="mr-3 shrink-0">
          <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center">
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} className="w-full h-full" />
            ) : (
              <User size={18} color="#94a3b8" />
            )}
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap mb-0.5">
            <Text className="font-bold text-[14px] text-slate-900 dark:text-slate-100 mr-1">{name}</Text>
            <Text className="text-[13px] text-slate-500 dark:text-slate-400">@{username}</Text>
            <Text className="text-slate-400 dark:text-slate-600 mx-1">·</Text>
            <Text className="text-[13px] text-slate-500 dark:text-slate-400">{formatTimeAgo(item.created_at)}</Text>
          </View>

          {renderCommentContent(item.content)}

          {/* Reply button */}
          {currentUser && !isCurrentUser && (
            <TouchableOpacity
              onPress={() => handleReply(item)}
              className="flex-row items-center gap-1 mt-2"
              activeOpacity={0.6}
            >
              <CornerDownRight size={12} color={isDark ? '#6366f1' : '#4f46e5'} />
              <Text className="text-indigo-600 dark:text-indigo-400 text-[12px] font-semibold">Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 justify-center items-center">
        <Text className="text-slate-500 font-bold">Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-slate-950"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={
          <>
            <PostCard
              post={post}
              currentUserId={currentUser?.id || null}
              isSinglePost={true}
              onImagePress={(uri) => setFullscreenImage(uri)}
              onUpdate={() => router.back()}
            />
            <View className="h-2 bg-slate-50 dark:bg-slate-900" />
            {comments.length === 0 && !loading && (
              <View className="items-center py-10">
                <Text className="text-slate-400 dark:text-slate-500 text-sm">No comments yet. Be the first!</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Comment Input Area */}
      {currentUser && (
        <View
          className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {/* Replying to banner */}
          {replyingTo && (
            <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
              <View className="flex-row items-center gap-1.5 flex-1">
                <CornerDownRight size={12} color={isDark ? '#818cf8' : '#6366f1'} />
                <Text className="text-indigo-600 dark:text-indigo-400 text-[13px] font-semibold" numberOfLines={1}>
                  Replying to @{replyingTo.username}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelReply} className="p-1 ml-2">
                <X size={14} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input row */}
          <View className="flex-row items-end px-4 pt-2">
            {/* Current user avatar */}
            <View className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center mr-2 mb-1 shrink-0">
              {currentUser.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} className="w-full h-full" />
              ) : (
                <User size={14} color="#94a3b8" />
              )}
            </View>

            <View className="flex-1 flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-3xl px-4 py-1 min-h-[44px]">
              <TextInput
                ref={inputRef}
                value={newComment}
                onChangeText={setNewComment}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'}
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                multiline
                className="flex-1 text-[15px] text-slate-900 dark:text-slate-100 py-2 max-h-[100px]"
                editable={!submitting}
              />
              <TouchableOpacity
                onPress={handleCommentSubmit}
                disabled={!newComment.trim() || submitting}
                className={`ml-2 p-1.5 rounded-full ${newComment.trim() ? 'bg-indigo-600' : 'bg-transparent'}`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={newComment.trim() ? 'white' : '#94a3b8'} />
                ) : (
                  <Send size={16} color={newComment.trim() ? 'white' : (isDark ? '#475569' : '#94a3b8')} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Fullscreen Image Modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity className="absolute top-12 right-6 z-50 p-2 bg-white/20 rounded-full" onPress={() => setFullscreenImage(null)}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {fullscreenImage && <Image source={{ uri: fullscreenImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
