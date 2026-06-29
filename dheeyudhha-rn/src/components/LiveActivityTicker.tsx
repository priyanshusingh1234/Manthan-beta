import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

export default function LiveActivityTicker({ activity }: { activity: { message: string, avatar: string | null } | null }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [visible, setVisible] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (activity) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 100 });

      // Hide after 4 seconds
      const timeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 });
        translateY.value = withTiming(-20, { duration: 400 }, (isFinished) => {
          if (isFinished) {
            // Can't run state update directly in worklet
          }
        });
        setTimeout(() => setVisible(false), 400);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [activity]);

  if (!visible || !activity) return null;

  return (
    <Animated.View 
      style={[{ opacity, transform: [{ translateY }] }]}
      className="absolute top-4 left-4 right-4 z-50 items-center justify-center pointer-events-none"
    >
      <View className="flex-row items-center bg-slate-900/90 dark:bg-slate-100/90 px-4 py-2.5 rounded-full shadow-lg shadow-black/20">
        {activity.avatar && (
          <Image 
            source={{ uri: activity.avatar }} 
            className="w-5 h-5 rounded-full mr-2 bg-slate-200" 
          />
        )}
        <Text className="text-white dark:text-slate-900 font-bold text-xs tracking-wide">
          {activity.message}
        </Text>
      </View>
    </Animated.View>
  );
}
