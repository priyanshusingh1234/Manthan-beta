import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Shield, Target, Zap, ShieldAlert } from 'lucide-react-native';

export default function ArenaScreen() {
  const [loading, setLoading] = React.useState(false); // Using static UI for now to test layout
  const [hasNoSchool, setHasNoSchool] = React.useState(false); // Mocking state for UI test

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (hasNoSchool) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50">
        <ShieldAlert size={64} color="#ef4444" className="mb-4" />
        <Text className="text-2xl font-black text-slate-900 mb-2">Neutral Territory</Text>
        <Text className="text-slate-500 text-center mb-8">
          The War Room is reserved for schools. You must list your faction before you can scout rivals.
        </Text>
        <TouchableOpacity className="bg-indigo-600 px-6 py-4 rounded-xl w-full items-center">
          <Text className="text-white font-black">ENLIST IN A SCHOOL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-6 py-8 pb-4">
        <Text className="text-3xl font-black text-red-600">WAR ROOM</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-slate-900 text-xs font-bold uppercase tracking-wider">Delhi Public School</Text>
          <View className="w-1 h-1 rounded-full bg-slate-400" />
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">0 POWER</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-y border-slate-100">
        <View className="bg-slate-100 px-4 py-2.5 rounded-xl">
          <Text className="text-slate-700 font-semibold">5v5 (Need 5)</Text>
        </View>
        <TouchableOpacity className="bg-red-600 px-5 py-2.5 rounded-xl flex-row items-center gap-2 shadow-sm">
          <Target size={16} color="white" />
          <Text className="text-white font-bold text-sm">Declare 5v5</Text>
        </TouchableOpacity>
      </View>

      {/* Elite Squad Section */}
      <View className="px-6 mt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <View className="flex-row items-center gap-2">
                <Shield size={24} color="#6366f1" />
                <Text className="text-2xl font-black text-slate-900">Elite Squad</Text>
              </View>
              <Text className="text-slate-500 text-xs mt-1">Your 30-member war squad.</Text>
            </View>
            <View className="bg-indigo-50 px-3 py-1.5 rounded-full">
              <Text className="text-indigo-600 text-[10px] font-bold">1/30 RECRUITED</Text>
            </View>
          </View>

          {/* Squad Members Placeholder */}
          <View className="gap-3">
            <TouchableOpacity className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center">
                  <Text className="text-white font-black">Y</Text>
                </View>
                <View>
                  <Text className="text-slate-900 font-bold">You</Text>
                  <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">General</Text>
                </View>
              </View>
              <Text className="text-indigo-600 font-mono font-bold bg-indigo-100 px-2 py-1 rounded">0 pts</Text>
            </TouchableOpacity>

            <View className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 items-center justify-center py-6">
              <Text className="text-slate-400 font-bold">Draft Soldier</Text>
              <Text className="text-slate-400 text-[10px] uppercase tracking-wider mt-1">Unfilled Position</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Active Conflicts */}
      <View className="px-6 mt-8">
        <Text className="text-lg font-black text-slate-900 mb-4 uppercase tracking-wider">Active Deployments</Text>
        <View className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 items-center justify-center">
          <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mb-3">
            <Zap size={24} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 font-bold text-center">Peacetime Maintained</Text>
          <Text className="text-slate-500 text-xs text-center mt-1">No rival schools have challenged you recently.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
