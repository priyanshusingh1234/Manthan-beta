import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ArenaBattleCard({ gauntlet }: { gauntlet: any }) {
  const router = useRouter();

  if (!gauntlet) return null;

  return (
    <View className="bg-white rounded-[2rem] p-5 mb-5 shadow-sm border border-slate-200/60 overflow-hidden">
      <View className="flex-row items-center mb-3 gap-3">
        <View className="w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center">
            <Text className="text-2xl">⚔️</Text>
        </View>
        <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">
            Arena Battle
            </Text>
            <Text className="text-base font-black text-slate-800 leading-tight">
                {gauntlet.title}
            </Text>
        </View>
      </View>
      
      {gauntlet.description && (
        <Text className="text-sm text-slate-500 mb-4 leading-relaxed" numberOfLines={2}>
          {gauntlet.description}
        </Text>
      )}
      
      <View className="flex-row gap-2 mb-4">
        <View className="bg-slate-50 py-2 rounded-xl items-center flex-1">
          <Text className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 tracking-wider">Questions</Text>
          <Text className="text-sm font-black text-slate-700">{gauntlet.question_count} Qs</Text>
        </View>
        <View className="bg-slate-50 py-2 rounded-xl items-center flex-1">
          <Text className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 tracking-wider">Time</Text>
          <Text className="text-sm font-black text-slate-700">{gauntlet.time_minutes} min</Text>
        </View>
        <View className="bg-slate-50 py-2 rounded-xl items-center flex-1">
          <Text className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 tracking-wider">Diff</Text>
          <Text className="text-sm font-black text-slate-700 capitalize">{gauntlet.difficulty || 'Mixed'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.push(`/arena/${gauntlet.slug}`)}
        className="bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center gap-2"
        activeOpacity={0.8}
      >
        <Text className="text-white font-black text-xs uppercase tracking-[0.2em]">Start Practice</Text>
      </TouchableOpacity>
    </View>
  );
}
