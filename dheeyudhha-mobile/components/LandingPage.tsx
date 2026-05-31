import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import {
  Trophy, Zap, Users, Shield, Swords, BrainCircuit,
  ArrowRight, Star, CheckCircle2, Flame, BookOpen,
  Target, TrendingUp, Menu, X
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ── Reusable Native Animation Component ───────────────────────────────────────
const FadeInView = ({ children, delay = 0, style, className, direction = 'up' }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(direction === 'up' ? 30 : direction === 'left' ? 30 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ [direction === 'left' ? 'translateX' : 'translateY']: slideAnim }] },
        style
      ]}
      className={className}
    >
      {children}
    </Animated.View>
  );
};

// ── Animated Counter Hook (React Native Safe) ─────────────────────────────────
function useCounter(end: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration, start]);

  return count;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { emoji: '🔬', label: 'Science', color: 'bg-blue-500' },
  { emoji: '📐', label: 'Maths', color: 'bg-purple-500' },
  { emoji: '🌍', label: 'SST', color: 'bg-teal-500' },
  { emoji: '📖', label: 'English', color: 'bg-orange-500' },
  { emoji: '🇮🇳', label: 'Hindi', color: 'bg-rose-500' },
];

const FEATURES = [
  { icon: Target, label: 'Smart Feed', desc: 'Personalized questions based on your weak areas', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Swords, label: '1v1 Duels', desc: 'Challenge friends in real-time battles', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: Trophy, label: 'Leaderboard', desc: 'Climb the national rank every day', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: BrainCircuit, label: 'AI Gauntlet', desc: 'Adaptive tests that get harder as you improve', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: TrendingUp, label: 'Streak System', desc: 'Daily streaks keep your learning consistent', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Shield, label: 'Verified Teachers', desc: 'All questions curated by certified educators', color: 'text-blue-400', bg: 'bg-blue-500/10' },
];

