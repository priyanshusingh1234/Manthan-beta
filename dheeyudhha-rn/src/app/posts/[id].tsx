import React, { useState, useEffect, useCallback } from 'react';
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
  Keyboard
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import { User, Send, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SinglePostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

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
      // 1. Fetch Post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics),
          post_likes(user_id)
        `)
        .eq('id', id)
        .single();

      if (postError) throw postError;

      // 2. Fetch Comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles(id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      const formattedPost = {
        ...postData,
        is_liked_by_me: currentUser ? postData.post_likes?.some((l: any) => l.user_id === currentUser.id) : false,
        likes_count: postData.post_likes ? postData.post_likes.length : (postData.likes_count || 0)
      };

      setPost(formattedPost);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching single post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser().then(fetchPostAndComments);
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentUser || submitting) return;
    
    setSubmitting(true);
    try {
      // 1. Insert comment
      const { data: commentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: id,
          author_id: currentUser.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          author:profiles(id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics)
        `)
        .single();

      if (error) throw error;

      // 2. Increment comments_count on post (optional, denormalized counter)
      const { error: rpcError } = await supabase.rpc('increment_post_comments', { post_id_arg: id });
      if (rpcError) {
        console.log('RPC increment failed (optional)', rpcError);
        // Fallback: manually update the post count if RPC doesn't exist
        const { data: currentPost } = await supabase.from('posts').select('comments_count').eq('id', id).single();
        if (currentPost) {
          await supabase.from('posts').update({ comments_count: (currentPost.comments_count || 0) + 1 }).eq('id', id);
        }
      }

      setComments(prev => [commentData, ...prev]);
      setPost((prev: any) => ({ ...prev, comments_count: (prev?.comments_count || 0) + 1 }));
      setNewComment('');
      Keyboard.dismiss();
    } catch (e) {
      console.error('Error posting comment:', e);
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

  const renderComment = ({ item }: { item: any }) => {
    const author = item.author || {};
    const name = author.full_name || 'Scholar';
    const username = author.username || 'scholar';

    return (
      <View className="flex-row px-4 py-3 border-b border-slate-50">
        <View className="mr-3">
          <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 justify-center items-center">
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} className="w-full h-full" />
            ) : (
              <User size={18} color="#94a3b8" />
            )}
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap mb-0.5">
            <Text className="font-bold text-[14px] text-slate-900 mr-1">{name}</Text>
            <Text className="text-[13px] text-slate-500">@{username}</Text>
            <Text className="text-slate-400 mx-1">·</Text>
            <Text className="text-[13px] text-slate-500">{formatTimeAgo(item.created_at)}</Text>
          </View>
          <Text className="text-[15px] text-slate-800 leading-[22px]">{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-slate-500 font-bold">Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
            />
            <View className="h-2 bg-slate-50" />
          </>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Comment Input */}
      {currentUser && (
        <View 
          className="flex-row items-end px-4 py-3 border-t border-slate-100 bg-white"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1 flex-row items-center bg-slate-100 rounded-3xl px-4 py-1 min-h-[44px]">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Post your reply..."
              placeholderTextColor="#94a3b8"
              multiline
              className="flex-1 text-[15px] text-slate-900 py-2 max-h-[100px]"
              editable={!submitting}
            />
            <TouchableOpacity 
              onPress={handleCommentSubmit}
              disabled={!newComment.trim() || submitting}
              className={`ml-2 p-1.5 rounded-full ${newComment.trim() ? 'bg-indigo-600' : 'bg-transparent'}`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={newComment.trim() ? "white" : "#94a3b8"} />
              ) : (
                <Send size={16} color={newComment.trim() ? "white" : "#94a3b8"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
