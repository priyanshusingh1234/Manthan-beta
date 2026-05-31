import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import React from 'react';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import TeacherBadge from '@/ticks/teacher';

export default function BadgeDemo() {
  return (
    <View className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 flex-row">
      <View className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full border border-slate-100 dark:border-slate-800">
        <Text className="text-4xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Dheeyudha Rank Badges</Text>
        <Text className="text-slate-500 text-center mb-10 font-bold uppercase tracking-widest text-xs">Excellence & Achievement</Text>
        
        <View className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Podium Badges */}
          <View className="space-y-6">
            <Text className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Podium Ranks</Text>
            
            <View className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 flex-row">
              <GoldBadge />
              <View>
                <Text className="font-black text-slate-900 dark:text-white leading-none mb-1">Champion</Text>
                <Text className="text-[10px] text-slate-500 font-bold">Awarded for 1st Rank</Text>
              </View>
            </View>
            
            <View className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 flex-row">
              <SilverBadge />
              <View>
                <Text className="font-black text-slate-900 dark:text-white leading-none mb-1">Elite Challenger</Text>
                <Text className="text-[10px] text-slate-500 font-bold">Awarded for 2nd Rank</Text>
              </View>
            </View>
            
            <View className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 flex-row">
              <BronzeBadge />
              <View>
                <Text className="font-black text-slate-900 dark:text-white leading-none mb-1">Pro Warrior</Text>
                <Text className="text-[10px] text-slate-500 font-bold">Awarded for 3rd Rank</Text>
              </View>
            </View>
          </View>
          
          {/* Special Verification Badges */}
          <View className="space-y-6">
            <Text className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Achievements</Text>
            
            <View className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 flex-row">
              <TopperBadge />
              <View>
                <Text className="font-black text-slate-900 dark:text-white leading-none mb-1">Topper</Text>
                <Text className="text-[10px] text-slate-500 font-bold">1500+ Lifetime Points</Text>
              </View>
            </View>
            
            <View className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 flex-row">
              <TeacherBadge />
              <View>
                <Text className="font-black text-slate-900 dark:text-white leading-none mb-1">Verified Teacher</Text>
                <Text className="text-[10px] text-slate-500 font-bold">Authenticated Educator</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
           <View className="flex justify-center gap-4 flex-row">
              <View className="flex flex-col items-center gap-2">
                 <View className="w-16 h-16 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl">
                    <Image src="https://ui-avatars.com/api/?name=User+One&background=fef3c7&color=d97706" alt="demo" />
                 </View>
                 <View className="flex items-center gap-1 flex-row">
                    <Text className="font-black text-sm text-slate-900 dark:text-white">Topper Demo</Text>
                    <GoldBadge />
                 </View>
              </View>
           </View>
        </View>
      </View>
    </View>
  );
}
