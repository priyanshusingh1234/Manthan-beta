import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy, Target, Zap, Star, User, MapPin, GraduationCap, Edit3, LogOut,
  Award, BookOpen, Shield, MessageSquare, Search, X, Camera, ChevronRight, PlaySquare, Play, ChevronLeft
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import TitlesDashboard from '@/components/TitlesDashboard';
import PostCard from '@/components/PostCard';
import BadgedName from '@/components/BadgedName';

type TabKey = 'stats' | 'posts' | 'achievements';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

// Extract storage path from a Supabase public URL (for deletion)
function getStoragePath(url: string, prefix: 'avatars' | 'banners'): string | null {
  if (!url) return null;
  const marker = `/${prefix}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + 1).split('?')[0];
}

const getBannerSource = (bannerUrl: string | null) => {
  if (!bannerUrl) return null;
  if (bannerUrl.includes('cyberpunk')) return require('../../../assets/images/banners/cyberpunk.jpg');
  if (bannerUrl.includes('library')) return require('../../../assets/images/banners/library.jpg');
  if (bannerUrl.includes('galactic')) return require('../../../assets/images/banners/galactic.jpg');
  // Handle custom uploaded full URLs
  if (bannerUrl.startsWith('http')) return { uri: bannerUrl };
  return null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('stats');

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  // Edit Modal
  const [editVisible, setEditVisible] = useState(false);
  const [titlesVisible, setTitlesVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', bio: '', school: '', grade: '' });
  const [newAvatar, setNewAvatar] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [newBanner, setNewBanner] = useState<{ uri: string; type: string; name: string } | null>(null);

  // Followers Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePostsCount, setVisiblePostsCount] = useState(3);

  useEffect(() => {
    if (activeTab === 'posts' && visiblePostsCount < myPosts.length) {
      const timer = setTimeout(() => {
        setVisiblePostsCount(prev => prev + 3);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, visiblePostsCount, myPosts.length]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login' as any); return; }
      setCurrentUser(user);

      const [{ data: dbProfile }, followersRes, followingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      ]);

      const meta = user.user_metadata || {};
      const merged = {
        id: user.id,
        name: dbProfile?.full_name || meta.fullName || meta.full_name || user.email?.split('@')[0] || 'Scholar',
        username: dbProfile?.username || meta.username || null,
        email: user.email,
        avatar_url: (dbProfile?.avatar_url && !dbProfile.avatar_url.includes('googleusercontent.com')) ? dbProfile.avatar_url : ((meta.avatar_url && !meta.avatar_url.includes('googleusercontent.com')) ? meta.avatar_url : null),
        banner_url: dbProfile?.banner_url || meta.banner_url || null,
        school: dbProfile?.school || meta.school || null,
        grade: dbProfile?.class_grade || meta.classGrade || null,
        bio: dbProfile?.bio || meta.bio || null,
        is_teacher: dbProfile?.is_teacher || meta.isTeacher || false,
        totalPoints: Math.max(Number(dbProfile?.total_points) || 0, Number(meta.totalPoints) || 0),
        xp: Number(dbProfile?.xp) || Number(meta.xp) || 0,
        battlesAttempted: Number(meta.battlesAttempted) || 0,
        battlesWon: Number(meta.battlesWon) || 0,
        followers_count: followersRes.count || 0,
        following_count: followingRes.count || 0,
        cosmetics: dbProfile?.cosmetics || meta.cosmetics || [],
      };
      setProfile(merged);
      setEditForm({
        name: merged.name,
        username: merged.username || '',
        bio: merged.bio || '',
        school: merged.school || '',
        grade: merged.grade || '',
      });

      const { data: rankData } = await supabase
        .from('profiles').select('id')
        .gte('total_points', merged.totalPoints).neq('id', user.id);
      setRank((rankData?.length || 0) + 1);
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const fetchMyPosts = useCallback(async () => {
    if (!currentUser || !profile || postsLoaded) return;
    setLoadingPosts(true);
    try {
      const { data } = await supabase
        .from('posts').select('*, post_likes(user_id), repost:posts!repost_id(*)')
        .eq('author_id', currentUser.id)
        .order('created_at', { ascending: false }).limit(20);
      
      const formattedPosts = (data || []).map(post => ({
        ...post,
        is_liked_by_me: post.post_likes?.some((like: any) => like.user_id === currentUser.id) || false,
        likes_count: post.likes_count ?? post.post_likes?.length ?? 0,
        author: {
          id: currentUser.id,
          avatar_url: profile.avatar_url,
          name: profile.name,
          username: profile.username,
        }
      }));
      setMyPosts(formattedPosts);
      setPostsLoaded(true);
    } catch (e) { console.error(e); }
    finally { setLoadingPosts(false); }
  }, [currentUser, profile, postsLoaded]);

  useEffect(() => { fetchProfile(); }, []);
  // Pre-load posts as soon as we have user and profile
  useEffect(() => { if (currentUser && profile) fetchMyPosts(); }, [currentUser, profile]);

  const onRefresh = () => {
    setRefreshing(true);
    setPostsLoaded(false);
    fetchProfile();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Image Picker with native crop + compression ──────────────────────────
  const pickImage = async (type: 'avatar' | 'banner') => {
    // Request media library permission (required on iOS, Android 13+)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to change your profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Native crop UI — same aspect ratios as web (1:1 avatar, 3:1 banner)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,         // ← opens native crop/zoom UI
      aspect: type === 'avatar' ? [1, 1] : [3, 1],
      quality: 1,                  // keep full quality here; we compress below
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // ── Compress with expo-image-manipulator (same as web sharp/canvas) ──
    // Avatar: max 400×400px | Banner: max 1200×400px | Both at 80% JPEG
    const maxW = type === 'avatar' ? 400 : 1200;
    const maxH = type === 'avatar' ? 400 : 400;
    const needsResize = (asset.width || 0) > maxW || (asset.height || 0) > maxH;

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      needsResize ? [{ resize: { width: maxW, height: maxH } }] : [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const uriToUpload = Platform.OS === 'android' && !manipulated.uri.startsWith('file://') 
      ? `file://${manipulated.uri}` 
      : manipulated.uri;

    const info = {
      uri: uriToUpload,
      type: 'image/jpeg',
      name: `${type}-${Date.now()}.jpg`,
    };
    if (type === 'avatar') setNewAvatar(info);
    else setNewBanner(info);
  };

  // ── Upload a single image to Supabase directly ────────────────────────
  const uploadImage = async (
    info: { uri: string; type: string; name: string },
    userId: string,
    folder: 'avatars' | 'banners',
    token: string
  ): Promise<string | null> => {
    try {
      const path = `${folder}/${userId}/${info.name}`;
      
      const res = await FileSystem.uploadAsync(
        `${API_URL}/api/profile/upload`,
        info.uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: { Authorization: `Bearer ${token}` },
          parameters: {
            bucket: folder,
            path: path,
          },
        }
      );

      const body = JSON.parse(res.body);
      if (res.status !== 200) { 
        console.error('Upload failed:', body.error); 
        return null; 
      }
      
      return body.publicUrl;
    } catch (e) {
      console.error('Upload error:', e);
      return null;
    }
  };

  // ── Delete old image from Supabase storage ───────────────────────────────
  const deleteOldImage = async (url: string, folder: 'avatars' | 'banners') => {
    const path = getStoragePath(url, folder);
    if (!path || path.includes('googleusercontent')) return;
    try {
      await supabase.storage.from(folder).remove([path]);
    } catch (e) { console.warn('Could not delete old image:', e); }
  };

  // ── Save Profile ─────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert('Error', 'Not signed in'); return; }
      const token = session.access_token;
      const userId = session.user.id;

      let avatarUrl = profile.avatar_url;
      let bannerUrl = profile.banner_url;

      // Upload new avatar if chosen
      if (newAvatar) {
        const uploadedUrl = await uploadImage(newAvatar, userId, 'avatars', token);
        if (uploadedUrl) {
          // Delete old avatar
          if (profile.avatar_url) await deleteOldImage(profile.avatar_url, 'avatars');
          avatarUrl = uploadedUrl;
        }
      }

      // Upload new banner if chosen
      if (newBanner) {
        const uploadedUrl = await uploadImage(newBanner, userId, 'banners', token);
        if (uploadedUrl) {
          if (profile.banner_url) await deleteOldImage(profile.banner_url, 'banners');
          bannerUrl = uploadedUrl;
        }
      }

      // ── Check if username is already taken by someone else ────────
      const trimmedUsername = editForm.username.trim().toLowerCase() || null;
      if (trimmedUsername && trimmedUsername !== profile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', trimmedUsername)
          .neq('id', userId)
          .maybeSingle();
        
        if (existingUser) {
          Alert.alert('Error', 'Username is already taken');
          setSaving(false);
          return;
        }
      }

      // ── Update DB: only columns that exist in profiles table ──────────────
      // (bio, class_grade, banner_url are NOT in the DB — they live in auth metadata)
      const dbUpdate: Record<string, any> = {
        full_name: editForm.name.trim(),
        username: trimmedUsername,
        school: editForm.school.trim() || null,
      };
      if (avatarUrl !== profile.avatar_url) dbUpdate.avatar_url = avatarUrl;

      const { error: dbErr } = await supabase.from('profiles').update(dbUpdate).eq('id', userId);
      if (dbErr) throw dbErr;

      // ── Update auth user_metadata (bio, grade, banner, etc. all live here) ─
      await supabase.auth.updateUser({
        data: {
          fullName: editForm.name.trim(),
          full_name: editForm.name.trim(),
          username: trimmedUsername,
          bio: editForm.bio.trim() || null,
          school: editForm.school.trim() || null,
          classGrade: editForm.grade.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        }
      });

      // ── Sync JWT metadata via web API (same as web SolveQuestionClient) ───
      await fetch(`${API_URL}/api/profile/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: avatarUrl || undefined,
          bannerUrl: bannerUrl || undefined,
        }),
      });

      // Update local state
      setProfile((prev: any) => ({
        ...prev,
        name: editForm.name.trim(),
        username: editForm.username.trim().toLowerCase() || null,
        bio: editForm.bio.trim() || null,
        school: editForm.school.trim() || null,
        grade: editForm.grade.trim() || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      }));

      setNewAvatar(null);
      setNewBanner(null);
      setEditVisible(false);
      Alert.alert('✅ Saved', 'Your profile has been updated!');
    } catch (err: any) {
      console.error('Save profile error:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const openFollowsModal = async (type: 'followers' | 'following') => {
    setModalType(type);
    setModalVisible(true);
    setModalLoading(true);
    setModalUsers([]);
    setSearchQuery('');
    try {
      if (!profile?.id) return;
      const { data: followsData } = await supabase
        .from('follows').select(type === 'followers' ? 'follower_id' : 'following_id')
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profile.id);
      if (followsData && followsData.length > 0) {
        const ids = followsData.map((f: any) => type === 'followers' ? f.follower_id : f.following_id);
        const { data: profilesData } = await supabase
          .from('profiles').select('id, full_name, username, avatar_url, is_teacher').in('id', ids);
        setModalUsers((profilesData || []).map((p: any) => ({
          ...p, avatar_url: p.avatar_url && !p.avatar_url.includes('googleusercontent.com') ? p.avatar_url : null
        })));
      }
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  const filteredUsers = modalUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // ── Stats & Tabs (memoized to avoid re-computing on every render) ─────────
  const winRate = useMemo(() =>
    profile?.battlesAttempted > 0 ? Math.round((profile.battlesWon / profile.battlesAttempted) * 100) : 0,
    [profile?.battlesAttempted, profile?.battlesWon]);

  const stats = useMemo(() => [
    { icon: Trophy, label: 'Battles Won', value: profile?.battlesWon, color: '#eab308', bg: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: '#22c55e', bg: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4' },
    { icon: Zap, label: 'Battles', value: profile?.battlesAttempted, color: '#f97316', bg: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed' },
    { icon: Star, label: 'Points', value: profile?.totalPoints?.toLocaleString(), color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
  ], [profile?.battlesWon, profile?.battlesAttempted, profile?.totalPoints, isDark, winRate]);

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: 'stats', label: 'Stats', icon: Award },
    { key: 'posts', label: 'Posts', icon: MessageSquare },
    { key: 'achievements', label: 'Badges', icon: Shield },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }
  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <TitlesDashboard
        visible={titlesVisible}
        onClose={() => setTitlesVisible(false)}
        currentCosmetics={Array.isArray(profile?.cosmetics) ? profile.cosmetics : []}
        onTitlesUpdated={(newCosmetics) => {
           setProfile((prev: any) => prev ? { ...prev, cosmetics: newCosmetics } : prev);
        }}
      />

      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ top: Math.max(insets.top, 10) + 10 }}
        className="absolute left-4 z-50 w-10 h-10 bg-black/45 rounded-full justify-center items-center shadow-md active:scale-95"
      >
        <ChevronLeft size={24} color="white" />
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
      >
        {/* Banner */}
        <View className="h-36 relative overflow-hidden">
          {profile.banner_url ? (
            <Image source={getBannerSource(profile.banner_url)} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          ) : (
            <View className="absolute inset-0" style={{ backgroundColor: '#3730a3' }} />
          )}
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(49,46,129,0.5)' }} />
        </View>

        {/* Profile Card */}
        <View className="bg-white dark:bg-slate-900 mx-4 -mt-16 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800 mb-4" style={{ overflow: 'visible' }}>
          <View className="px-5 pb-5">
            {/* Avatar Row */}
            <View className="flex-row items-end justify-between -mt-12 mb-3">
              <View className="relative">
                <View 
                  className={`w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 ${Array.isArray(profile.cosmetics) && profile.cosmetics.includes('avatar_glow') ? 'border-indigo-400' : 'border-white dark:border-slate-900'} justify-center items-center`}
                  style={Array.isArray(profile.cosmetics) && profile.cosmetics.includes('avatar_glow') ? {
                    shadowColor: '#6366f1',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 15,
                    elevation: 10,
                  } : { shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
                >
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <User size={36} color={isDark ? '#cbd5e1' : '#94a3b8'} />
                  )}
                </View>
                <View className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              </View>

              <View className="flex-row items-center gap-2 mt-12">
                {/* Manage Titles button */}
                <TouchableOpacity
                  onPress={() => setTitlesVisible(true)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
                >
                  <Text className="text-amber-600 dark:text-amber-400 text-[12px] font-bold">🏆 Titles</Text>
                </TouchableOpacity>
                {/* Edit Profile button */}
                <TouchableOpacity
                  onPress={() => setEditVisible(true)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50"
                >
                  <Edit3 size={14} color="#4f46e5" />
                  <Text className="text-indigo-600 dark:text-indigo-400 text-[12px] font-bold">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/20 items-center justify-center border border-red-100 dark:border-red-900/30"
                >
                  <LogOut size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Name & Username */}
            <View className="mb-1">
              <BadgedName 
                name={profile.name}
                userId={currentUser?.id}
                isTeacher={profile.isTeacher || profile.is_teacher}
                isTopper={profile.totalPoints >= 1500}
                rank={rank}
                nameClassName="text-[20px] font-bold text-slate-900 dark:text-slate-100 leading-tight"
              />
              {profile.username && (
                <Text className="text-[14px] text-slate-500 dark:text-slate-400">@{profile.username}</Text>
              )}
              {/* Equipped Titles */}
              {Array.isArray(profile.cosmetics) && profile.cosmetics.filter((c: any) => typeof c === 'string' && c.startsWith('equipped_title_')).length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-2.5">
                  {profile.cosmetics.filter((c: any) => typeof c === 'string' && c.startsWith('equipped_title_')).map((c: string, idx: number) => {
                    const titleName = c.split(':')[1];
                    const isCrusher = titleName === 'The Crusher';
                    if (isCrusher) {
                      return (
                        <View key={idx} style={{
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                          backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 4,
                          borderRadius: 20,
                        }}>
                          <Text style={{ fontSize: 11 }}>⚡</Text>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
                            {titleName}
                          </Text>
                          <View style={{ backgroundColor: '#fff2', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                            <Text style={{ color: '#fca5a5', fontSize: 7, fontWeight: '900', letterSpacing: 1 }}>RARE</Text>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <View key={idx} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">{titleName}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Bio */}
            {profile.bio && (
              <Text className="text-[14px] text-slate-600 dark:text-slate-300 mb-3 leading-[20px]">{profile.bio}</Text>
            )}

            {/* Meta */}
            <View className="flex-row flex-wrap gap-3 mb-3">
              {profile.school && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={13} color={isDark ? '#cbd5e1' : '#64748b'} />
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{profile.school}</Text>
                </View>
              )}
              {profile.grade && (
                <View className="flex-row items-center gap-1">
                  <GraduationCap size={13} color={isDark ? '#cbd5e1' : '#64748b'} />
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Grade {profile.grade}</Text>
                </View>
              )}
              {rank && (
                <View className="flex-row items-center gap-1">
                  <Trophy size={13} color="#f59e0b" />
                  <Text className="text-[12px] text-amber-600 dark:text-amber-400 font-bold">Rank #{rank}</Text>
                </View>
              )}
            </View>

            {/* Followers/Following */}
            <View className="flex-row gap-8 border-t border-slate-100 dark:border-slate-800 pt-3">
              <TouchableOpacity onPress={() => openFollowsModal('followers')} activeOpacity={0.7}>
                <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{profile.followers_count}</Text>
                <Text className="text-[12px] text-slate-500 dark:text-slate-400">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openFollowsModal('following')} activeOpacity={0.7}>
                <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{profile.following_count}</Text>
                <Text className="text-[12px] text-slate-500 dark:text-slate-400">Following</Text>
              </TouchableOpacity>
              <View>
                <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{profile.totalPoints.toLocaleString()}</Text>
                <Text className="text-[12px] text-slate-500 dark:text-slate-400">Points</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs - no remount lag */}
        <View className="flex-row mx-4 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 flex-row items-center justify-center py-3 gap-1.5 ${isActive ? 'bg-indigo-600' : 'bg-white dark:bg-slate-900'} ${i < TABS.length - 1 ? 'border-r border-slate-100 dark:border-slate-800' : ''}`}
              >
                <Icon size={14} color={isActive ? 'white' : (isDark ? '#cbd5e1' : '#64748b')} />
                <Text className={`text-[12px] font-bold ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Stats Tab ── */}
        <View style={{ display: activeTab === 'stats' ? 'flex' : 'none' }} className="px-4 pb-24">
          <View className="flex-row flex-wrap gap-3 mb-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View key={stat.label} className="flex-1 min-w-[44%] rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 shadow-sm">
                  <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
                    <Icon size={18} color={stat.color} />
                  </View>
                  <Text className="text-[20px] font-bold text-slate-900 dark:text-slate-100">{stat.value}</Text>
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</Text>
                </View>
              );
            })}
          </View>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Experience Points</Text>
              <Text className="text-[12px] text-indigo-600 dark:text-indigo-400 font-bold">{profile.xp} XP</Text>
            </View>
            <View className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <View className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((profile.xp % 50) * 2, 100)}%` }} />
            </View>
            <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Level {Math.floor(profile.xp / 50) + 1} · {profile.xp % 50}/50 XP to next level
            </Text>
          </View>
        </View>

        {/* ── Posts Tab ── (pre-loaded, just hidden) */}
        <View style={{ display: activeTab === 'posts' ? 'flex' : 'none' }} className="px-4 pb-24">
          {loadingPosts ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#4f46e5" />
            </View>
          ) : myPosts.filter(p => !p.video_url).length === 0 ? (
            <View className="items-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <BookOpen size={36} color={isDark ? '#475569' : '#cbd5e1'} />
              <Text className="text-slate-500 dark:text-slate-400 font-semibold mt-3">No posts yet</Text>
            </View>
          ) : (
            myPosts.filter(p => !p.video_url).slice(0, visiblePostsCount).map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUser?.id || null} 
              />
            ))
          )}
        </View>

        {/* ── Badges Tab ── */}
        <View style={{ display: activeTab === 'achievements' ? 'flex' : 'none' }} className="px-4 pb-24 gap-3">
          {rank && rank <= 3 && (
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm px-5 py-4">
              <View className="flex-row items-center gap-3 mb-1">
                <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 items-center justify-center">
                  <Trophy size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Rank {rank === 1 ? '#1 Champion' : rank === 2 ? '#2 Elite' : '#3 Pro'}</Text>
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400">One of the elite minds in Dheeyudha.</Text>
                </View>
              </View>
            </View>
          )}
          {profile.totalPoints >= 1500 && (
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm px-5 py-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 items-center justify-center">
                  <Award size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Lifetime Topper</Text>
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400">Awarded for achieving over 1,500 lifetime points.</Text>
                </View>
              </View>
            </View>
          )}
          {profile.battlesWon >= 1 && (
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-green-200 dark:border-green-900/50 shadow-sm px-5 py-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 items-center justify-center">
                  <Shield size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900 dark:text-slate-100">First Victory</Text>
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400">Won your first battle in Dheeyudha.</Text>
                </View>
              </View>
            </View>
          )}
          {profile.totalPoints === 0 && !rank && (
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm items-center py-10 px-5">
              <Shield size={36} color={isDark ? '#475569' : '#cbd5e1'} />
              <Text className="text-slate-500 dark:text-slate-400 font-bold mt-3">No badges yet</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-[13px] mt-1 text-center">Win battles and earn points to unlock badges!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ══════════════ Edit Profile Modal ══════════════ */}
      <Modal visible={editVisible} animationType="slide" transparent={false} onRequestClose={() => setEditVisible(false)}>
        <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <TouchableOpacity onPress={() => { setEditVisible(false); setNewAvatar(null); setNewBanner(null); }}>
              <X size={22} color={isDark ? '#cbd5e1' : '#64748b'} />
            </TouchableOpacity>
            <Text className="font-bold text-[16px] text-slate-900 dark:text-slate-100">Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[15px]">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Banner picker */}
            <TouchableOpacity onPress={() => pickImage('banner')} activeOpacity={0.85}>
              <View className="h-32 bg-indigo-900 relative overflow-hidden">
                {(newBanner?.uri || profile?.banner_url) ? (
                  <Image source={{ uri: newBanner?.uri || profile?.banner_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full" style={{ backgroundColor: '#3730a3' }} />
                )}
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                  <Camera size={24} color="white" />
                  <Text className="text-white text-[12px] font-bold mt-1">Change Banner</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Avatar picker */}
            <View className="px-5 -mt-10 mb-4">
              <TouchableOpacity onPress={() => pickImage('avatar')} activeOpacity={0.85} className="self-start">
                <View className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-950 overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-lg justify-center items-center">
                  {(newAvatar?.uri || profile?.avatar_url) ? (
                    <Image source={{ uri: newAvatar?.uri || profile?.avatar_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <User size={30} color="#94a3b8" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full items-center justify-center border-2 border-white dark:border-slate-950">
                  <Camera size={10} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="px-4 gap-3">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'Your full name' },
                { label: 'Username', key: 'username', placeholder: 'your_username' },
                { label: 'Bio', key: 'bio', placeholder: 'Tell everyone about yourself...' },
                { label: 'School / Institute', key: 'school', placeholder: 'e.g. DPS Noida' },
                { label: 'Grade / Class', key: 'grade', placeholder: 'e.g. 12' },
              ].map(({ label, key, placeholder }) => (
                <View key={key} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                  <Text className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">{label}</Text>
                  <TextInput
                    value={editForm[key as keyof typeof editForm]}
                    onChangeText={(val) => setEditForm(prev => ({ ...prev, [key]: val }))}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    multiline={key === 'bio'}
                    numberOfLines={key === 'bio' ? 3 : 1}
                    className="text-[15px] text-slate-900 dark:text-slate-100"
                    style={key === 'bio' ? { minHeight: 64, textAlignVertical: 'top' } : {}}
                    autoCapitalize={key === 'username' ? 'none' : 'words'}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════════ Followers/Following Modal ══════════════ */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] h-[75%] px-5 pt-6 pb-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">{modalType}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                <X size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 mb-4">
              <Search size={16} color="#94a3b8" />
              <TextInput
                placeholder="Search users..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-[14px] text-slate-800 dark:text-slate-100 font-medium py-1 ml-2"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            {modalLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#4f46e5" size="large" />
              </View>
            ) : filteredUsers.length === 0 ? (
              <View className="flex-1 items-center justify-center py-10">
                <User size={48} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-base mt-3">No users found</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {filteredUsers.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => { setModalVisible(false); router.push(`/user/${u.username}` as any); }}
                    activeOpacity={0.6}
                    className="flex-row items-center py-3 border-b border-slate-50 dark:border-slate-800/50"
                  >
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center mr-3">
                      {u.avatar_url ? (
                        <Image source={{ uri: u.avatar_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {(u.full_name || u.username || '?')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-[14px] text-slate-900 dark:text-slate-100" numberOfLines={1}>{u.full_name || u.username || 'Scholar'}</Text>
                      <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">@{u.username || 'scholar'}</Text>
                    </View>
                    <ChevronRight size={16} color={isDark ? '#475569' : '#cbd5e1'} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
