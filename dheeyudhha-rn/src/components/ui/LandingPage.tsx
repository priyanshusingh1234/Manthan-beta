import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Trophy, Zap, Users, Shield, Swords, BrainCircuit, ArrowRight, Flame, BookOpen, Target, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const SUBJECTS = [
  { emoji: '🔬', label: 'Science', bg: 'bg-blue-500' },
  { emoji: '📐', label: 'Maths', bg: 'bg-purple-500' },
  { emoji: '🌍', label: 'SST', bg: 'bg-emerald-500' },
  { emoji: '📖', label: 'English', bg: 'bg-orange-500' },
  { emoji: '🇮🇳', label: 'Hindi', bg: 'bg-rose-500' },
];

const FEATURES = [
  { icon: Target, label: 'Smart Feed', desc: 'Personalized questions based on your weak areas', color: '#a78bfa' },
  { icon: Swords, label: '1v1 Duels', desc: 'Challenge friends in real-time battles', color: '#fb7185' },
  { icon: Trophy, label: 'Leaderboard', desc: 'Climb the national rank every day', color: '#fbbf24' },
  { icon: BrainCircuit, label: 'AI Gauntlet', desc: 'Adaptive tests that get harder as you improve', color: '#22d3ee' },
  { icon: TrendingUp, label: 'Streak System', desc: 'Daily streaks keep your learning consistent', color: '#34d399' },
  { icon: Shield, label: 'Verified Teachers', desc: 'All questions curated by certified educators', color: '#60a5fa' },
];

// Replaced FloatingElement with Lottie

export default function LandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-[#0a0a0f]" contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top }}>
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-5">
        <Text className="text-2xl font-black text-violet-400">Dheeyudha</Text>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text className="text-slate-300 font-bold">Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Hero Section */}
      <View className="px-6 pt-8 pb-10">
        <Animated.View entering={FadeInUp.duration(600).delay(100)}>
          <View className="flex-row items-center bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full self-start mb-6">
            <Flame size={14} color="#fb923c" className="mr-2" />
            <Text className="text-violet-300 text-xs font-black">#1 Exam Prep Platform for Class 10</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700).delay(200)}>
          <Text className="text-4xl font-black text-white leading-tight mb-6">
            Study Less.{'\n'}
            <Text className="text-violet-400">Score More.</Text>{'\n'}
            Beat Everyone.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700).delay(300)}>
          <Text className="text-slate-400 text-base leading-relaxed mb-8">
            Dheeyudha turns boring revision into addictive duels, streaks, and AI-powered quizzes — so you actually want to study every day.
          </Text>
        </Animated.View>

        {/* Subjects */}
        <Animated.View entering={FadeInUp.duration(700).delay(400)}>
          <View className="flex-row flex-wrap gap-2 mb-10">
            {SUBJECTS.map(s => (
              <View key={s.label} className={`flex-row items-center px-3 py-1.5 rounded-full ${s.bg}`}>
                <Text className="text-white text-xs font-black">{s.emoji} {s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInUp.duration(700).delay(500)}>
          <TouchableOpacity 
            className="bg-violet-600 rounded-2xl py-4 flex-row items-center justify-center mb-4"
            onPress={() => router.push('/signup')}
          >
            <Text className="text-white font-black text-base mr-2">Start for Free</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-white/5 border border-white/10 rounded-2xl py-4 flex-row items-center justify-center"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-base">I have an account</Text>
          </TouchableOpacity>

          <Text className="text-slate-500 text-xs text-center mt-6">
            ✓ Free forever  ·  ✓ No credit card  ·  ✓ Works on phone
          </Text>
        </Animated.View>
      </View>

      {/* Lottie Hero Animation */}
      <Animated.View entering={FadeInRight.duration(800).delay(700)} className="px-6 py-6 items-center">
        <View className="w-full max-w-sm aspect-square bg-[#13131a] border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/10 items-center justify-center relative">
          
          <LottieView
            source={require('../../../assets/hero-animation.json')}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />

          {/* Decorative overlay text */}
          <View className="absolute bottom-6 bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <Text className="text-white text-xs font-black tracking-widest uppercase">
              Next-Gen Learning
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Stats */}
      <View className="px-6 py-6">
        <Animated.View entering={FadeInUp.duration(600).delay(200)}>
          <View className="bg-[#13131a] border border-white/10 rounded-3xl p-6 flex-row justify-between">
            <View className="items-center flex-1">
              <Users size={24} color="#a78bfa" className="mb-2" />
              <Text className="text-xl font-black text-violet-400">12K+</Text>
              <Text className="text-[10px] text-slate-500 font-semibold mt-1 text-center">Active Students</Text>
            </View>
            <View className="items-center flex-1">
              <BookOpen size={24} color="#22d3ee" className="mb-2" />
              <Text className="text-xl font-black text-cyan-400">1K+</Text>
              <Text className="text-[10px] text-slate-500 font-semibold mt-1 text-center">Curated Questions</Text>
            </View>
            <View className="items-center flex-1">
              <Swords size={24} color="#fb7185" className="mb-2" />
              <Text className="text-xl font-black text-rose-400">8K+</Text>
              <Text className="text-[10px] text-slate-500 font-semibold mt-1 text-center">Duels Fought</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Features */}
      <View className="px-6 py-10">
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text className="text-2xl font-black text-white text-center mb-2">
            Everything you need to <Text className="text-violet-400">top your class</Text>
          </Text>
          <Text className="text-slate-400 text-sm text-center mb-10">
            Built specifically for Indian Class 10 students.
          </Text>
        </Animated.View>

        <View className="gap-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Animated.View key={i} entering={FadeInUp.duration(500).delay(i * 100)}>
                <View className="bg-[#13131a] border border-white/10 rounded-2xl p-6">
                  <View className="w-12 h-12 rounded-xl bg-white/5 items-center justify-center mb-4">
                    <Icon size={24} color={feature.color} />
                  </View>
                  <Text className="font-black text-white mb-2">{feature.label}</Text>
                  <Text className="text-sm text-slate-400 leading-relaxed">{feature.desc}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Footer CTA */}
      <View className="px-6 py-10">
        <Animated.View entering={FadeInUp.duration(600)}>
          <View className="bg-[#13131a] border border-violet-500/30 rounded-3xl p-8 items-center">
            <Zap size={40} color="#a78bfa" className="mb-4" />
            <Text className="text-2xl font-black text-white text-center mb-4">Ready to top your class?</Text>
            <Text className="text-slate-400 text-sm text-center mb-8">
              Join 12,000+ students already practising on Dheeyudha. Free forever — start in seconds.
            </Text>
            <TouchableOpacity 
              className="w-full bg-violet-600 rounded-2xl py-4 flex-row items-center justify-center mb-4"
              onPress={() => router.push('/signup')}
            >
              <Text className="text-white font-black text-base mr-2">Create Free Account</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

    </ScrollView>
  );
}
