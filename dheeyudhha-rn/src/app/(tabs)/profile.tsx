import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  Target,
  Zap,
  Star,
  User,
  MapPin,
  GraduationCap,
  Edit3,
  LogOut,
  ChevronRight,
  Award,
  BookOpen,
  Shield,
  MessageSquare,
  Search,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

type TabKey = 'stats' | 'posts' | 'achievements';

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

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login' as any); return; }
      setCurrentUser(user);

      // Fetch profile from DB
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch followers/following counts in parallel
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)
      ]);

      const meta = user.user_metadata || {};
      const merged = {
        id: user.id,
        name: dbProfile?.full_name || meta.fullName || meta.full_name || user.email?.split('@')[0] || 'Scholar',
        username: dbProfile?.username || meta.username || null,
        email: user.email,
        avatar_url: dbProfile?.avatar_url || meta.avatar_url || null,
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

      // Fetch rank separately
      const { data: rankData } = await supabase
        .from('profiles')
        .select('id')
        .gte('total_points', merged.totalPoints)
        .neq('id', user.id);
      setRank((rankData?.length || 0) + 1);

    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyPosts = async () => {
    if (!currentUser) return;
    setLoadingPosts(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, post_likes(user_id)')
        .eq('author_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMyPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
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

      // 1. Fetch relationships from follows table
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select(type === 'followers' ? 'follower_id' : 'following_id')
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profile.id);

      if (followsError) throw followsError;

      if (followsData && followsData.length > 0) {
        const ids = followsData.map((f: any) => type === 'followers' ? f.follower_id : f.following_id);

        // 2. Fetch profiles for these ids
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_teacher')
          .in('id', ids);

        if (profilesError) throw profilesError;
        
        const cleanedProfiles = (profilesData || []).map((p: any) => ({
          ...p,
          avatar_url: p.avatar_url && !p.avatar_url.includes('googleusercontent.com') ? p.avatar_url : null
        }));
        
        setModalUsers(cleanedProfiles);
      }
    } catch (err) {
      console.error('Error fetching follows list:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = modalUsers.filter(u => {
    const name = (u.full_name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => {
    if (activeTab === 'posts' && currentUser && myPosts.length === 0) {
      fetchMyPosts();
    }
  }, [activeTab, currentUser]);

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login' as any);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!profile) return null;

  const winRate = profile.battlesAttempted > 0
    ? Math.round((profile.battlesWon / profile.battlesAttempted) * 100)
    : 0;

  const stats = [
    { icon: Trophy, label: 'Battles Won', value: profile.battlesWon, color: '#eab308', bg: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: '#22c55e', bg: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4' },
    { icon: Zap, label: 'Battles', value: profile.battlesAttempted, color: '#f97316', bg: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed' },
    { icon: Star, label: 'Points', value: profile.totalPoints.toLocaleString(), color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
  ];

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: 'stats', label: 'Stats', icon: Award },
    { key: 'posts', label: 'Posts', icon: MessageSquare },
    { key: 'achievements', label: 'Badges', icon: Shield },
  ];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
      >
        {/* Banner */}
        <View className="h-36 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
          {profile.banner_url ? (
            <Image source={{ uri: profile.banner_url }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          ) : (
            <View className="absolute inset-0 bg-indigo-650" />
          )}
          {/* Overlay gradient */}
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(49,46,129,0.5)' }} />
        </View>

        {/* Profile Card */}
        <View className="bg-white dark:bg-slate-900 mx-4 -mt-16 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800 mb-4" style={{ overflow: 'visible' }}>
          <View className="px-5 pb-5">
            {/* Avatar Row */}
            <View className="flex-row items-end justify-between -mt-12 mb-3">
              <View className="relative">
                <View className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg justify-center items-center">
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <User size={36} color={isDark ? '#cbd5e1' : '#94a3b8'} />
                  )}
                </View>
                {/* Online dot */}
                <View className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              </View>

              <View className="flex-row items-center gap-2 mt-12">
                {rank && rank <= 3 && (
                  <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: rank === 1 ? '#fef3c7' : rank === 2 ? '#f1f5f9' : '#fef3c7', opacity: isDark ? 0.2 : 1 }}>
                    <Text className="text-xs font-bold" style={{ color: rank === 1 ? '#92400e' : rank === 2 ? '#475569' : '#92400e' }}>
                      {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : '🥉 #3'}
                    </Text>
                  </View>
                )}
                {isDark && rank && rank <= 3 && (
                  <View className="absolute left-0 px-3 py-1.5 rounded-full border border-amber-500/30">
                    <Text className="text-xs font-bold text-amber-400">
                      {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : '🥉 #3'}
                    </Text>
                  </View>
                )}
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
              <Text className="text-[20px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{profile.name}</Text>
              {profile.username && (
                <Text className="text-[14px] text-slate-500 dark:text-slate-400">@{profile.username}</Text>
              )}
            </View>

            {/* Bio */}
            {profile.bio && (
              <Text className="text-[14px] text-slate-600 dark:text-slate-300 mb-3 leading-[20px]">{profile.bio}</Text>
            )}

            {/* Meta info: school, grade */}
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

            {/* Followers / Following */}
            <View className="flex-row gap-8 border-t border-slate-100 dark:border-slate-800 pt-3">
              <TouchableOpacity onPress={() => openFollowsModal('followers')} className="active:opacity-70">
                <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{profile.followers_count}</Text>
                <Text className="text-[12px] text-slate-500 dark:text-slate-400">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openFollowsModal('following')} className="active:opacity-70">
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

        {/* Tabs */}
        <View className="flex-row mx-4 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 flex-row items-center justify-center py-3 gap-1.5 ${isActive ? 'bg-indigo-600' : 'bg-white dark:bg-slate-900'} ${i < TABS.length - 1 ? 'border-r border-slate-100 dark:border-slate-850' : ''}`}
              >
                <Icon size={14} color={isActive ? 'white' : (isDark ? '#cbd5e1' : '#64748b')} />
                <Text className={`text-[12px] font-bold ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <View className="px-4 pb-24">
            {/* Stats grid */}
            <View className="flex-row flex-wrap gap-3 mb-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <View
                    key={stat.label}
                    className="flex-1 min-w-[44%] rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 shadow-sm"
                  >
                    <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
                      <Icon size={18} color={stat.color} />
                    </View>
                    <Text className="text-[20px] font-bold text-slate-900 dark:text-slate-100">{stat.value}</Text>
                    <Text className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* XP bar */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Experience Points</Text>
                <Text className="text-[12px] text-indigo-600 dark:text-indigo-400 font-bold">{profile.xp} XP</Text>
              </View>
              <View className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min((profile.xp % 1000) / 10, 100)}%` }}
                />
              </View>
              <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Level {Math.floor(profile.xp / 1000) + 1} · {profile.xp % 1000}/1000 XP to next level
              </Text>
            </View>
          </View>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <View className="px-4 pb-24">
            {loadingPosts ? (
              <View className="items-center py-12">
                <ActivityIndicator color="#4f46e5" />
              </View>
            ) : myPosts.length === 0 ? (
              <View className="items-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <BookOpen size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-semibold mt-3">No posts yet</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-[13px] mt-1">Your posts will appear here</Text>
              </View>
            ) : (
              myPosts.map((post) => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/posts/${post.id}` as any)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 mb-3 active:bg-slate-50 dark:active:bg-slate-800"
                >
                  <Text className="text-[15px] text-slate-800 dark:text-slate-200 leading-[22px] mb-2" numberOfLines={3}>
                    {post.content}
                  </Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Star size={13} color="#ef4444" />
                      <Text className="text-[12px] text-slate-500 dark:text-slate-400">{post.post_likes?.length || post.likes_count || 0}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MessageSquare size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text className="text-[12px] text-slate-500 dark:text-slate-400">{post.comments_count || 0}</Text>
                    </View>
                    <Text className="text-[12px] text-slate-400 dark:text-slate-500 ml-auto">{formatTimeAgo(post.created_at)}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Badges Tab */}
        {activeTab === 'achievements' && (
          <View className="px-4 pb-24 gap-3">
            {rank && rank <= 3 && (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm px-5 py-4">
                <View className="flex-row items-center gap-3 mb-1">
                  <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 items-center justify-center">
                    <Trophy size={20} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
                      Rank {rank === 1 ? '#1 Champion' : rank === 2 ? '#2 Elite' : '#3 Pro'}
                    </Text>
                    <Text className="text-[12px] text-slate-500 dark:text-slate-400">
                      {rank === 1 ? 'Holding the crown as the smartest mind.' : 'One of the elite minds in Dheeyudha.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {profile.totalPoints >= 1500 && (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm px-5 py-4">
                <View className="flex-row items-center gap-3 mb-1">
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

            {profile.totalPoints === 0 && rank !== 1 && rank !== 2 && rank !== 3 && (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm items-center py-10 px-5">
                <Shield size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold mt-3">No badges yet</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-[13px] mt-1 text-center">Win battles and earn points to unlock badges!</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Followers/Following Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] h-[75%] px-5 pt-6 pb-8 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                {modalType}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <X size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
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

            {/* Users List */}
            {modalLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#4f46e5" size="large" />
              </View>
            ) : filteredUsers.length === 0 ? (
              <View className="flex-1 items-center justify-center py-10">
                <User size={48} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-base mt-3">No users found</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">
                  {searchQuery ? 'Try checking spelling or search another name.' : `No ${modalType} yet.`}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {filteredUsers.map((u) => (
                  <TouchableOpacity 
                    key={u.id} 
                    onPress={() => {
                      setModalVisible(false);
                      router.push(`/user/${u.username}` as any);
                    }}
                    activeOpacity={0.6}
                    className="flex-row items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50"
                  >
                    <View className="flex-row items-center flex-1 mr-4">
                      {/* Avatar */}
                      <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center mr-3">
                        {u.avatar_url ? (
                          <Image source={{ uri: u.avatar_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <View className="w-full h-full bg-indigo-50 dark:bg-indigo-950/40 items-center justify-center">
                            <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                              {(u.full_name || u.username || '?')[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-[14px] text-slate-900 dark:text-slate-100" numberOfLines={1}>
                          {u.full_name || u.username || 'Scholar'}
                        </Text>
                        <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium" numberOfLines={1}>
                          @{u.username || 'scholar'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
