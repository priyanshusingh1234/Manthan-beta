import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Lock, ChevronRight, BookOpen, ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const CHAPTERS = [
  {
    id: 'nationalism-europe',
    title: 'Rise of Nationalism in Europe',
    subject: 'History · Chapter 1',
    grade: 'Class 10',
    emoji: '⚔️',
    color: '#6366f1',
    acts: 9,
    battles: 1,
    unlocked: true,
    description: 'Master the story from the French Revolution to Bismarck.',
  },
  {
    id: 'french-revolution',
    title: 'The French Revolution',
    subject: 'History · Chapter 1',
    grade: 'Class 9',
    emoji: '⚔️',
    color: '#8b5cf6',
    acts: 6,
    battles: 1,
    unlocked: true,
    description: 'Master the story of the fall of the Bourbon monarchy.',
  },
  {
    id: 'nationalism-india',
    title: 'Nationalism in India',
    subject: 'History · Chapter 2',
    grade: 'Class 10',
    emoji: '🇮🇳',
    color: '#f59e0b',
    acts: 9,
    battles: 1,
    unlocked: true,
    description: 'Master the story from the Rowlatt Act to the Dandi March.',
  },
  {
    id: 'real-numbers',
    title: 'Real Numbers',
    subject: 'Math · Chapter 1',
    grade: 'Class 10',
    emoji: '🔢',
    color: '#0ea5e9',
    acts: 4,
    battles: 1,
    unlocked: true,
    description: 'Master prime factorizations, HCF, LCM, and irrational numbers.',
  },
  {
    id: 'making-global-world',
    title: 'The Making of a Global World',
    subject: 'History · Chapter 3',
    grade: 'Class 10',
    emoji: '🌍',
    color: '#10b981',
    acts: 6,
    battles: 1,
    unlocked: false,
    description: 'Coming soon — Trade, colonialism, and the Great Depression.',
  },
];

export default function GauntletIndexScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Chapter Gauntlets',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }} 
              className="mr-4"
            >
              <ChevronLeft size={24} color={isDark ? '#cbd5e1' : '#0f172a'} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
          headerTintColor: isDark ? '#cbd5e1' : '#0f172a',
        }}
      />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Intro */}
        <View className="items-center mb-8 px-4 text-center">
          <Text className="text-5xl mb-3 drop-shadow-md">🎓</Text>
          <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight text-center">Chapter Gauntlets</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 text-center leading-relaxed max-w-[280px]">
            The ultimate competitive study modules. Read deep narrative notes and survive the final boss exams.
          </Text>
        </View>

        {/* Chapter Cards List */}
        <View className="space-y-4">
          {CHAPTERS.map((ch) => {
            if (ch.unlocked) {
              return (
                <TouchableOpacity
                  key={ch.id}
                  onPress={() => router.push({ pathname: '/gauntlet/[chapterId]', params: { chapterId: ch.id } } as any)}
                  activeOpacity={0.7}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4"
                  style={{
                    borderBottomWidth: 6,
                    borderBottomColor: ch.color,
                  }}
                >
                  <View className="flex-row items-start">
                    {/* Emoji Container */}
                    <View className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 mr-4 justify-center items-center">
                      <Text className="text-3xl">{ch.emoji}</Text>
                    </View>
                    
                    {/* Chapter details */}
                    <View className="flex-1">
                      <View className="flex-row mb-1.5">
                        <Text 
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: ch.color, backgroundColor: ch.color + '22' }}
                        >
                          {ch.grade} · {ch.subject}
                        </Text>
                      </View>
                      <Text className="text-base font-black text-slate-800 dark:text-slate-100 leading-snug mb-1">{ch.title}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">{ch.description}</Text>

                      {/* Stats Row */}
                      <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <View className="flex-row gap-4">
                          <View className="flex-row items-center">
                            <BookOpen size={14} color={isDark ? '#94a3b8' : '#64748b'} className="mr-1" />
                            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">{ch.acts} Levels</Text>
                          </View>
                          <View className="flex-row items-center">
                            <Text className="text-xs font-bold text-rose-500">💀 {ch.battles} Boss</Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center">
                          <Text className="text-xs font-black mr-0.5" style={{ color: ch.color }}>Start</Text>
                          <ChevronRight size={14} color={ch.color} />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            } else {
              return (
                <View
                  key={ch.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 p-5 opacity-60 mb-4"
                >
                  <View className="flex-row items-start">
                    {/* Grayscale Emoji */}
                    <View className="bg-slate-200/50 dark:bg-slate-800/50 p-3 rounded-2xl mr-4 justify-center items-center">
                      <Text className="text-3xl opacity-50">{ch.emoji}</Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">
                        {ch.grade} · {ch.subject}
                      </Text>
                      <Text className="text-base font-black text-slate-400 dark:text-slate-500 leading-snug mb-1">{ch.title}</Text>
                      <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-3">{ch.description}</Text>
                      <View className="flex-row items-center pt-3 border-t border-slate-200/50 dark:border-slate-800">
                        <Lock size={12} color={isDark ? '#64748b' : '#94a3b8'} className="mr-1" />
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">Coming Soon</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }
          })}
        </View>
      </ScrollView>
    </View>
  );
}

