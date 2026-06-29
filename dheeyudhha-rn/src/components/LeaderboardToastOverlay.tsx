import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, DeviceEventEmitter } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Trophy, Target } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export default function LeaderboardToastOverlay() {
  const [visible, setVisible] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('leaderboard_event', (data) => {
      setEventData(data);
      setVisible(true);

      // Animate in
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });

      // Animate out after 4 seconds
      setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 400 });
        opacity.value = withTiming(0, { duration: 400 }, () => {
          runOnJS(setVisible)(false);
        });
      }, 4000);
    });

    return () => sub.remove();
  }, []);

  if (!visible || !eventData) return null;

  const isSurpass = eventData.type === 'surpassed';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="z-[100] items-center px-4 pt-12">
      <Animated.View
        style={[
          styles.toastContainer,
          { opacity, transform: [{ translateY }] },
          isSurpass ? { backgroundColor: '#10b981', shadowColor: '#10b981' } : { backgroundColor: '#3b82f6', shadowColor: '#3b82f6' }
        ]}
        className="flex-row items-center px-5 py-3 rounded-full shadow-lg shadow-black/20 w-full max-w-sm"
      >
        <View className="mr-3 bg-white/20 p-2 rounded-full">
          {isSurpass ? <Trophy size={20} color="#fff" /> : <Target size={20} color="#fff" />}
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-sm uppercase tracking-wider mb-0.5">
            {isSurpass ? 'Leaderboard Overtake!' : 'Closing In!'}
          </Text>
          <Text className="text-white/90 font-medium text-xs">
            {isSurpass 
              ? `You just surpassed ${eventData.target}! 🚀` 
              : `You are only ${eventData.points} points away from ${eventData.target}!`}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 10,
  }
});
