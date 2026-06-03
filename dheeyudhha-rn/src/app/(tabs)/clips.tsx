import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, ScrollView, Image, Alert, Dimensions, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Video, Send, MessageCircle, Upload, CheckCircle2, Home, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import VideoClipCard from '@/components/VideoClipCard';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

const { height: SCREEN_H } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta.vercel.app';
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dtlrwdl1k';

export default function ClipsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Stable refs for FlatList callbacks — prevents "onViewableItemsChanged should be memoized" warning
  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 });

  // Upload modal
  const [uploadVisible, setUploadVisible] = useState(false);
  const [pickedVideo, setPickedVideo] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  // Comment sheet
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ username: string; userId: string } | null>(null);

  // ── Fetch session ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
        setCurrentUser(session.user);
      }
    });
  }, []);

  // ── Fetch clips feed ─────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const currentExclude = isInitial ? [] : excludeIds;
      let url = `${API_URL}/api/clips/feed?limit=10`;
      if (currentExclude.length > 0) url += `&exclude=${currentExclude.join(',')}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const fetched = data.posts || [];

      setExcludeIds(data.excludeIds || []);
      setPosts(prev => isInitial ? fetched : [...prev, ...fetched.filter((p: any) => !prev.find((e: any) => e.id === p.id))]);
      if (fetched.length < 5) setHasMore(false);
    } catch (err) {
      console.error('Clips feed error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [excludeIds]);

  useEffect(() => { fetchFeed(true); }, []); // eslint-disable-line

  // ── Like a post ──────────────────────────────────────────────────────────
  const handleLike = async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.is_liked_by_me;
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, is_liked_by_me: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
      : p));
    await fetch(`${API_URL}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' }),
    });
  };

  // ── Comments ─────────────────────────────────────────────────────────────
  const openComments = async (postId: string) => {
    setCommentPostId(postId);
    setComments([]);
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
  };

  const submitComment = async () => {
    if (!newComment.trim() || submittingComment || !currentUserId || !commentPostId) return;
    setSubmittingComment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/posts/${commentPostId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), replying_to_user_id: replyingTo?.userId }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        setReplyingTo(null);
        setPosts(prev => prev.map(p => p.id === commentPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      }
    } finally { setSubmittingComment(false); }
  };

  // ── Pick video from library ───────────────────────────────────────────────
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Allow access to photos to upload a clip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 30,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'mp4';
    setPickedVideo({ uri: asset.uri, name: `clip-${Date.now()}.${ext}`, type: `video/${ext}` });
    setUploadVisible(true);
    setCaption('');
    setUploadDone(false);
  };

  // ── Upload to Cloudinary via signed URL from web API ─────────────────────
  const handleUpload = async () => {
    if (!pickedVideo || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');

      // 1. Get signed params from our web API (same as web ClipsClient)
      const signRes = await fetch(`${API_URL}/api/clips/sign`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!signRes.ok) throw new Error('Could not get upload signature');
      const { cloudName: cn, apiKey, timestamp, signature, folder, eager } = await signRes.json();

      // 2. Upload directly to Cloudinary (avoids Vercel 4.5MB body limit)
      const formData = new FormData();
      formData.append('file', { uri: pickedVideo.uri, type: pickedVideo.type, name: pickedVideo.name } as any);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('eager', eager);
      formData.append('eager_async', 'true');
      formData.append('resource_type', 'video');

      setUploadProgress(20);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cn || CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.secure_url) throw new Error(uploadData.error?.message || 'Upload failed');

      setUploadProgress(75);

      const videoUrl = uploadData.secure_url;
      const thumbnailUrl = uploadData.eager?.[0]?.secure_url || null;

      // 3. Create post in DB via posts API
      const postRes = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: caption.trim(),
          videoUrl: videoUrl,
          videoThumbnail: thumbnailUrl,
          category: 'general',
        }),
      });
      if (!postRes.ok) throw new Error('Failed to create post');

      setUploadProgress(100);
      setUploadDone(true);

      // Refresh feed after 1.5s
      setTimeout(() => {
        setUploadVisible(false);
        setPickedVideo(null);
        setCaption('');
        setUploadDone(false);
        setExcludeIds([]);
        fetchFeed(true);
      }, 1500);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontWeight: '800', fontSize: 12, letterSpacing: 2 }}>
          LOADING CLIPS
        </Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Video size={56} color="rgba(255,255,255,0.2)" />
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18, marginTop: 16 }}>No Clips Yet</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          Be the first to share a 30-second clip!
        </Text>
        <TouchableOpacity
          onPress={pickVideo}
          style={{ marginTop: 24, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '800' }}>Upload Clip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Full-screen vertical snap feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfig.current}
        onEndReached={() => { if (hasMore && !loadingMore) fetchFeed(false); }}
        onEndReachedThreshold={0.5}
        renderItem={({ item, index }) => (
          <VideoClipCard
            post={item}
            isActive={index === activeIndex}
            currentUserId={currentUserId}
            onLike={handleLike}
            onCommentPress={openComments}
            onAuthorPress={(username) => router.push(`/user/${username}` as any)}
          />
        )}
        ListFooterComponent={loadingMore ? (
          <View style={{ height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator color="white" />
          </View>
        ) : null}
      />

      {/* Upload FAB - positioned at bottom of screen (no nav bar) */}
      <TouchableOpacity
        onPress={pickVideo}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Home button top-left (tab bar is hidden on clips) */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)' as any)}
        style={[styles.homeBtn, { top: insets.top + 10 }]}
      >
        <ArrowLeft size={20} color="white" />
      </TouchableOpacity>

      {/* Title overlay */}
      <View style={[styles.titleOverlay, { top: insets.top + 12 }]} pointerEvents="none">
        <Text style={styles.titleText}>CLIPS</Text>
      </View>

      {/* ── Upload Modal ── */}
      <Modal visible={uploadVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#0a0a0a', paddingTop: insets.top }}>
          <View style={styles.uploadHeader}>
            <TouchableOpacity onPress={() => { setUploadVisible(false); setPickedVideo(null); }}>
              <X size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.uploadTitle}>New Clip</Text>
            <TouchableOpacity
              onPress={handleUpload}
              disabled={!pickedVideo || uploading || uploadDone}
              style={[styles.uploadBtn, (!pickedVideo || uploading || uploadDone) && { opacity: 0.4 }]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : uploadDone ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '800' }}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
            {/* Video preview placeholder */}
            <View style={styles.videoPreview}>
              {pickedVideo ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={40} color="#6366f1" />
                  <Text style={{ color: 'white', fontWeight: '700' }}>Video Selected ✓</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{pickedVideo.name}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickVideo}
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}
                >
                  <Upload size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Tap to pick a video</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Max 30 seconds</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Caption */}
            <View style={styles.captionBox}>
              <Text style={styles.captionLabel}>CAPTION</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption... #tags welcome"
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                numberOfLines={3}
                style={styles.captionInput}
                maxLength={300}
              />
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'right', marginTop: 4 }}>
                {caption.length}/300
              </Text>
            </View>

            {/* Upload progress */}
            {uploading && (
              <View style={styles.progressBox}>
                <Text style={{ color: 'white', fontWeight: '700', marginBottom: 8 }}>
                  Uploading... {uploadProgress}%
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
                </View>
              </View>
            )}

            {uploadDone && (
              <View style={[styles.progressBox, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }]}>
                <Text style={{ color: '#22c55e', fontWeight: '800', textAlign: 'center' }}>
                  🎉 Clip posted successfully!
                </Text>
              </View>
            )}

            <Text style={styles.uploadHint}>
              Videos are compressed to 720p H.264 for fast streaming. Max duration: 30s.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Comments Sheet ── */}
      {commentPostId && (
        <Modal visible={true} animationType="slide" transparent={true}>
          <View style={styles.commentOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setCommentPostId(null)} />
            <View style={[styles.commentSheet, { paddingBottom: insets.bottom + 16 }]}>
              {/* Handle */}
              <View style={styles.commentHandle} />
              <View style={styles.commentSheetHeader}>
                <Text style={styles.commentSheetTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setCommentPostId(null)}>
                  <X size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {loadingComments ? (
                  <ActivityIndicator color="white" style={{ marginTop: 40 }} />
                ) : comments.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 40 }}>
                    <MessageCircle size={40} color="rgba(255,255,255,0.1)" />
                    <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12, fontWeight: '700' }}>
                      No comments yet
                    </Text>
                  </View>
                ) : (
                  comments.map((c: any) => (
                    <View key={c.id} style={styles.commentRow}>
                      <View style={styles.commentAvatar}>
                        {c.author?.avatar_url ? (
                          <Image source={{ uri: c.author.avatar_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                            {(c.author?.name || 'U')[0]}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentBubble}>
                          <Text style={styles.commentAuthor}>{c.author?.name || 'Scholar'}</Text>
                          <Text style={styles.commentText}>{c.content}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const username = c.author?.username || c.author?.name?.replace(/\s+/g, '') || 'scholar';
                            setReplyingTo({ username, userId: c.author?.id });
                            setNewComment(`@${username} `);
                          }}
                        >
                          <Text style={styles.replyBtn}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {currentUserId && (
                <View style={styles.commentInputArea}>
                  {replyingTo && (
                    <View style={styles.replyingBanner}>
                      <Text style={{ color: '#a78bfa', fontSize: 11, fontWeight: '700' }}>
                        Replying to @{replyingTo.username}
                      </Text>
                      <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <X size={12} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Add a comment..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={styles.commentInput}
                    />
                    <TouchableOpacity
                      onPress={submitComment}
                      disabled={!newComment.trim() || submittingComment}
                      style={[styles.sendBtn, (!newComment.trim() || submittingComment) && { opacity: 0.3 }]}
                    >
                      {submittingComment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Send size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  homeBtn: {
    position: 'absolute',
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  uploadTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  uploadBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  videoPreview: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  captionBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 20,
  },
  captionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  captionInput: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 64,
  },
  progressBox: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  uploadHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Comments
  commentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentSheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '75%',
  },
  commentHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  commentSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  commentSheetTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  commentBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    marginBottom: 4,
  },
  commentAuthor: { color: 'white', fontWeight: '800', fontSize: 12, marginBottom: 2 },
  commentText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  replyBtn: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', paddingLeft: 4 },
  commentInputArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 8,
    marginBottom: 6,
  },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: 'white',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
