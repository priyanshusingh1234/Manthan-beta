import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Vibration, Image, ScrollView, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { Clock, Zap, CheckCircle2, XCircle, ArrowLeft, Trophy, Users, Star, Lightbulb, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import ConfettiCannon from 'react-native-confetti-cannon';
import ChallengeFriendModal from '@/components/ChallengeFriendModal';
import WrittenSolveClient from '@/components/WrittenSolveClient';
import { getRandomMessage } from '@/lib/feedbackMessages';
import MatchArena from '@/components/MatchArena';
import HotspotArena from '@/components/HotspotArena';
import IndiaMapArena from '@/components/IndiaMapArena';
import BadgedName from '@/components/BadgedName';
import { useCorrectSound } from '@/hooks/useCorrectSound';

export default function SolveQuestionScreen() {
  const { id, challenge } = useLocalSearchParams<{ id: string; challenge?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState<any>(null);
  const [recoveredViaCoop, setRecoveredViaCoop] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [socialPresence, setSocialPresence] = useState<any>(null);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const playCorrectSound = useCorrectSound();
  
  // Rich features
  const [purchasedHint, setPurchasedHint] = useState<string | null>(null);
  const [isPurchasingHint, setIsPurchasingHint] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [startedAt] = useState(() => new Date().toISOString());

  // Resolve image URL: handles public folder (/images/...), full http URLs, and bare storage paths
  const resolveImageUrl = (raw?: string | null) => {
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;                           // Full URL (Cloudinary, Supabase CDN)
    if (raw.startsWith('/')) return `${process.env.EXPO_PUBLIC_API_URL}${raw}`;   // Public folder
    return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${raw}`; // Legacy bare path
  };
  const imageUrl = resolveImageUrl(question?.image_url);

  useEffect(() => {
    const fetchQuestionAndAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login' as any);
          return;
        }

        // Fetch question
        const { data: q, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .eq('id', id)
          .single();

        if (qErr || !q) throw new Error('Question not found');

        // Fetch teacher profile manually
        if (q.created_by) {
          const { data: tp } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_teacher')
            .eq('id', q.created_by)
            .maybeSingle();
          if (tp) {
            q.profiles = tp;
          }
        }
        
        setQuestion(q);
        setTimeLeft(q.time_limit * 60);
        setCurrentUserId(user.id);

        // Check if user is the coop partner
        let isCoopPartner = false;
        if (challenge) {
            const { data: challengeInfo } = await supabase
                .from("coop_challenges")
                .select("partner_id, status")
                .eq("id", challenge)
                .maybeSingle();
            if (challengeInfo && challengeInfo.partner_id === user.id && (challengeInfo.status === 'pending' || challengeInfo.status === 'active')) {
                isCoopPartner = true;
            }
        }

        // Check if already attempted
        const { data: attempt } = await supabase
          .from('question_attempts')
          .select('is_correct, selected_option')
          .eq('user_id', user.id)
          .eq('question_id', id)
          .maybeSingle();

        if (attempt && !isCoopPartner) {
          setAlreadyAttempted(attempt);
        }

        // Check if user already won this question via co-op
        const { data: wonCoop } = await supabase
          .from('coop_challenges')
          .select('id')
          .eq('initiator_id', user.id)
          .eq('question_id', id)
          .eq('status', 'won')
          .limit(1)
          .maybeSingle();

        if (wonCoop) {
          setRecoveredViaCoop(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuestionAndAuth();
  }, [id, router]);

  const handleSubmit = useCallback(async (forcedOption?: number | null, forcedIsCorrect?: boolean) => {
    if (isSubmitting || result || alreadyAttempted) return;
    setIsSubmitting(true);
    
    const optionToSend = forcedOption !== undefined ? forcedOption : selectedOption;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Update this URL to point to your live Next.js backend!
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

      const res = await fetch(`${API_URL}/api/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: optionToSend ?? null,
          isCorrect: forcedIsCorrect,
          startedAt,
          timeTaken: Math.max(0, question.time_limit * 60 - timeLeft),
          challengeId: challenge || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit answer");
        setIsSubmitting(false);
        return;
      }

      // Attach funny message locally (same as web SolveQuestionClient.tsx)
      data.funnyMessage = getRandomMessage(data.isCorrect);
      setResult(data);

      // Emit question solved event (used to update the feed immediately)
      DeviceEventEmitter.emit('question_solved', { questionId: question.id });

      // 🔥 Fire global streak toast when daily goal is completed
      if (data?.streak?.streakEarnedToday) {
        DeviceEventEmitter.emit('streak_earned', { streak: data.streak.current });
      }

      if (data?.leaderboardEvent) {
        DeviceEventEmitter.emit('leaderboard_event', data.leaderboardEvent);
      }

      if (data.isCorrect) {
        Vibration.vibrate([0, 100, 50, 100]); // Happy vibration
        try {
          playCorrectSound();
        } catch (e) { console.log('Sound error', e); }
      } else {
        Vibration.vibrate(300); // Heavy buzz
        // Automatically open the Co-op (Ask for Help) modal instantly on wrong answer
        if (!challenge && !recoveredViaCoop) {
          setTimeout(() => setIsChallengeModalOpen(true), 800);
        }
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
      setIsSubmitting(false);
    }
  }, [isSubmitting, result, alreadyAttempted, selectedOption, startedAt, question, timeLeft, challenge, recoveredViaCoop]);

  // Timer logic
  useEffect(() => {
    if (loading || alreadyAttempted || result || isSubmitting) return;

    if (timeLeft <= 0) {
      if (question?.question_type === 'match') {
        handleSubmit(-1, false);
      } else {
        handleSubmit(selectedOption);
      }
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, alreadyAttempted, result, isSubmitting, handleSubmit, selectedOption]);

  // Heartbeat haptics when time is running out (< 10 seconds)
  useEffect(() => {
    if (loading || alreadyAttempted || result || isSubmitting) return;
    if (timeLeft <= 10 && timeLeft > 0) {
      Vibration.vibrate(40);
      setTimeout(() => Vibration.vibrate(40), 200);
    }
  }, [timeLeft, loading, alreadyAttempted, result, isSubmitting]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const handlePurchaseHint = async () => {
    if (isPurchasingHint) return;
    setIsPurchasingHint(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/solve/hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ questionId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchasedHint(data.hint);
      } else {
        alert(data.error || "Failed to purchase hint.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsPurchasingHint(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0 || reviewSubmitted) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          questionId: id,
          teacherId: question.created_by,
          rating
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit review");
      }
    } catch (err) {
      alert("Error submitting review");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!question) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <Text className="text-slate-500 font-bold">Question not found</Text>
      </View>
    );
  }

  if (question && (!question.options || question.options.length === 0) && question.question_type !== 'match' && question.question_type !== 'hotspot' && question.question_type !== 'india_map') {
    return <WrittenSolveClient question={question} challengeId={challenge as string | undefined} />;
  }

  // Already Attempted UI
  if (alreadyAttempted && !result) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 p-6" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          {alreadyAttempted.is_correct ? (
            <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-6">
              <CheckCircle2 size={40} color="#16a34a" />
            </View>
          ) : (
            <View className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-6">
              <XCircle size={40} color="#dc2626" />
            </View>
          )}
          
          <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 text-center mb-2">
            Already Attempted
          </Text>
          <Text className="text-lg text-slate-600 dark:text-slate-400 text-center mb-8">
            Your answer was <Text className="font-bold">{alreadyAttempted.is_correct ? "Correct" : "Incorrect"}</Text>.
          </Text>

          <View className="w-full max-w-sm space-y-3">
            {recoveredViaCoop && (
              <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-4 rounded-2xl mb-2">
                <Text className="font-bold flex-row items-center text-emerald-800 dark:text-emerald-300 mb-1">
                  <Trophy size={16} color="#f59e0b" style={{ marginRight: 6 }} />
                  Points Recovered!
                </Text>
                <Text className="text-emerald-700 dark:text-emerald-400 text-sm">
                  You tagged a friend and they solved this correctly for you! You both split the points.
                </Text>
              </View>
            )}

            {!alreadyAttempted.is_correct && !challenge && !recoveredViaCoop && (
              <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 p-4 rounded-2xl mb-2">
                <Text className="font-bold flex-row items-center text-indigo-800 dark:text-indigo-300 mb-1">
                  <Users size={16} color="#4f46e5" style={{ marginRight: 6 }} />
                  Co-op Recovery Available!
                </Text>
                <Text className="text-indigo-700 dark:text-indigo-400 text-sm">
                  You can't retry this alone, but if you tag a friend and they solve it correctly, you'll both split the points!
                </Text>
              </View>
            )}

            {!alreadyAttempted.is_correct && !challenge && !recoveredViaCoop && (
              <TouchableOpacity 
                onPress={() => setIsChallengeModalOpen(true)}
                className="bg-indigo-600 flex-row items-center justify-center py-4 rounded-xl mb-3 shadow-sm"
              >
                <Users size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-lg">Ask for Help</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={() => router.replace('/')}
              className={`py-4 rounded-xl items-center border ${alreadyAttempted.is_correct ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
            >
              <Text className={`font-bold text-lg ${alreadyAttempted.is_correct ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentUserId && (
          <ChallengeFriendModal
            visible={isChallengeModalOpen}
            onClose={() => setIsChallengeModalOpen(false)}
            questionId={question.id}
            currentUserId={currentUserId}
          />
        )}
      </View>
    );
  }

  // Result UI
  if (result) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 p-6" style={{ paddingTop: insets.top }}>
        {result.isCorrect && (
          <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fallSpeed={2500} fadeOut />
        )}
        <ScrollView contentContainerStyle={{ paddingBottom: 60, alignItems: 'center' }}>
          {result.isCorrect ? (
            <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-4 mt-6">
              <CheckCircle2 size={40} color="#16a34a" />
            </View>
          ) : (
            <View className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-4 mt-6">
              <XCircle size={40} color="#dc2626" />
            </View>
          )}

          <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 text-center mb-2">
            {result.isCorrect ? 'Epic Solve!' : 'Incorrect'}
          </Text>

          {result.funnyMessage && (
            <Text className="text-base text-slate-500 dark:text-slate-400 text-center italic mb-6 px-4">
              "{result.funnyMessage}"
            </Text>
          )}

          <View className="flex-row items-center gap-4 mb-6">
            <View className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <Text className="text-slate-600 dark:text-slate-300 font-bold">
                {result.pointsChange > 0 ? `+${result.pointsChange}` : `${result.pointsChange}`} Points
              </Text>
            </View>
            
            {result.xpGained > 0 && (
              <View className="bg-indigo-100 dark:bg-indigo-900/40 px-4 py-2 rounded-xl flex-row items-center gap-2">
                <Zap size={16} color="#4f46e5" fill="#4f46e5" />
                <Text className="text-indigo-700 dark:text-indigo-400 font-bold">+{result.xpGained} XP</Text>
              </View>
            )}
          </View>

          {/* Explanation */}
          {result.explanation && !result.isCorrect && (
            <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-5 mb-6 w-full">
              <Text className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 mb-2">
                Explanation
              </Text>
              <Text className="text-slate-700 dark:text-slate-300">
                {result.explanation}
              </Text>
            </View>
          )}

          {/* Match Feedback */}
          {!result.isCorrect && question?.question_type === 'match' && question?.match_pairs && (
            <View className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 w-full">
              <Text className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3 text-center">
                The correct matches were:
              </Text>
              <View className="gap-2">
                {question.match_pairs.map((pair: any, idx: number) => (
                  <View key={idx} className="flex-row items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Text className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">{pair.left}</Text>
                    <View className="px-3">
                      <Text className="text-emerald-500 font-black">→</Text>
                    </View>
                    <Text className="flex-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-left">{pair.right}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Micro-Leaderboard Snippet */}
          {socialPresence?.leaderboardGap && result?.isCorrect && (
            <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 mb-4 items-center w-full">
              <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-center">
                🏆 {socialPresence.leaderboardGap}
              </Text>
            </View>
          )}

          {/* Rating */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 w-full items-center">
            {!reviewSubmitted ? (
              <>
                <Text className="font-bold text-slate-800 dark:text-slate-200 mb-1">Rate this Question</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                  Help us identify the best content
                </Text>
                <View className="flex-row items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Star 
                        size={32} 
                        color={star <= rating ? "#f59e0b" : "#cbd5e1"} 
                        fill={star <= rating ? "#f59e0b" : "transparent"} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleReviewSubmit}
                  disabled={rating === 0}
                  className={`flex-row items-center gap-2 px-6 py-2 rounded-xl ${rating === 0 ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600'}`}
                >
                  <Send size={16} color={rating === 0 ? "#94a3b8" : "white"} />
                  <Text className={`font-bold ${rating === 0 ? 'text-slate-400' : 'text-white'}`}>Submit Rating</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center">
                <CheckCircle2 size={32} color="#10b981" className="mb-2" />
                <Text className="font-bold text-slate-700 dark:text-slate-300">Thank you for rating!</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-slate-900 dark:bg-white px-8 py-4 rounded-xl w-full items-center shadow-sm"
          >
            <Text className="text-white dark:text-slate-900 font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Active Solve UI
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <LiveActivityTicker activity={currentActivity} />
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
        <ArrowLeft size={24} color={isDark ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>
        <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex-row items-center gap-2">
          <Clock size={16} color={timeLeft <= 10 ? "#dc2626" : "#64748b"} />
          <Text className={`font-bold ${timeLeft <= 10 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View className="bg-amber-100 px-3 py-1.5 rounded-full flex-row items-center gap-1">
          <Zap size={14} color="#d97706" fill="#d97706" />
          <Text className="text-amber-700 font-bold">{question.points || 0}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Render Teacher Info Header */}
        {question?.profiles && (
          <View className="flex-row items-center gap-4 p-4 mb-6 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm">
            {/* Avatar */}
            <View className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center">
              {question.profiles.avatar_url && !question.profiles.avatar_url.includes('googleusercontent') ? (
                <Image source={{ uri: question.profiles.avatar_url }} className="w-full h-full" />
              ) : (
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                  {String(question.profiles.full_name?.[0] || question.profiles.username?.[0] || 'T').toUpperCase()}
                </Text>
              )}
            </View>
            <View className="flex-col justify-center">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                Posted By
              </Text>
              <BadgedName 
                name={question.profiles.full_name || question.profiles.username || "Verified Teacher"}
                userId={question.profiles.id}
                isTeacher={question.profiles.is_teacher}
                nameClassName="font-bold text-base text-slate-800 dark:text-slate-200"
                containerClassName="flex-row items-center gap-1 flex-wrap"
                iconSize={16}
              />
            </View>
          </View>
        )}

        <Text className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{question.title}</Text>
        
        {/* Friends who solved this */}
        {socialPresence?.solvedFriends && socialPresence.solvedFriends.length > 0 && (
          <View className="flex-row items-center mb-4">
            <View className="flex-row -space-x-2 mr-2">
              {socialPresence.solvedFriends.map((friend: any) => (
                <View key={friend.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-950 overflow-hidden bg-slate-200">
                  {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full bg-indigo-100 items-center justify-center">
                      <Text className="text-[8px] font-bold text-indigo-600">{friend.name[0]}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {socialPresence.solvedFriends.length === 1 ? `${socialPresence.solvedFriends[0].name} got this right.` : `${socialPresence.solvedFriends.length} friends got this right.`}
            </Text>
          </View>
        )}
        
        {imageUrl && (
          <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 mb-4"
            resizeMode="contain"
          />
        )}

        {question.body && (
          <Text className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{question.body}</Text>
        )}

        {question.hint && (
          <View className="mb-6">
            {!purchasedHint ? (
              <TouchableOpacity
                onPress={handlePurchaseHint}
                disabled={isPurchasingHint}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Lightbulb size={20} color="#d97706" />
                  <Text className="font-bold text-amber-700 dark:text-amber-400 ml-2">Need a Hint?</Text>
                </View>
                {isPurchasingHint ? (
                  <ActivityIndicator size="small" color="#d97706" />
                ) : (
                  <Text className="text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-md">
                    Cost: 1 Pt
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                <View className="flex-row items-center mb-1">
                  <Lightbulb size={16} color="#d97706" />
                  <Text className="font-bold text-amber-700 dark:text-amber-400 ml-1">Unlocked Hint:</Text>
                </View>
                <Text className="text-amber-900 dark:text-amber-200">{purchasedHint}</Text>
              </View>
            )}
          </View>
        )}

        {question.question_type === 'match' ? (
          <View className="mt-4">
            <MatchArena 
              question={question} 
              onAttempt={(isCorrect) => handleSubmit(-1, isCorrect)} 
              disabled={isSubmitting || !!result}
              isSubmitting={isSubmitting}
            />
          </View>
        ) : question.question_type === 'hotspot' ? (
          <View className="mt-4">
            <HotspotArena
              question={question}
              onAttempt={(isCorrect) => handleSubmit(-1, isCorrect)}
              disabled={isSubmitting || !!result}
              isSubmitting={isSubmitting}
            />
          </View>
        ) : question.question_type === 'india_map' ? (
          <View className="mt-4">
            <IndiaMapArena
              question={question}
              onSubmit={(isCorrect) => handleSubmit(-1, isCorrect)}
              disabled={isSubmitting || !!result}
            />
          </View>
        ) : (
          <View className="space-y-3">
            {question.options?.map((option: string, index: number) => {
              const isSelected = selectedOption === index;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedOption(index)}
                  activeOpacity={0.7}
                  className={`w-full p-4 rounded-2xl border-2 mb-3 flex-row items-center ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <View className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </View>
                  <Text className={`flex-1 text-lg ${isSelected ? 'text-indigo-900 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer Submit */}
      {question.question_type !== 'match' && question.question_type !== 'hotspot' && question.question_type !== 'india_map' && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={selectedOption === null || isSubmitting}
            className={`w-full py-4 rounded-xl items-center flex-row justify-center ${
              selectedOption === null ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`text-lg font-bold ${selectedOption === null ? 'text-slate-500 dark:text-slate-500' : 'text-white'}`}>
                Submit Answer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
