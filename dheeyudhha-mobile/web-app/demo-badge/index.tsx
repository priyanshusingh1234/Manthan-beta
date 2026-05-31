import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import React from 'react';
import TopperBadge from '@/ticks/topper';
import { Trophy, Star, Award, Zap, ArrowRight, Sparkles } from 'lucide-react-native';

export default function BadgeDemoPage() {
  return (
    <View className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-20 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Decorative background elements */}
      <View className="fixed inset-0 overflow-hidden pointer-events-none">
        <View className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-400/10 dark:bg-amber-500/5 blur-[120px] rounded-full animate-pulse" />
        <View className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </View>

      <View className="max-w-4xl mx-auto relative">
        {/* Header Section */}
        <View className="mb-16 space-y-4 text-center sm:text-left">
          <View className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex-row">
            <Sparkles className="w-3.5 h-3.5" />
            Visual Design Assets
          </View>
          <Text className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
            The <Text className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600">Topper Badge</Text>
          </Text>
          <Text className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            A premium recognition system for the highest achievers in Dheeyudhha. Designed to inspire excellence through cinematic aesthetics and smooth interactions.
          </Text>
        </View>

        <View className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Showcase Section: Main Badge */}
          <View className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <Text className="text-sm font-black uppercase tracking-widest text-slate-400">Master Asset</Text>
            <View className="transform transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6 relative">
               <View className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-150 group-hover:animate-pulse"></View>
               {/* Large version of the badge */}
               <View className="scale-[4] p-4">
                 <TopperBadge />
               </View>
            </View>
            <View className="pt-8 text-center space-y-2">
              <Text className="font-bold text-lg">Multi-layered Gradient</Text>
              <Text className="text-sm text-slate-500">Amber-400 to Amber-800 with White iconography</Text>
            </View>
          </View>

          {/* Context Section: User Profile Preview */}
          <View className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
             <Text className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Live Context</Text>
             
             <View className="space-y-6">
                {/* Profile row mockup */}
                <View className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-row">
                  <View className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-black flex-row">PS</View>
                  <View>
                    <View className="flex items-center gap-2 flex-row">
                      <Text className="font-black text-xl">Priyanshu Singh</Text>
                      <TopperBadge />
                    </View>
                    <Text className="text-sm text-slate-500">Global Rank #1</Text>
                  </View>
                </View>

                {/* Post author mockup */}
                <View className="flex items-center gap-3 flex-row">
                  <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></View>
                  <View className="space-y-1">
                    <View className="flex items-center gap-1.5 flex-row">
                      <Text className="font-bold text-sm">Aditya Verma</Text>
                      <TopperBadge />
                    </View>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Solved 2,450 questions</Text>
                  </View>
                </View>

                <hr className="border-slate-100 dark:border-slate-800" />
                
                <View className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <Text className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                    The badge automatically illuminates and pulses based on hover interactions, ensuring it catches the eye without being intrusive.
                  </Text>
                </View>
             </View>
          </View>

          {/* Cards Section: Variations */}
          <View className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <View className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-amber-400 transition-colors">
              <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4 flex-row">
                <Trophy className="w-5 h-5 text-amber-600" />
              </View>
              <Text className="font-bold mb-1">Rank 1-10</Text>
              <Text className="text-xs text-slate-500 leading-relaxed">Exclusive for the global top decile achievers.</Text>
            </View>

            <View className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 transition-colors">
              <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 flex-row">
                <Star className="w-5 h-5 text-blue-600" />
              </View>
              <Text className="font-bold mb-1">Star Quality</Text>
              <Text className="text-xs text-slate-500 leading-relaxed">Integrated glow system for maximum prestige.</Text>
            </View>

            <View className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-purple-400 transition-colors">
              <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 flex-row">
                <Zap className="w-5 h-5 text-purple-600" />
              </View>
              <Text className="font-bold mb-1">Responsive</Text>
              <Text className="text-xs text-slate-500 leading-relaxed">Perfectly scales from 16px to 256px.</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View className="mt-20 border-t border-slate-100 dark:border-slate-800 pt-10 text-center pb-20">
          <Text className="text-slate-400 text-sm mb-6">Ready to implement across the ecosystem?</Text>
          <View className="flex flex-col sm:flex-row gap-4 justify-center">
            <View className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl flex-row">
              Integrate Badge <ArrowRight className="w-5 h-5" />
            </View>
            <View className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Copy SVG Code
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