const TESTIMONIALS = [
  { name: 'Aarav S.', grade: 'Class 10 • Delhi', text: 'Scored 95% in boards after 3 weeks on Dheeyudha. The duels are addictive!', stars: 5 },
  { name: 'Priya M.', grade: 'Class 10 • Mumbai', text: 'Finally a study app that feels like a game. My SST chapter scores doubled.', stars: 5 },
  { name: 'Rohan K.', grade: 'Class 10 • Bangalore', text: 'The AI Gauntlet pushed me harder than my coaching class ever did.', stars: 5 },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  // Trigger counters after a short delay (simulating scroll reach for simple landing pages)
  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const students = useCounter(12400, 1800, statsVisible);
  const questions = useCounter(1200, 1600, statsVisible);
  const duels = useCounter(8900, 2000, statsVisible);

  // Floating animation setup
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloat = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -8, duration: 1500, delay, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])
      ).start();
    };
    createFloat(floatAnim1, 0);
    createFloat(floatAnim2, 800);
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#0a0a0f] text-white flex-row" contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Ambient glows (Simplified for RN) ── */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full opacity-50 blur-3xl" />
      <View className="absolute top-1/3 left-0 w-64 h-64 bg-indigo-600/15 rounded-full opacity-50 blur-3xl" />

      {/* ── Navbar ── */}
      <View className="flex-row items-center justify-between px-5 py-5 z-50">
        {/* Note: NativeWind text gradients require react-native-masked-view. Fallback to solid color here */}
        <Text className="text-2xl font-black tracking-tight text-violet-400">
          Dheeyudha
        </Text>

        <View className="hidden md:flex flex-row items-center gap-6">
          <Link href="/about" asChild><TouchableOpacity><Text className="text-sm font-semibold text-slate-400">About</Text></TouchableOpacity></Link>
          <Link href="/login" asChild><TouchableOpacity><Text className="text-sm font-semibold text-slate-400">Sign In</Text></TouchableOpacity></Link>
          <Link href="/signup" asChild>
            <TouchableOpacity className="px-5 py-2.5 rounded-full bg-violet-600">
              <Text className="text-sm font-black text-white">Join Free →</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity className="md:hidden p-2" onPress={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6 text-slate-400" /> : <Menu className="w-6 h-6 text-slate-400" />}
        </TouchableOpacity>
      </View>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <FadeInView delay={0} className="absolute top-20 left-4 right-4 bg-[#13131a] border border-white/10 rounded-2xl p-3 z-50 shadow-2xl">
          <Link href="/about" asChild><TouchableOpacity className="p-3"><Text className="text-sm font-bold text-slate-300">About</Text></TouchableOpacity></Link>
          <Link href="/login" asChild><TouchableOpacity className="p-3"><Text className="text-sm font-bold text-slate-300">Sign In</Text></TouchableOpacity></Link>
          <Link href="/signup" asChild><TouchableOpacity className="mt-2 p-3 bg-violet-600 rounded-xl items-center"><Text className="text-sm font-black text-white">Join Free →</Text></TouchableOpacity></Link>
        </FadeInView>
      )}

      {/* ── HERO ── */}
      <View className="px-5 pt-12 pb-20 items-center lg:items-start lg:flex-row lg:justify-between lg:px-10 max-w-7xl mx-auto">

        <FadeInView delay={100} direction="up" className="flex-1 items-center lg:items-start w-full flex-row">
          {/* Badge */}
          <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <Text className="text-violet-300 text-xs font-black tracking-wide">#1 Exam Prep Platform for Class 10</Text>
          </View>

          <Text className="text-4xl lg:text-6xl font-black text-white text-center lg:text-left leading-tight mb-6">
            Study Less.{"\n"}
            <Text className="text-violet-400">Score More.</Text>{"\n"}
            Beat Everyone.
          </Text>

          <Text className="text-slate-400 text-base text-center lg:text-left mb-8 max-w-xl">
            Dheeyudha turns boring revision into addictive duels, streaks, and AI-powered quizzes — so you actually want to study every day.
          </Text>

          {/* Subject pills */}
          <View className="flex-row flex-wrap gap-2 justify-center lg:justify-start mb-8">
            {SUBJECTS.map(s => (
              <View key={s.label} className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${s.color}`}>
                <Text className="text-white text-xs font-black shadow-md">{s.emoji} {s.label}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View className="flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/signup" asChild>
              <TouchableOpacity className="flex-row items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-violet-600">
                <Text className="font-black text-base text-white">Start for Free</Text>
                <ArrowRight className="w-5 h-5 text-white" />
              </TouchableOpacity>
            </Link>
            <Link href="/login" asChild>
              <TouchableOpacity className="flex-row items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/5 border border-white/10">
                <Text className="font-bold text-base text-white">I have an account</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text className="mt-4 text-xs text-slate-500 font-medium text-center">✓ Free forever · ✓ No credit card · ✓ Works on phone</Text>
        </FadeInView>

        {/* Right — floating UI mockup */}
        <FadeInView delay={300} direction="left" className="flex-1 w-full max-w-sm mt-16 lg:mt-0 lg:ml-10 flex-row">
          <Animated.View style={{ transform: [{ translateY: floatAnim1 }] }} className="bg-[#13131a] border border-white/10 rounded-3xl p-5 shadow-2xl">
            {/* Mockup Header */}
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-9 h-9 rounded-full bg-violet-500 items-center justify-center"><Text className="text-white font-black">A</Text></View>
              <View className="flex-1 flex-row">
                <Text className="text-sm font-black text-white">Aarav Sharma</Text>
                <Text className="text-xs text-slate-500">Class 10 · Delhi</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-orange-500/15 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <Text className="text-xs font-black text-orange-400">21</Text>
              </View>
            </View>

            {/* Mockup Question Area */}
            <View className="bg-[#0a0a0f] rounded-2xl p-4 mb-3 border border-white/5">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">🔬 Science</Text>
                <Text className="text-xs text-slate-500">60s</Text>
              </View>
              <Text className="text-sm font-semibold text-white mb-3">The functional unit of the kidney is called the:</Text>
              <View className="flex-row flex-wrap gap-2">
                {['Neuron', 'Nephron', 'Alveolus', 'Villus'].map((opt, i) => (
                  <View key={opt} className={`p-2.5 rounded-xl border w-[48%] ${i === 1 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                    <Text className={`text-xs font-bold text-center ${i === 1 ? 'text-emerald-300' : 'text-slate-400'}`}>{opt}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Floating extra UI Cards */}
          <Animated.View style={{ transform: [{ translateY: floatAnim2 }] }} className="absolute -bottom-6 -left-4 bg-[#13131a] border border-rose-500/20 rounded-2xl p-3.5 shadow-xl w-44">
            <View className="flex-row items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-rose-400" />
              <Text className="text-xs font-black text-rose-400">1v1 Duel</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-white">You</Text>
              <Text className="text-[10px] font-black text-slate-500">VS</Text>
              <Text className="text-xs font-bold text-white">Priya M.</Text>
            </View>
          </Animated.View>
        </FadeInView>
      </View>

      {/* ── STATS ── */}
      <FadeInView delay={200} className="px-5 py-10 w-full max-w-7xl mx-auto">
        <View className="flex-row flex-wrap justify-between bg-[#13131a] border border-white/10 rounded-3xl p-6">
          {[
            { value: students, suffix: '+', label: 'Active Students', icon: Users, color: 'text-violet-400' },
            { value: questions, suffix: '+', label: 'Curated Questions', icon: BookOpen, color: 'text-cyan-400' },
            { value: duels, suffix: '+', label: 'Duels Fought', icon: Swords, color: 'text-rose-400' },
          ].map(({ value, suffix, label, icon: Icon, color }) => (
            <View key={label} className="items-center w-1/3 mb-4">
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <Text className={`text-2xl lg:text-4xl font-black ${color}`}>{value.toLocaleString()}{suffix}</Text>
              <Text className="text-xs text-slate-500 font-semibold mt-1">{label}</Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* ── FEATURES ── */}
      <View className="px-5 py-10 max-w-7xl mx-auto">
        <FadeInView delay={100} className="items-center mb-10">
          <Text className="text-2xl lg:text-4xl font-black text-white text-center mb-3">
            Everything you need to <Text className="text-violet-400">top your class</Text>
          </Text>
          <Text className="text-slate-400 text-sm text-center max-w-xl">
            Built specifically for Indian Class 10 students — covering CBSE boards across all 5 subjects.
          </Text>
        </FadeInView>

        <View className="flex-row flex-wrap justify-between">
          {FEATURES.map(({ icon: Icon, label, desc, color, bg }, i) => (
            <FadeInView key={label} delay={i * 100} className="w-full sm:w-[48%] lg:w-[31%] bg-[#13131a] border border-white/10 rounded-2xl p-6 mb-4">
              <View className={`w-11 h-11 rounded-xl ${bg} items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </View>
              <Text className="font-black text-white mb-1.5">{label}</Text>
              <Text className="text-sm text-slate-400 leading-relaxed">{desc}</Text>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* ── TESTIMONIALS ── */}
      <View className="px-5 py-10 max-w-7xl mx-auto">
        <FadeInView className="items-center mb-10">
          <Text className="text-2xl lg:text-4xl font-black text-white text-center">Students love it ❤️</Text>
        </FadeInView>

        <View className="flex-row flex-wrap justify-between">
          {TESTIMONIALS.map(({ name, grade, text, stars }, i) => (
            <FadeInView key={name} delay={i * 150} className="w-full sm:w-[48%] lg:w-[31%] bg-[#13131a] border border-white/10 rounded-2xl p-5 mb-4">
              <View className="flex-row gap-0.5 mb-3">
                {Array.from({ length: stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400" fill="#fbbf24" />)}
              </View>
              <Text className="text-sm text-slate-300 leading-relaxed mb-4">"{text}"</Text>
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-violet-500 items-center justify-center"><Text className="text-xs font-black text-white">{name[0]}</Text></View>
                <View>
                  <Text className="text-xs font-black text-white">{name}</Text>
                  <Text className="text-[10px] text-slate-500">{grade}</Text>
                </View>
              </View>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* ── FINAL CTA ── */}
      <FadeInView delay={300} className="px-5 py-16 max-w-7xl mx-auto w-full">
        <View className="bg-violet-600/20 border border-violet-500/20 rounded-3xl p-10 items-center">
          <Zap className="w-10 h-10 text-violet-400 mb-4" />
          <Text className="text-2xl lg:text-4xl font-black text-white mb-4 text-center">Ready to top your class?</Text>
          <Text className="text-slate-400 text-sm lg:text-lg mb-8 text-center">Join 12,000+ students already practising on Dheeyudha. Free forever — start in seconds.</Text>
          <Link href="/signup" asChild>
            <TouchableOpacity className="flex-row items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600">
              <Text className="font-black text-lg text-white">Create Free Account</Text>
              <ArrowRight className="w-5 h-5 text-white" />
            </TouchableOpacity>
          </Link>
        </View>
      </FadeInView>

      {/* ── FOOTER ── */}
      <View className="border-t border-white/5 px-5 py-8 items-center sm:flex-row sm:justify-between max-w-7xl mx-auto w-full">
        <Text className="text-lg font-black text-violet-400 mb-4 sm:mb-0">Dheeyudha</Text>
        <View className="flex-row gap-5 mb-4 sm:mb-0">
          <Link href="/privacy" asChild><TouchableOpacity><Text className="text-xs text-slate-500">Privacy</Text></TouchableOpacity></Link>
          <Link href="/about" asChild><TouchableOpacity><Text className="text-xs text-slate-500">About</Text></TouchableOpacity></Link>
          <Link href="/contact" asChild><TouchableOpacity><Text className="text-xs text-slate-500">Contact</Text></TouchableOpacity></Link>
        </View>
        <Text className="text-xs text-slate-600">© 2025 Dheeyudha. Made in India 🇮🇳</Text>
      </View>

    </ScrollView>
  );
}