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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  Target,
  Zap,
  Star,
  User,
  MapPin,
  GraduationCap,
  TrendingUp,
  BookOpen,
  Users,
  ChevronRight,
  Flame,
  Award,
  Shield,
  X,
  Search,
  ChevronLeft,
  Play,
  Clock,
  CheckCircle,
  Layers,
} from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';
import { getLevel } from '@/lib/xp';
import { getLeague } from '@/lib/leagues';
import PostCard from '@/components/PostCard';

const { width } = Dimensions.get('window');

// --- SVG Badges ---
const GoldBadge = () => (
  <View className="ml-1 justify-center items-center">
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="goldGrad" x1="4" y1="2" x2="20" y2="22">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="40%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#92400E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M4 10C2 8 2 4 6 4M20 10C22 8 22 4 18 4" stroke="#FBBF24" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      <Path d="M12 2L15 5H9L12 2Z" fill="#FBBF24" />
      <Path d="M12 4L5 7V12C5 17.5 8.5 21.5 12 23C15.5 21.5 19 17.5 19 12V7L12 4Z" fill="url(#goldGrad)" stroke="#78350F" strokeWidth={0.5} />
      <Path d="M12 9L13.2 11.5H16L13.8 13.2L14.6 15.8L12.4 14.2L10.2 15.8L11 13.2L8.8 11.5H11.6L12.8 9Z" fill="white" />
    </Svg>
  </View>
);

