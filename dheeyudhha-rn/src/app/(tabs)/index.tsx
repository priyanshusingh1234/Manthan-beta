import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Trophy, Target, Zap, Play } from 'lucide-react-native';

export default function FeedScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40, paddingTop: 40 }}>
      {/* Top Banner */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider">Welcome Back</Text>
            <Text className="text-2xl font-black text-slate-900">Student</Text>
          </View>
          <View className="bg-indigo-100 p-2 rounded-full">
            <Trophy size={24} color="#4f46e5" />
          </View>
        </View>
      </View>

      {/* Daily Goal Card */}
      <View className="px-6 mb-8">
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Target size={20} color="#f59e0b" />
              <Text className="text-lg font-black text-slate-900">Daily Goal</Text>
            </View>
            <Text className="text-amber-500 font-bold">0 / 50 XP</Text>
          </View>
          
          <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <View className="h-full bg-amber-500" style={{ width: '0%' }} />
          </View>
          
          <TouchableOpacity className="bg-indigo-600 px-4 py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm">
            <Play size={16} color="white" fill="white" />
            <Text className="text-white font-bold">Start Quick Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Duels */}
      <View className="px-6 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-black text-slate-900">Recent Duels</Text>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-bold text-sm">View All</Text>
          </TouchableOpacity>
        </View>
        
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center justify-center py-10">
          <Zap size={32} color="#94a3b8" className="mb-3" />
          <Text className="text-slate-900 font-bold text-center">No Recent Duels</Text>
          <Text className="text-slate-500 text-xs text-center mt-1">Challenge your friends to a 1v1 battle.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
