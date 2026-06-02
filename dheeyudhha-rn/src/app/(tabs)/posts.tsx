import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Sparkles, User, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostsScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Also fetch user profile for avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', session.user.id)
        .single();
        
      setCurrentUser({
        id: session.user.id,
        ...profile,
        // Fallback to auth metadata if profile is incomplete
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        name: profile?.full_name || session.user.user_metadata?.full_name || 'You'
      });
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics),
          post_likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Transform data for PostCard
      const transformed = (data || []).map(p => ({
        ...p,
        is_liked_by_me: currentUser ? p.post_likes?.some((l: any) => l.user_id === currentUser.id) : false,
        likes_count: p.post_likes ? p.post_likes.length : (p.likes_count || 0)
      }));

      setPosts(transformed);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUser().then(fetchPosts);
  }, []);

  // Fetch again when user resolves (handles race condition)
  useEffect(() => {
    if (currentUser && posts.length > 0) {
      setPosts(prev => prev.map(p => ({
        ...p,
        is_liked_by_me: p.post_likes?.some((l: any) => l.user_id === currentUser.id)
      })));
    }
  }, [currentUser?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [currentUser]);

  const handlePostSubmit = async () => {
    if (!content.trim() || !currentUser || submitting) return;
    
    setSubmitting(true);
    try {
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          content: content.trim(),
        })
        .select(`
          *,
          author:profiles(id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics),
          post_likes(user_id)
        `)
        .single();

      if (error) throw error;

      const formattedPost = {
        ...newPost,
        is_liked_by_me: false,
        likes_count: 0
      };

      setPosts(prev => [formattedPost, ...prev]);
      setContent('');
      Keyboard.dismiss();
    } catch (e) {
      console.error('Error posting:', e);
      alert('Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderComposer = () => {
    if (!currentUser) return null;

    return (
      <View className="bg-white border-b border-slate-100 p-4 mb-2">
        <View className="flex-row items-center mb-3">
          <View className="bg-purple-100 rounded-full px-2.5 py-1 flex-row items-center">
            <Sparkles size={12} color="#9333ea" />
            <Text className="text-purple-700 text-[10px] font-bold ml-1 tracking-wider uppercase">Social Fire</Text>
          </View>
        </View>

        <View className="flex-row">
          {/* Avatar */}
          <View className="mr-3">
            <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 justify-center items-center">
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} className="w-full h-full" />
              ) : (
                <User size={18} color="#94a3b8" />
              )}
            </View>
          </View>

          {/* Input */}
          <View className="flex-1">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's happening in the academy?"
              placeholderTextColor="#94a3b8"
              multiline
              className="text-slate-900 text-[16px] min-h-[40px] pt-2 pb-2"
              editable={!submitting}
            />

            {/* Post Button Area */}
            <View className="flex-row justify-end mt-2 pt-2 border-t border-slate-50">
              <TouchableOpacity
                onPress={handlePostSubmit}
                disabled={!content.trim() || submitting}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  content.trim() && !submitting ? 'bg-indigo-600' : 'bg-indigo-200'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Send size={14} color="white" />
                    <Text className="text-white font-bold text-[13px] ml-1.5">Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-slate-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            currentUserId={currentUser?.id || null} 
          />
        )}
        ListHeaderComponent={renderComposer}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}
