import React, { useEffect, useRef } from 'react';
import { View, Animated, ScrollView, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

export default function FeedSkeleton() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const SkeletonCard = () => (
    <Animated.View 
      className={`mx-4 mb-4 rounded-3xl p-5 ${isDark ? 'bg-slate-900' : 'bg-white'} border ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}
      style={{ opacity: fadeAnim }}
    >
      {/* Header Profile Info */}
      <View className="flex-row items-center mb-4">
        <View className={`h-10 w-10 rounded-full mr-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <View className="flex-1">
          <View className={`h-4 w-32 rounded-full mb-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <View className={`h-3 w-20 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </View>
        <View className={`h-6 w-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </View>
      
      {/* Content lines */}
      <View className={`h-5 w-3/4 rounded-full mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <View className={`h-4 w-full rounded-full mb-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <View className={`h-4 w-5/6 rounded-full mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      
      {/* Action Bar */}
      <View className="flex-row justify-between items-center mt-2 border-t pt-3 border-slate-100 dark:border-slate-800/50">
        <View className="flex-row items-center gap-4">
          <View className={`h-6 w-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <View className={`h-6 w-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </View>
        <View className={`h-6 w-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
