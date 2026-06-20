import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Image,
  StyleSheet
} from 'react-native';
import { Sparkles, User, Send, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';

function VideoPreviewItem({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = true;
    p.play();
  });
  return (
    <View style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Composer state
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<{ uri: string, type: 'image' | 'video' }[]>([]);
  const CATEGORIES = ['education', 'lifestyle', 'news', 'funny', 'general'];
  const [selectedCategory, setSelectedCategory] = useState<string>('general');

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single();
      setCurrentUser({ id: session.user.id, avatar_url: profile?.avatar_url });
    }
  };

  const fetchPosts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      let url = `${process.env.EXPO_PUBLIC_API_URL}/api/posts?limit=15`;
      if (isLoadMore && posts.length > 0) {
        const oldestPost = posts[posts.length - 1];
        if (oldestPost?.created_at) {
          url += `&before=${encodeURIComponent(oldestPost.created_at)}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();

      const postsArray = Array.isArray(data) ? data : (data?.posts && Array.isArray(data.posts) ? data.posts : []);
      
      if (postsArray.length < 15) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setPosts(prev => isLoadMore ? [...prev, ...postsArray] : postsArray);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUser().then(() => fetchPosts());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchPosts();
  }, [currentUser]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      fetchPosts(true);
    }
  };

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 30,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0].uri) {
      const asset = result.assets[0];
      if (asset.type === 'video' && asset.duration && asset.duration > 31000) {
        alert('Video exceeds 30 seconds limit.');
        return;
      }
      if (asset.type === 'video') {
         setMediaFiles([{ uri: asset.uri, type: 'video' }]);
      } else {
         if (mediaFiles.some(m => m.type === 'video')) {
            alert('Cannot mix images and videos.');
            return;
         }
         if (mediaFiles.length >= 5) {
            alert('Maximum 5 images allowed.');
            return;
         }
         const needsResize = (asset.width || 0) > 1200 || (asset.height || 0) > 1200;
         const manipulated = await ImageManipulator.manipulateAsync(
           asset.uri,
           needsResize ? [{ resize: { width: 1200 } }] : [],
           { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
         );
         const uriToUpload = Platform.OS === 'android' && !manipulated.uri.startsWith('file://') 
           ? `file://${manipulated.uri}` 
           : manipulated.uri;
           
         setMediaFiles(prev => [...prev, { uri: uriToUpload, type: 'image' }]);
      }
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async () => {
    if ((!content.trim() && mediaFiles.length === 0) || submitting || !currentUser) return;
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let imageUrl = null;
      let imageUrls: string[] = [];
      let videoUrl = null;
      let videoThumbnail = null;

      for (const media of mediaFiles) {
        if (media.type === 'image') {
          const res = await FileSystem.uploadAsync(
            `${process.env.EXPO_PUBLIC_API_URL}/api/posts/upload`,
            media.uri,
            {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }
          );
          if (res.status >= 200 && res.status < 300) {
            const data = JSON.parse(res.body);
            if (data.url) imageUrls.push(data.url);
          } else {
            throw new Error('Failed to upload image');
          }
        } else if (media.type === 'video') {
          const signRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/clips/sign`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (!signRes.ok) throw new Error('Failed to get video signature');
          const signData = await signRes.json();

          const uploadTask = FileSystem.createUploadTask(
            `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`,
            media.uri,
            {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              parameters: {
                api_key: signData.apiKey,
                timestamp: String(signData.timestamp),
                signature: signData.signature,
                folder: signData.folder,
                eager: signData.eager,
                eager_async: signData.eagerAsync ? 'true' : 'false'
              }
            },
            (data) => {
              const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
              setUploadProgress(progress);
            }
          );
          
          const res = await uploadTask.uploadAsync();
          
          if (res && res.status >= 200 && res.status < 300) {
            const data = JSON.parse(res.body);
            videoUrl = data.eager && data.eager.length > 0 ? data.eager[0].secure_url : data.secure_url;
            videoThumbnail = videoUrl.replace(/\.[^.]+$/, '.jpg').replace('/video/upload/', '/video/upload/so_0/');
          } else {
            throw new Error('Failed to upload video');
          }
        }
      }

      if (imageUrls.length > 0) imageUrl = imageUrls[0];

      const finalContent = (content.trim() + (videoUrl && selectedCategory !== 'general' ? ` #${selectedCategory}` : '')).trim();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: finalContent,
          imageUrl,
          imageUrls,
          videoUrl,
          videoThumbnail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post');
      }
      
      onRefresh();
      setContent('');
      setMediaFiles([]);
      setSelectedCategory('general');
      Keyboard.dismiss();
    } catch (e: any) {
      console.error('Error posting:', e);
      alert(e.message || 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const renderComposer = () => {
    if (!currentUser) return null;
    return (
      <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full px-2.5 py-1 flex-row items-center">
            <Sparkles size={12} color={isDark ? "#c084fc" : "#9333ea"} />
            <Text className="text-purple-700 dark:text-purple-400 text-[10px] font-bold ml-1 tracking-wider uppercase">Social Fire</Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="mr-3">
            <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center">
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} className="w-full h-full" />
              ) : (
                <User size={18} color={isDark ? "#94a3b8" : "#cbd5e1"} />
              )}
            </View>
          </View>

          <View className="flex-1">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's happening in the academy?"
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              multiline
              className="text-slate-900 dark:text-slate-100 text-[16px] min-h-[40px] pt-1 pb-2"
              editable={!submitting}
            />

            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <View className="flex-row flex-wrap mt-2 gap-2">
                {mediaFiles.map((media, index) => (
                  <View key={index} className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" style={{ width: 100, height: 100 }}>
                    {media.type === 'image' ? (
                      <Image source={{ uri: media.uri }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <VideoPreviewItem uri={media.uri} />
                    )}
                    <TouchableOpacity
                      onPress={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Video Categories */}
            {mediaFiles.some(m => m.type === 'video') && !submitting && (
              <View className="mt-3">
                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full border ${
                        selectedCategory === cat ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text className={`text-[11px] font-bold ${
                        selectedCategory === cat ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Upload Progress Bar (Composer) */}
            {submitting && uploadProgress > 0 && (
              <View className="mt-3">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Uploading media...</Text>
                  <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{Math.round(uploadProgress * 100)}%</Text>
                </View>
                <View className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" 
                    style={{ width: `${Math.max(5, uploadProgress * 100)}%` }} 
                  />
                </View>
              </View>
            )}
            
            <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 dark:border-slate-800/50 pt-2">
              <TouchableOpacity
                onPress={handlePickMedia}
                disabled={submitting}
                className="flex-row items-center gap-4 px-2 py-1"
              >
                <ImageIcon size={20} color={isDark ? "#818cf8" : "#6366f1"} />
                <VideoIcon size={20} color={isDark ? "#c084fc" : "#a855f7"} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePostSubmit}
                disabled={(!content.trim() && mediaFiles.length === 0) || submitting}
                className={`flex-row items-center px-5 py-2 rounded-full ${
                  (content.trim() || mediaFiles.length > 0) && !submitting ? 'bg-indigo-600' : 'bg-indigo-200 dark:bg-indigo-900/40'
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

  const renderPostItem = useCallback(({ item }: { item: any }) => (
    <PostCard post={item} currentUserId={currentUser?.id || null} onUpdate={onRefresh} isFeed={true} />
  ), [currentUser?.id, onRefresh]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-slate-50 dark:bg-slate-950" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPostItem}
        ListHeaderComponent={renderComposer()}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} tintColor={isDark ? '#4f46e5' : undefined} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text className="text-slate-500 dark:text-slate-400 font-medium">No posts found.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          ) : null
        }
      />

      {/* Floating YouTube-style Upload Notification */}
      {submitting && uploadProgress > 0 && (
        <View className="absolute bottom-6 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 flex-row items-center z-50">
          <ActivityIndicator size="small" color="#4f46e5" />
          <View className="ml-3 flex-1">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Uploading Video...</Text>
              <Text className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">{Math.round(uploadProgress * 100)}%</Text>
            </View>
            <View className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <View 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${Math.max(5, uploadProgress * 100)}%` }} 
              />
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
