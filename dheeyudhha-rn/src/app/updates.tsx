import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, Rocket, Bug } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

const updates = [
  {
    version: 'v1.4.0',
    date: 'Jan 17, 2026',
    title: 'The Virality Update 🔥',
    features: [
      { type: 'new', text: 'Added automated Twitter-style Trending system for viral posts' },
      { type: 'new', text: 'Seeded 10 advanced Competency-Based Math questions for Class 10 (Triangles) with SVG diagrams' },
      { type: 'fix', text: 'Fixed deep linking routes for chat profile modals' },
    ]
  },
  {
    version: 'v1.3.0',
    date: 'Feb 10, 2026',
    title: 'The Competitive Update ⚔️',
    features: [
      { type: 'new', text: 'Introduced live 1v1 Arena Duels' },
      { type: 'new', text: 'Added Daily XP Streaks and Leaderboards' },
      { type: 'improvement', text: 'Massive UI enhancements for dark mode' },
    ]
  },
  {
    version: 'v1.2.0',
    date: 'August 01, 2026',
    title: 'The Customization Update 🎨',
    features: [
      { type: 'new', text: 'Added exclusive "Tiranga" profile titles' },
      { type: 'new', text: 'Added premium Teacher cosmetics and verification badges' },
    ]
  }
];

export default function UpdatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        >
          <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">What's New</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          padding: 20, 
          paddingBottom: Math.max(insets.bottom, 40) 
        }}
      >
        <View className="mb-8">
          <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">App Updates</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Stay up to date with the latest features, improvements, and bug fixes added to Dheeyudhha.
          </Text>
        </View>

        <View className="gap-6 pb-12">
          {updates.map((update, index) => (
            <View key={index} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                  <Text className="text-indigo-700 dark:text-indigo-400 font-bold text-xs">{update.version}</Text>
                </View>
                <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs">{update.date}</Text>
              </View>

              <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">{update.title}</Text>

              <View className="gap-3">
                {update.features.map((feature, fIndex) => (
                  <View key={fIndex} className="flex-row items-start gap-3">
                    <View className={`mt-0.5 p-1.5 rounded-lg ${feature.type === 'new' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        feature.type === 'fix' ? 'bg-rose-100 dark:bg-rose-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                      {feature.type === 'new' ? <Rocket size={14} color={isDarkMode ? '#34d399' : '#10b981'} /> :
                        feature.type === 'fix' ? <Bug size={14} color={isDarkMode ? '#fb7185' : '#f43f5e'} /> :
                          <Sparkles size={14} color={isDarkMode ? '#fbbf24' : '#f59e0b'} />}
                    </View>
                    <Text className="flex-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
