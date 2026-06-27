import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Zap, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

function gradientToColor(color: string): string {
  if (color.includes('indigo')) return '#4f46e5';
  if (color.includes('emerald') || color.includes('teal')) return '#059669';
  if (color.includes('rose') || color.includes('red')) return '#e11d48';
  if (color.includes('violet') || color.includes('fuchsia')) return '#7c3aed';
  if (color.includes('amber') || color.includes('orange')) return '#d97706';
  if (color.includes('sky') || color.includes('blue')) return '#0284c7';
  return '#4f46e5';
}

export default function ArenaFeedCard({ gauntlet }: { gauntlet: any }) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentColor = gauntlet.color ? gradientToColor(gauntlet.color) : '#4f46e5';

  return (
    <View className="mx-3 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm overflow-hidden"
      style={{
        shadowColor: accentColor,
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3
      }}>
      {/* Accent glow top strip */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          backgroundColor: accentColor,
        }}
      />
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-full border border-indigo-100 dark:border-indigo-900/50">
          <Zap size={14} color="#4f46e5" />
          <Text className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">{gauntlet._label || '⚔️ Arena Battle'}</Text>
        </View>
        <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {gauntlet.difficulty} • Class {gauntlet.class_grade}
        </Text>
      </View>

      <Text className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white mb-2">{gauntlet.title}</Text>
      <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4" numberOfLines={2}>{gauntlet.description}</Text>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push(`/arena/${gauntlet.slug}` as any)}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 dark:bg-white active:opacity-80"
        >
          <Play size={16} color={isDark ? '#0f172a' : '#fff'} fill={isDark ? '#0f172a' : '#fff'} />
          <Text className="text-white dark:text-slate-900 font-bold text-sm">Solve Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/arena' as any)}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800"
        >
          <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">See All Arenas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
