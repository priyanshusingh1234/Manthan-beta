import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay, runOnJS, Easing } from 'react-native-reanimated';
import { supabase } from '@/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function getIST() { return new Date(Date.now() + 5.5 * 60 * 60 * 1000); }
function todayIST() { return getIST().toISOString().slice(0, 10); }

export default function StreakLostOverlay() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [lostStreak, setLostStreak] = useState(0);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    const checkLostStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const today = todayIST();
        const seenKey = `streak_lost_shown_${today}`;
        const seen = await AsyncStorage.getItem(seenKey);
        if (seen === 'true') return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_count, daily_solve_date, last_streak_count')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) return;

        const yesterday = new Date(getIST().setDate(getIST().getDate() - 1)).toISOString().slice(0, 10);
        const missedDay = profile.daily_solve_date && profile.daily_solve_date !== today && profile.daily_solve_date !== yesterday;
        const streakIsZero = Number(profile.streak_count) === 0;
        const lastStreak = Number(profile.last_streak_count) || 0;

        if ((streakIsZero && lastStreak > 0) || (missedDay && lastStreak > 0)) {
          setLostStreak(lastStreak || 1);
          setVisible(true);
          await AsyncStorage.setItem(seenKey, 'true');

          // Animations
          opacity.value = withTiming(1, { duration: 300 });
          scale.value = withSpring(1, { damping: 10, stiffness: 100 });
          shakeX.value = withDelay(400, 
            withSequence(
              withTiming(15, { duration: 50, easing: Easing.linear }),
              withTiming(-15, { duration: 50, easing: Easing.linear }),
              withTiming(15, { duration: 50, easing: Easing.linear }),
              withTiming(-15, { duration: 50, easing: Easing.linear }),
              withTiming(0, { duration: 50, easing: Easing.linear })
            )
          );
        }
      } catch (e) { console.error(e); }
    };
    
    // Check when component mounts
    checkLostStreak();
  }, []);

  const closeAndStart = () => {
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setVisible)(false);
      runOnJS(router.push)('/');
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)', opacity }]} className="items-center justify-center z-50">
      <Animated.View style={{ transform: [{ scale }, { translateX: shakeX }] }} className="items-center w-full px-8">
        <Text className="text-6xl mb-4">🧊</Text>
        <Text className="text-3xl font-black text-white text-center mb-2">Streak Lost</Text>
        <Text className="text-lg font-bold text-slate-400 text-center mb-8">
          Your {lostStreak}-day{'\n'}streak is gone 💔
        </Text>

        {/* Broken streak display */}
        <View className="items-center justify-center w-48 h-48 rounded-full border-8 border-slate-800 bg-slate-900 shadow-2xl relative mb-12">
          <View className="absolute inset-0 items-center justify-center opacity-20">
            <View className="w-full h-full bg-red-500 rounded-full blur-3xl" />
          </View>
          <View className="items-center justify-center">
            <Text style={{ fontSize: 28 }}>💔</Text>
            <Text className="text-4xl font-black text-red-500 mt-2">{lostStreak}</Text>
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Current streak</Text>
          </View>
          {/* Crack line overlay */}
          <View className="absolute inset-0 items-center justify-center" style={{ transform: [{ rotate: '15deg' }] }}>
            <View className="w-full h-1.5 bg-black" />
          </View>
        </View>

        <TouchableOpacity 
          onPress={closeAndStart}
          activeOpacity={0.8}
          className="w-full bg-white py-4 rounded-2xl items-center shadow-lg shadow-white/20"
        >
          <Text className="text-black font-black text-lg">Start New Streak Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