const SilverBadge = () => (
  <View className="ml-1 justify-center items-center">
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="silverGrad" x1="4" y1="4" x2="20" y2="20">
          <Stop offset="0%" stopColor="#F1F5F9" />
          <Stop offset="50%" stopColor="#94A3B8" />
          <Stop offset="100%" stopColor="#334155" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2L20 6V12C20 18 12 22 12 22C12 22 4 18 4 12V6L12 2Z" fill="url(#silverGrad)" stroke="#1E293B" strokeWidth={1} />
      <Circle cx={12} cy={12} r={4} fill="#1E293B" opacity={0.2} />
    </Svg>
  </View>
);

const BronzeBadge = () => (
  <View className="ml-1 justify-center items-center">
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="bronzeGrad" x1="12" y1="2" x2="12" y2="22">
          <Stop offset="0%" stopColor="#F97316" />
          <Stop offset="100%" stopColor="#7C2D12" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M8 15V22L12 20L16 22V15" fill="#7C2D12" opacity={0.8} />
      <Circle cx={12} cy={11} r={9} fill="url(#bronzeGrad)" stroke="#431407" strokeWidth={1.5} />
      <Circle cx={12} cy={11} r={7} stroke="white" strokeWidth={0.5} strokeDasharray="2 1" opacity={0.5} />
    </Svg>
  </View>
);

const TopperBadge = () => (
  <View className="ml-1 justify-center items-center">
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="goldGradient" x1="4" y1="2" x2="20" y2="22">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="50%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M12 2L4 5V11C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11V5L12 2Z" fill="url(#goldGradient)" />
      <Path d="M12 7L13.5 10.5H17L14.2 12.5L15.2 16L12 14L8.8 16L9.8 12.5L7 10.5H10.5L12 7Z" fill="white" />
    </Svg>
  </View>
);

const TeacherVerifiedBadge = () => (
  <View className="ml-1 justify-center items-center">
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" fill="#22c55e" />
      <Path d="M7.75 12.75L10.25 15.25L16.25 9.25" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

type StudentTabKey = 'stats' | 'badges' | 'posts';
type TeacherTabKey = 'questions';

export default function PublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { username: searchUsername } = useLocalSearchParams();
  const usernameStr = typeof searchUsername === 'string' ? searchUsername : '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Current user & target profile state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  // Student specific stats
  const [studentTab, setStudentTab] = useState<StudentTabKey>('stats');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [favSubject, setFavSubject] = useState('Exploring');
  const [favTeacher, setFavTeacher] = useState('Various Teachers');
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  // Teacher specific stats
  const [teacherTab, setTeacherTab] = useState<TeacherTabKey>('questions');
  const [teacherRating, setTeacherRating] = useState(0);
  const [teacherReviewsCount, setTeacherReviewsCount] = useState(0);
  const [createdQuestions, setCreatedQuestions] = useState<any[]>([]);
  const [impactStats, setImpactStats] = useState({ reached: 0, solves: 0, accuracy: 0 });

  // Modal for Followers/Following
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfileData = async () => {
    if (!usernameStr) return;
    try {
      // 1. Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Fetch the target profile
      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', usernameStr)
        .single();

      if (profileError || !dbProfile) {
        setProfile(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Check if teacher
      const isTeacherUser = !!dbProfile.is_teacher;
      setIsTeacher(isTeacherUser);

      // Fetch public metadata safely via RPC
      const { data: publicMeta } = await supabase.rpc('get_public_profile_metadata', { target_user_id: dbProfile.id });
      if (publicMeta) {
        dbProfile.banner_url = dbProfile.banner_url || publicMeta.banner_url || publicMeta.banner;
        dbProfile.bio = dbProfile.bio || publicMeta.bio;
        dbProfile.battlesAttempted = Number(publicMeta.battlesAttempted) || 0;
        dbProfile.battlesWon = Number(publicMeta.battlesWon) || 0;
        dbProfile.showWeeklyReport = publicMeta.showWeeklyReport !== false;
      }

      setProfile(dbProfile);

      // 3. Fetch followers and following counts
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', dbProfile.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', dbProfile.id),
      ]);

      setFollowersCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);

      // Check if current user is following target user
      if (user && user.id !== dbProfile.id) {
        const { data: followRecord } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', dbProfile.id)
          .maybeSingle();
        setIsFollowing(!!followRecord);
      } else {
        setIsFollowing(false);
      }

      // 4. Fetch specific details based on user type
      if (!isTeacherUser) {
        // STUDENT PROFILE LOGIC
        // A. Calculate global rank
        const { count: higherRanked } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_teacher', false)
          .gt('total_points', dbProfile.total_points || 0);
        setGlobalRank((higherRanked || 0) + 1);

        // B. Fetch user's posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*, author:profiles(*), post_likes(user_id)')
          .eq('author_id', dbProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsData) {
          setUserPosts(postsData);
        } else {
          setUserPosts([]);
        }

        // Fetch question attempts safely using RPC (bypasses RLS)
        const { data: qAttempts } = await supabase.rpc('get_public_solved_questions', { target_user_id: dbProfile.id });

        const { data: wSubs } = await supabase
          .from('written_submissions')
          .select('question_id')
          .eq('student_id', dbProfile.id);

        const solvedQids = Array.from(
          new Set([
            ...(qAttempts || []).map((a: any) => a.question_id),
            ...(wSubs || []).map((s: any) => s.question_id),
          ])
        );

        let allSolved: any[] = [];
        if (solvedQids.length > 0) {
          const { data: solvedMeta } = await supabase
            .from('questions')
            .select('id, subject, created_by, title, points, difficulty, created_at')
            .in('id', solvedQids)
            .order('created_at', { ascending: false });
          allSolved = solvedMeta || [];
          setSolvedQuestions(allSolved);
        } else {
          setSolvedQuestions([]);
        }

        // C. Calculate favorites
        const subjectCounts: Record<string, number> = {};
        const teacherCounts: Record<string, number> = {};

        allSolved.forEach((q: any) => {
          if (q.subject) subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          if (q.created_by) teacherCounts[q.created_by] = (teacherCounts[q.created_by] || 0) + 1;
        });

        const favSub = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Exploring';
        setFavSubject(favSub);

        const topTeacherId = Object.entries(teacherCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topTeacherId) {
          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', topTeacherId)
            .single();
          if (teacherProfile?.full_name) {
            setFavTeacher(teacherProfile.full_name);
          } else {
            setFavTeacher('Various Teachers');
          }
        } else {
          setFavTeacher('Various Teachers');
        }

        // D. Calculate weekly report
        const showWeekly = dbProfile.showWeeklyReport !== false;
        if (showWeekly) {
          const pastWeekTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const recentAttempts = (qAttempts || []).filter((a: any) => a.created_at >= pastWeekTime);

          let recentActivitiesCount = 0;
          try {
            const { data: actLogs } = await supabase
              .from('activity_logs')
              .select('created_at')
              .eq('user_id', dbProfile.id)
              .gte('created_at', pastWeekTime);
            recentActivitiesCount = actLogs?.length || 0;
          } catch (e) {}

          const allTimestamps = [
            ...recentAttempts.map((a: any) => a.created_at),
            // add mock entries or just use timestamps from attempts
          ];

          const activeDays = new Set(allTimestamps.map((ts: any) => ts.split('T')[0])).size || (recentAttempts.length > 0 ? 1 : 0);
          const repTotal = recentAttempts.length;
          const repCorrect = recentAttempts.filter((a: any) => a.is_correct).length;
          const repAccuracy = repTotal > 0 ? (repCorrect / repTotal) * 100 : 0;

          const accuracyScore = repTotal > 0 ? (repAccuracy / 100) * 40 : 0;
          const volumeScore = Math.min(repTotal * 2, 40);
          const consistencyScore = Math.min(activeDays * 4, 20);
          const totalScore = accuracyScore + volumeScore + consistencyScore;

          let rating = 'Not Rated';
          let ratingMessage = 'Play more to get rated!';
          if (totalScore >= 80) {
            rating = 'Excellent';
            ratingMessage = 'Incredible work this week! They completely dominated.';
          } else if (totalScore >= 60) {
            rating = 'Very Good';
            ratingMessage = 'Solid effort! Just a few more questions to hit Excellent.';
          } else if (totalScore >= 40) {
            rating = 'Good';
            ratingMessage = 'Decent week. Answering more questions next time will boost this.';
          } else if (totalScore >= 20) {
            rating = 'Not Bad';
            ratingMessage = 'They started, but there is so much more they can do!';
          } else if (totalScore >= 0 && repTotal > 0) {
            rating = 'Poor';
            ratingMessage = 'A bit inactive. Time to dust off and try again!';
          }

          setWeeklyReport({
            stats: {
              totalAttempts: repTotal,
              correctAttempts: repCorrect,
              accuracy: Math.round(repAccuracy),
              activeDays,
            },
            rating: { label: rating, message: ratingMessage },
          });
        }
      } else {
        // TEACHER PROFILE LOGIC
        // A. Fetch stats (rating, reviews count)
        const { data: statsData } = await supabase
          .from('teacher_stats')
          .select('average_rating, total_reviews')
          .eq('teacher_id', dbProfile.id)
          .maybeSingle();

        if (statsData) {
          setTeacherRating(Number(statsData.average_rating) || 0);
          setTeacherReviewsCount(Number(statsData.total_reviews) || 0);
        } else {
          setTeacherRating(0);
          setTeacherReviewsCount(0);
        }

        // B. Fetch created questions
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .eq('created_by', dbProfile.id)
          .order('created_at', { ascending: false });

        if (qData) {
          setCreatedQuestions(qData);
          
          // C. Calculate impact analysis
          const qIds = qData.map((q) => q.id);
          if (qIds.length > 0) {
            const { data: attempts } = await supabase
              .from('question_attempts')
              .select('user_id, is_correct')
              .in('question_id', qIds);

            if (attempts) {
              const reached = new Set(attempts.map((a) => a.user_id)).size;
              const solves = attempts.filter((a) => a.is_correct).length;
              const accuracy = attempts.length > 0 ? Math.round((solves / attempts.length) * 100) : 0;
              setImpactStats({ reached, solves, accuracy });
            }
          } else {
            setImpactStats({ reached: 0, solves: 0, accuracy: 0 });
          }
        } else {
          setCreatedQuestions([]);
          setImpactStats({ reached: 0, solves: 0, accuracy: 0 });
        }
      }
    } catch (e) {
      console.error('Error loading public profile data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;
    const previousState = isFollowing;
    const previousFollowers = followersCount;

    setIsFollowing(!previousState);
    setFollowersCount(previousState ? previousFollowers - 1 : previousFollowers + 1);

    try {
      if (previousState) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id });
        if (error) throw error;
      }
    } catch (e) {
      console.error(e);
      setIsFollowing(previousState);
      setFollowersCount(previousFollowers);
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
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select(type === 'followers' ? 'follower_id' : 'following_id')
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profile.id);

      if (followsError) throw followsError;

      if (followsData && followsData.length > 0) {
        const ids = followsData.map((f: any) => (type === 'followers' ? f.follower_id : f.following_id));
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_teacher')
          .in('id', ids);

        if (profilesError) throw profilesError;
        setModalUsers(profilesData || []);
      }
    } catch (err) {
      console.error('Error fetching follows list:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalUserClick = (targetUsername: string) => {
    setModalVisible(false);
    router.push(`/user/${targetUsername}` as any);
  };

  const filteredUsers = modalUsers.filter((u) => {
    const name = (u.full_name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  useEffect(() => {
    fetchProfileData();
  }, [usernameStr]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // --- Header Configuration ---
  const headerTitle = profile ? `@${profile.username}` : 'Profile';

  if (!profile) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <ChevronLeft size={24} color={isDark ? '#cbd5e1' : '#0f172a'} />
              </TouchableOpacity>
            ),
            headerShadowVisible: false,
            headerStyle: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
            headerTintColor: isDark ? '#cbd5e1' : '#0f172a',
          }}
        />

        {/* Floating Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ top: insets.top + 10 }}
          className="absolute left-4 z-50 w-10 h-10 bg-black/45 rounded-full justify-center items-center shadow-md active:scale-95"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 items-center max-w-sm shadow-md">
          <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Text className="text-2xl">👻</Text>
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">User Not Found</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
            The profile you are looking for does not exist or hasn't set a username yet.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-indigo-600 px-6 py-2.5 rounded-2xl active:opacity-80"
          >
            <Text className="text-white font-bold text-sm">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Common stats variables
  const isProfileTopper = !isTeacher && (profile.total_points || 0) >= 1500;
  const isMyself = currentUser?.id === profile.id;
  const totalPoints = profile.total_points || 0;
  const xpLevel = getLevel(profile.xp || 0);

  // Streak checks
  const streakCount = profile.streak_count || 0;
  const streakLongest = profile.streak_longest || streakCount;
  
  // Weekly goal
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayIST = nowIST.toISOString().slice(0, 10);
  const streakGoalMetToday = profile.daily_solve_date === todayIST && (profile.daily_solve_count || 0) >= 2;

  // Monthly points & League
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthlyPoints = profile.monthly_points_month === currentMonthKey ? profile.monthly_points || 0 : 0;
  const userLeague = getLeague(monthlyPoints);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ top: insets.top + 10 }}
        className="absolute left-4 z-50 w-10 h-10 bg-black/45 rounded-full justify-center items-center shadow-md active:scale-95"
      >
        <ChevronLeft size={24} color="white" />
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} tintColor="#4f46e5" />
        }
      >
        {/* Banner Section */}
        <View className="h-36 relative overflow-hidden">
          {isTeacher ? (
            // Carbon fibre styled dark banner
            <View className="absolute inset-0 bg-slate-900">
              <View className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950 to-indigo-900 opacity-90" />
              <View className="absolute inset-0 opacity-20" style={{ backgroundColor: '#1e293b' }} />
            </View>
          ) : profile.banner_url ? (
            <Image source={{ uri: profile.banner_url }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          ) : (
            <View className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-90" />
          )}
          <View className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        </View>

        {/* Profile Card Overlay */}
        <View className="bg-white dark:bg-slate-900 mx-4 -mt-12 rounded-[2.5rem] shadow-lg border border-slate-100/80 dark:border-slate-800/80 p-5 mb-4 relative z-10">
          
          {/* Avatar and Follow Row */}
          <View className="flex-row items-end justify-between -mt-16 mb-4">
            <View className="relative">
              <View className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md justify-center items-center">
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-indigo-50 dark:bg-indigo-950 items-center justify-center">
                    <Text className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl">
                      {(profile.full_name || profile.username || 'S')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              {/* Online status indicator (active in last 3 mins) */}
              {profile.last_seen && (new Date().getTime() - new Date(profile.last_seen).getTime()) < 3 * 60 * 1000 && (
                <View className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </View>

            {/* Follow/Unfollow Button */}
            {!isMyself && (
              <TouchableOpacity
                onPress={handleFollowToggle}
                className={`px-6 py-2 rounded-full border ${
                  isFollowing
                    ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    : 'bg-indigo-650 border-indigo-650'
                } active:scale-95`}
              >
                <Text
                  className={`font-black text-xs ${
                    isFollowing ? 'text-slate-700 dark:text-slate-300' : 'text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name & Verification Badges */}
          <View className="mb-2">
            <BadgedName
              name={profile.full_name || `@${profile.username}`}
              isTeacher={isTeacher}
              isTopper={isProfileTopper}
              rank={globalRank}
            />
            <Text className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 mt-0.5">@{profile.username}</Text>
          </View>

          {/* Student Level progress bar */}
          {!isTeacher && (
            <View className="mt-2 mb-3">
              {(() => {
                const LEVEL_COLORS = [
                  { from: '#94a3b8', to: '#64748b', label: 'Rookie' },
                  { from: '#22d3ee', to: '#0891b2', label: 'Scholar' },
                  { from: '#34d399', to: '#059669', label: 'Expert' },
                  { from: '#818cf8', to: '#4f46e5', label: 'Master' },
                  { from: '#fb923c', to: '#ea580c', label: 'Champion' },
                  { from: '#f472b6', to: '#db2777', label: 'Legend' },
                  { from: '#fbbf24', to: '#d97706', label: 'Mythic' },
                ];
                const c = LEVEL_COLORS[Math.min(xpLevel.level - 1, 6)];
                return (
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2.5 py-1 rounded-full text-white shrink-0"
                      style={{ backgroundColor: c.to }}
                    >
                      <Text className="text-[10px] font-black text-white">⚡ Lv.{xpLevel.level} · {c.label}</Text>
                    </View>
                    <View className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${xpLevel.progressPct}%`,
                          backgroundColor: c.to,
                        }}
                      />
                    </View>
                    <Text className="text-[10px] text-slate-400 font-bold">{xpLevel.xpInLevel}/50 XP</Text>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Teacher rating and subject info */}
          {isTeacher && (
            <View className="flex-row items-center gap-3 mt-1 mb-3 flex-wrap">
              {profile.main_subject && (
                <View className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                  <Text className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    {profile.main_subject}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/40">
                <Text className="text-amber-500 mr-1 text-[12px] font-bold">★</Text>
                <Text className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                  {teacherRating > 0 ? teacherRating.toFixed(1) : 'New'} Mentor {teacherReviewsCount > 0 ? `(${teacherReviewsCount})` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* School & Grade info */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {profile.school && (
              <View className="flex-row items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                <MapPin size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{profile.school}</Text>
              </View>
            )}
            {profile.class_grade && (
              <View className="flex-row items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                <GraduationCap size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Class {profile.class_grade}</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile.bio && (
            <Text className="text-[14px] text-slate-600 dark:text-slate-300 leading-[20px] mb-4">
              {profile.bio}
            </Text>
          )}

          {/* Follow Counts Header */}
          <View className="flex-row gap-6 border-t border-slate-100 dark:border-slate-800 pt-3">
            <TouchableOpacity onPress={() => openFollowsModal('followers')} className="active:opacity-70">
              <Text className="text-base font-bold text-slate-900 dark:text-white">{followersCount}</Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openFollowsModal('following')} className="active:opacity-70">
              <Text className="text-base font-bold text-slate-900 dark:text-white">{followingCount}</Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Following</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {isTeacher ? createdQuestions.length : totalPoints.toLocaleString()}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isTeacher ? 'Questions' : 'Points'}
              </Text>
            </View>
          </View>
        </View>

        {/* Student Specific Streaks and Insights */}
        {!isTeacher && (
          <View className="px-4 mb-4 gap-3">
            
            {/* Streak & League Row */}
            <View className="flex-row gap-3">
              {/* Streak Card */}
              {streakCount > 0 && (
                <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm justify-between">
                  <View className="flex-row items-center gap-2">
                    <Flame
                      size={20}
                      color={streakGoalMetToday ? '#f97316' : '#94a3b8'}
                      fill={streakGoalMetToday ? '#f97316' : 'none'}
                    />
                    <Text className="text-xs font-black text-slate-800 dark:text-slate-200">Streak</Text>
                  </View>
                  <View className="mt-2">
                    <Text className="text-lg font-black text-slate-900 dark:text-white">{streakCount} Days</Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      Best {streakLongest} Days
                    </Text>
                  </View>
                </View>
              )}

              {/* League Card */}
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg">🏆</Text>
                  <Text className="text-xs font-black text-slate-850 dark:text-slate-205" style={{ color: userLeague.color }}>
                    {userLeague.name}
                  </Text>
                </View>
                <View className="mt-2">
                  <Text className="text-lg font-black text-slate-900 dark:text-white">League</Text>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                    {monthlyPoints} pts this month
                  </Text>
                </View>
              </View>
            </View>

            {/* Learning Insights and Rank Podium Card */}
            <View className="flex-row gap-3">
              {/* Insights */}
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                <Text className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider mb-3">
                  Learning Insights
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-center gap-2">
                    <BookOpen size={14} color="#6366f1" />
                    <View className="flex-1">
                      <Text className="text-[9px] uppercase font-bold text-slate-400">Fav Subject</Text>
                      <Text className="text-xs font-black text-slate-800 dark:text-slate-200" numberOfLines={1}>
                        {favSubject}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Users size={14} color="#a855f7" />
                    <View className="flex-1">
                      <Text className="text-[9px] uppercase font-bold text-slate-400">Fav Mentor</Text>
                      <Text className="text-xs font-black text-slate-800 dark:text-slate-200" numberOfLines={1}>
                        {favTeacher}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Rank Shield Card */}
              <View className="flex-1 bg-slate-900 dark:bg-slate-950 p-4 rounded-3xl shadow-sm items-center justify-center relative overflow-hidden">
                <View className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
                <View className="mb-2">
                  {globalRank === 1 ? (
                    <GoldBadge />
                  ) : globalRank === 2 ? (
                    <SilverBadge />
                  ) : globalRank === 3 ? (
                    <BronzeBadge />
                  ) : (
                    <Trophy size={28} color="#fbbf24" />
                  )}
                </View>
                <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Rank</Text>
                <Text className="text-lg font-black text-white mt-0.5">#{globalRank || '?'}</Text>
              </View>
            </View>

          </View>
        )}

        {/* Teacher Specific Impact Metrics */}
        {isTeacher && (
          <View className="px-4 mb-4">
            <View className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
              <Text className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider mb-4">
                Impact Analysis
              </Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-[20px] font-black text-slate-900 dark:text-white">
                    {impactStats.reached}
                  </Text>
                  <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                    Reached
                  </Text>
                </View>
                <View className="w-[1px] h-10 bg-slate-100 dark:bg-slate-800" />
                <View className="items-center flex-1">
                  <Text className="text-[20px] font-black text-slate-900 dark:text-white">
                    {impactStats.solves}
                  </Text>
                  <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                    Solves
                  </Text>
                </View>
                <View className="w-[1px] h-10 bg-slate-100 dark:bg-slate-800" />
                <View className="items-center flex-1">
                  <Text className="text-[20px] font-black text-slate-900 dark:text-white">
                    {impactStats.accuracy}%
                  </Text>
                  <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                    Accuracy
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Dynamic Tabs Selectors */}
        {!isTeacher ? (
          <View className="flex-row mx-4 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {(['stats', 'badges', 'posts'] as StudentTabKey[]).map((tab) => {
              const isActive = studentTab === tab;
              const labels = { stats: 'Stats', badges: 'Badges', posts: 'Posts' } as any;
              const icons = { stats: Award, badges: Shield, posts: Layers } as any;
              const TabIcon = icons[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setStudentTab(tab)}
                  className={`flex-1 flex-row items-center justify-center py-3 gap-1.5 ${
                    isActive ? 'bg-indigo-600' : 'bg-transparent'
                  }`}
                >
                  <TabIcon size={14} color={isActive ? 'white' : (isDark ? '#cbd5e1' : '#64748b')} />
                  <Text
                    className={`text-[12px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-650 dark:text-slate-300'
                    }`}
                  >
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="flex-row mx-4 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {(['questions'] as TeacherTabKey[]).map((tab) => {
              const isActive = teacherTab === tab;
              const labels = { questions: 'Created Questions' };
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setTeacherTab(tab)}
                  className={`flex-1 flex-row items-center justify-center py-3 gap-1.5 ${
                    isActive ? 'bg-indigo-600' : 'bg-transparent'
                  }`}
                >
                  <BookOpen size={14} color={isActive ? 'white' : (isDark ? '#cbd5e1' : '#64748b')} />
                  <Text
                    className={`text-[12px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-650 dark:text-slate-300'
                    }`}
                  >
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Student Tab Panel Content */}
        {!isTeacher && studentTab === 'stats' && (
          <View className="px-4 pb-24 gap-3">
            {/* Stats Grid */}
            <View className="flex-row flex-wrap gap-3">
              {[
                { label: 'Battles Won', value: profile.battlesWon || 0, icon: Trophy, color: '#eab308', bg: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8' },
                {
                  label: 'Win Rate',
                  value: `${profile.battlesAttempted > 0 ? Math.round(((profile.battlesWon || 0) / profile.battlesAttempted) * 100) : 0}%`,
                  icon: Target,
                  color: '#22c55e',
                  bg: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4',
                },
                { label: 'Battles', value: profile.battlesAttempted || 0, icon: Zap, color: '#f97316', bg: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed' },
                { label: 'Points', value: totalPoints.toLocaleString(), icon: Star, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <View
                    key={stat.label}
                    className="flex-1 min-w-[44%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-4 rounded-3xl shadow-sm"
                  >
                    <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
                      <StatIcon size={18} color={stat.color} />
                    </View>
                    <Text className="text-[20px] font-black text-slate-900 dark:text-white">{stat.value}</Text>
                    <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{stat.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Weekly Report Card */}
            {weeklyReport && (
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm mt-1">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xs font-black text-slate-800 dark:text-slate-200">Weekly Performance</Text>
                  <View className="bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/40">
                    <Text className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                      {weeklyReport.rating.label}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-normal mb-4">
                  {weeklyReport.rating.message}
                </Text>

                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text className="text-base font-black text-slate-900 dark:text-white">
                      {weeklyReport.stats.totalAttempts}
                    </Text>
                    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Attempts</Text>
                  </View>
                  <View className="items-center flex-1 border-x border-slate-100 dark:border-slate-800">
                    <Text className="text-base font-black text-slate-900 dark:text-white">
                      {weeklyReport.stats.accuracy}%
                    </Text>
                    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Accuracy</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-base font-black text-slate-900 dark:text-white">
                      {weeklyReport.stats.activeDays}
                    </Text>
                    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Active Days</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {!isTeacher && studentTab === 'badges' && (
          <View className="px-4 pb-24 gap-3">
            {/* Champion Badge */}
            {globalRank && globalRank <= 3 && (
              <View className="bg-white dark:bg-slate-900 border border-amber-250 dark:border-amber-900/50 p-4 rounded-3xl shadow-sm flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/20 items-center justify-center">
                  <Trophy size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-slate-900 dark:text-white">
                    Rank {globalRank === 1 ? '#1 Champion' : globalRank === 2 ? '#2 Elite' : '#3 Pro'}
                  </Text>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    {globalRank === 1 ? 'Holding the crown as the smartest mind.' : 'One of the elite minds in Dheeyudhha.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Topper Badge */}
            {totalPoints >= 1500 && (
              <View className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 p-4 rounded-3xl shadow-sm flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 items-center justify-center">
                  <Award size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-slate-900 dark:text-white">Lifetime Topper</Text>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    Awarded for achieving over 1,500 lifetime points.
                  </Text>
                </View>
              </View>
            )}

            {/* First Victory Badge */}
            {profile.battlesWon >= 1 && (
              <View className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/50 p-4 rounded-3xl shadow-sm flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-950/20 items-center justify-center">
                  <Shield size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-slate-900 dark:text-white">First Victory</Text>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    Won their first battle in Dheeyudhha.
                  </Text>
                </View>
              </View>
            )}

            {/* Empty State */}
            {totalPoints === 0 && (!globalRank || globalRank > 3) && (
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm items-center">
                <Shield size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm">No badges yet</Text>
                <Text className="text-[11px] text-slate-450 dark:text-slate-500 text-center mt-1">
                  Play duels and achieve top marks to unlock special badges!
                </Text>
              </View>
            )}
          </View>
        )}

        {!isTeacher && studentTab === 'posts' && (
          <View className="px-4 pb-24 gap-3">
            {userPosts.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm items-center">
                <BookOpen size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm">No posts found</Text>
                <Text className="text-[11px] text-slate-450 dark:text-slate-500 text-center mt-1">
                  Posts shared by @{profile.username} will appear here.
                </Text>
              </View>
            ) : (
              userPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUser?.id || null} 
                />
              ))
            )}
          </View>
        )}

        {/* Teacher Tab Panel Content */}
        {isTeacher && teacherTab === 'questions' && (
          <View className="px-4 pb-24 gap-3">
            {createdQuestions.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm items-center">
                <BookOpen size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm">No questions created</Text>
                <Text className="text-[11px] text-slate-450 dark:text-slate-500 text-center mt-1">
                  Questions created by @{profile.username} will appear here.
                </Text>
              </View>
            ) : (
              createdQuestions.map((q) => (
                <View
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                        {q.title || 'Untitled Question'}
                      </Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1" numberOfLines={2}>
                        {q.body}
                      </Text>
                    </View>
                    <View className="bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 flex-row items-center gap-1">
                      <Zap size={10} color="#eab308" fill="#eab308" />
                      <Text className="text-[10px] font-black text-amber-700 dark:text-amber-400">
                        {q.points || 0} PTS
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <View className="bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                        <Text className="text-[9px] font-black text-indigo-750 dark:text-indigo-300 uppercase">
                          {q.subject || 'General'}
                        </Text>
                      </View>
                      {q.difficulty && (
                        <View className="bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">
                          <Text className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase">
                            {q.difficulty}
                          </Text>
                        </View>
                      )}
                      {q.time_limit && (
                        <View className="flex-row items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Clock size={8} color="#64748b" />
                          <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                            {q.time_limit}m
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/explore', params: { search: q.title } } as any)}
                      className="bg-indigo-650 flex-row items-center gap-1 px-3 py-1.5 rounded-xl"
                    >
                      <Play size={10} color="white" fill="white" />
                      <Text className="text-[10px] font-black text-white">Attempt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Followers/Following List Overlay Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] h-[75%] px-5 pt-6 pb-8 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-black text-slate-900 dark:text-white capitalize">{modalType}</Text>
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
                <Text className="text-slate-505 dark:text-slate-400 font-bold text-base mt-3">No users found</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">
                  {searchQuery ? 'Try checking spelling or search another name.' : `No ${modalType} yet.`}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {filteredUsers.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => handleModalUserClick(u.username)}
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
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text className="font-bold text-[14px] text-slate-900 dark:text-white" numberOfLines={1}>
                            {u.full_name || u.username || 'Scholar'}
                          </Text>
                          {u.is_teacher && <TeacherVerifiedBadge />}
                        </View>
                        <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium" numberOfLines={1}>
                          @{u.username || 'scholar'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={isDark ? '#cbd5e1' : '#94a3b8'} />
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

// Wrapper for custom style names with verification badges
const BadgedName = ({
  name,
  isTeacher,
  isTopper,
  rank,
}: {
  name: string;
  isTeacher?: boolean;
  isTopper?: boolean;
  rank?: number | null;
}) => {
  return (
    <View className="flex-row items-center gap-1.5 flex-wrap">
      <Text className="text-[20px] font-black text-slate-900 dark:text-white leading-tight">{name}</Text>
      <View className="flex-row items-center gap-1 shrink-0">
        {isTeacher && <TeacherVerifiedBadge />}
        {rank === 1 && <GoldBadge />}
        {rank === 2 && <SilverBadge />}
        {rank === 3 && <BronzeBadge />}
        {isTopper && <TopperBadge />}
      </View>
    </View>
  );
};
