import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabaseClient';
import Animated, { FadeIn, FadeOut, SlideInUp, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { Skull, HelpCircle, XCircle } from 'lucide-react-native';
// Note: If expo-audio has issues, we gracefully fail on audio and continue with animation
import { useAudioPlayer } from 'expo-audio';

// We use a locally generated spooky drone/wind track
const WIND_ASSET = require('../../../assets/sounds/freesound_community-spooky-wind-70657.mp3');

export default function BossFight() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [phase, setPhase] = useState<'entrance' | 'fight' | 'victory' | 'defeat'>('entrance');
  
  // MCQ state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [purchasedHint, setPurchasedHint] = useState<string | false>(false);
  const [hintError, setHintError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio
  let player: any = null;
  try {
    player = useAudioPlayer(WIND_ASSET);
  } catch (e) {
    console.warn("Audio player unavailable", e);
  }

  // Animation values
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    fetchBoss();
    
    // Play Entrance Audio
    if (player) {
      player.loop = true;
      player.play();
    }

    // Start demonic shake
    shakeX.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 50, easing: Easing.linear }),
        withTiming(5, { duration: 50, easing: Easing.linear })
      ),
      -1,
      true
    );
    shakeY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 40, easing: Easing.linear }),
        withTiming(3, { duration: 40, easing: Easing.linear })
      ),
      -1,
      true
    );
    bgOpacity.value = withTiming(0.4, { duration: 2000 });

    // Transition to fight after 4 seconds
    setTimeout(() => {
      setPhase('fight');
      shakeX.value = 0;
      shakeY.value = 0;
      bgOpacity.value = 0;
    }, 4500);

    return () => {
      if (player) player.pause();
    };
  }, []);

  const fetchBoss = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/boss/daily`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseHint = async () => {
    setHintError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      const res = await fetch(`${API_URL}/api/solve/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ questionId: question.id })
      });
      const data = await res.json();
      if (data.error) {
        setHintError(data.error);
      } else {
        setPurchasedHint(data.hint || question.hint);
      }
    } catch (e: any) {
      setHintError(e.message || 'Failed to purchase hint');
    }
  };

  const handleOptionSelect = async (opt: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedOption(opt);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      // Look up the exact index of the selected option to send to the backend
      const optionIndex = question.options.indexOf(opt);
      
      await fetch(`${API_URL}/api/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: optionIndex,
          startedAt: Date.now(),
          timeTaken: 10,
          isBoss: true,
        }),
      });
      
    } catch (e) {
      console.error('Failed to submit boss score:', e);
    } finally {
      setIsSubmitting(false);
      if (opt === question.correct_option) {
        setPhase('victory');
        if (player) player.pause();
      } else {
        setPhase('defeat');
        if (player) player.pause();
      }
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }]
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: 'rgba(225, 29, 72, 1)',
    opacity: bgOpacity.value,
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: -1
  }));

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  // ENTRANCE PHASE
  if (phase === 'entrance') {
    return (
      <Animated.View style={shakeStyle} className="flex-1 bg-slate-950 items-center justify-center">
        <Animated.View style={bgStyle} />
        <Animated.View entering={ZoomIn.duration(3000)} exiting={FadeOut.duration(500)} className="items-center">
          <Skull size={100} color="#f43f5e" />
          <Text className="text-rose-500 text-4xl font-black mt-4 tracking-widest uppercase">
            A BOSS APPEARS
          </Text>
          <Text className="text-rose-900 text-lg font-bold mt-2 italic">
            Prepare yourself...
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }

  // VICTORY PHASE
  if (phase === 'victory') {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center p-6">
        <Animated.View entering={ZoomIn.springify()} className="items-center">
          <Trophy size={80} color="#f59e0b" />
          <Text className="text-amber-400 text-4xl font-black mt-6 tracking-widest text-center">
            BOSS DEFEATED!
          </Text>
          <Text className="text-slate-300 text-lg mt-4 text-center">
            You have slain the beast and claimed the rewards.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            className="mt-12 bg-amber-500 py-4 px-10 rounded-full shadow-lg shadow-amber-500/50"
          >
            <Text className="text-slate-900 font-bold text-lg">Return to Lair</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // DEFEAT PHASE
  if (phase === 'defeat') {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Animated.View entering={FadeIn} className="items-center w-full">
          <XCircle size={80} color="#e11d48" />
          <Text className="text-rose-500 text-4xl font-black mt-6 tracking-widest text-center">
            YOU DIED
          </Text>
          <View className="bg-slate-900 p-6 rounded-2xl w-full mt-8 border border-slate-800">
            <Text className="text-slate-400 text-sm mb-2 uppercase font-bold">The Correct Answer was:</Text>
            <Text className="text-white text-xl font-medium">{question.correct_option}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            className="mt-12 bg-slate-800 border border-rose-900 py-4 px-10 rounded-full"
          >
            <Text className="text-rose-500 font-bold text-lg">Retreat</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // FIGHT PHASE
  return (
    <ScrollView 
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ 
        paddingTop: Math.max(insets.top, 16) + 20, 
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 16
      }}
    >
      <Animated.View entering={SlideInUp.duration(800)}>
        <View className="flex-row items-center justify-between mb-8">
          <View className="bg-rose-100 dark:bg-rose-900/30 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-800/50">
            <Text className="text-rose-600 dark:text-rose-400 font-black text-xs tracking-widest uppercase">
              BOSS FIGHT
            </Text>
          </View>
          <View className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Text className="text-slate-600 dark:text-slate-400 font-bold text-xs">
              {question?.subject || 'Challenge'}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8">
          {question?.body}
        </Text>

        {question?.hint && (
          <View className="mb-8">
            {!purchasedHint ? (
              <TouchableOpacity
                onPress={handlePurchaseHint}
                className="flex-row items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 py-3 px-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 active:scale-95 transition-transform"
              >
                <HelpCircle size={18} color={colorScheme === 'dark' ? '#818cf8' : '#4f46e5'} className="mr-2" />
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold">
                  Purchase Hint (-1 Point)
                </Text>
              </TouchableOpacity>
            ) : (
              <Animated.View entering={FadeIn} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex-row items-center">
                  💡 Hint Unlocked
                </Text>
                <Text className="text-amber-900 dark:text-amber-200 leading-relaxed italic">
                  "{typeof purchasedHint === 'string' ? purchasedHint : question.hint}"
                </Text>
              </Animated.View>
            )}
            {hintError ? <Text className="text-red-500 text-xs mt-2 text-center">{hintError}</Text> : null}
          </View>
        )}

        <View className="gap-3">
          {question?.options?.map((opt: string, i: number) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleOptionSelect(opt)}
              activeOpacity={0.7}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <Text className="text-slate-700 dark:text-slate-200 text-base font-medium">
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
