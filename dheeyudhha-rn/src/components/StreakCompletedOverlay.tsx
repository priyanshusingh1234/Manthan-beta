import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, DeviceEventEmitter } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function StreakCompletedOverlay() {
  const [visible, setVisible] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(50);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('streak_earned', (event) => {
      setStreakCount(event.streak);
      setVisible(true);

      // Reset values
      opacity.value = 0;
      scale.value = 0.5;
      translateY.value = 50;

      // Animate in
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 100 });

      // Animate out after 3 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 });
        translateY.value = withTiming(-50, { duration: 400 }, () => {
          runOnJS(setVisible)(false);
        });
      }, 3000);
    });

    return () => sub.remove();
  }, []);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center z-50">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }, { translateY }] }]}>
        <View className="absolute inset-0 items-center justify-center opacity-30">
          <View className="w-48 h-48 bg-orange-500 rounded-full blur-3xl" />
        </View>
        
        <View className="items-center justify-center relative z-10 p-8">
          <Flame size={80} color="#f97316" fill="#f97316" />
          <Text className="text-3xl font-black text-white mt-4 text-center">Streak{'\n'}Completed! 🔥</Text>
          <Text className="text-orange-200 font-bold mt-2 text-lg text-center">
            {streakCount} Day{streakCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_W * 0.8,
    backgroundColor: '#0f172a',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#f97316',
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  }
});
