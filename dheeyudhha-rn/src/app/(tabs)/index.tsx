import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import XPBar from '@/components/ui/XPBar';
import AuthButtons from '@/components/ui/AuthButtons';
import BottomBanner from '@/components/ui/BottomBanner';

export default function FeedScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 120 }}>
        
        {/* Placeholder Welcome Card */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <Text className="text-xl font-black text-slate-900 mb-2">Welcome to Dheeyudha!</Text>
          <Text className="text-slate-500 mb-4">Your React Native app is coming together nicely.</Text>
          <AuthButtons />
        </View>

        {/* Progress Card */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <Text className="text-sm font-bold text-slate-400 mb-4 uppercase">Your Progress</Text>
          <XPBar xp={175} />
        </View>
        
        {/* Compact Progress */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <XPBar xp={310} compact />
        </View>

      </ScrollView>

      {/* Floating Bottom Banner */}
      <BottomBanner />
    </View>
  );
}
