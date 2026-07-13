import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, DeviceEventEmitter, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { PartyPopper, Swords, MessageCircle, Users, CheckCircle, Sparkles, Target, Trophy, Medal, BrainCircuit, ArrowRight } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

const SLIDES = [
  { title: "Welcome to the Arena", desc: "Dheeyudhha is the ultimate peer-to-peer learning platform. Let's show you around!", icon: Sparkles, color: "#4f46e5", bg: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "#4f46e5" },
  { title: "1v1 Duels", desc: "Challenge your friends to rapid-fire battles and prove your knowledge.", icon: Swords, color: "#d97706", bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "#d97706" },
  { title: "Co-op Chat", desc: "Stuck on a question? Tag a friend to jump in and solve it together in real-time.", icon: MessageCircle, color: "#10b981", bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "#10b981" },
  { title: "Leaderboards", desc: "Earn XP, climb the national ranks, and fight for the top spot on the podium.", icon: Trophy, color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "#f59e0b" },
  { title: "Rare Titles", desc: "Unlock and equip exclusive titles like 'The Crusher' to show off on your profile.", icon: Medal, color: "#e11d48", bg: "bg-rose-100 dark:bg-rose-900/30", iconColor: "#e11d48" },
  { title: "Daily Puzzles", desc: "Crack the daily riddle every morning to earn massive XP boosts.", icon: BrainCircuit, color: "#06b6d4", bg: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "#06b6d4" },
  { title: "Your First Mission", desc: "It's time to begin. Your first task is to solve a question from the feed. Good luck!", icon: Target, color: "#8b5cf6", bg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "#8b5cf6" },
];

export default function WelcomeTour() {
  const [step, setStep] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [slideAnim] = useState(new Animated.Value(100)); // For floating banner animation
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    checkTourState();

    const sub = DeviceEventEmitter.addListener('question_solved', () => {
      handleQuestionSolved();
    });

    return () => {
      sub.remove();
    };
  }, []);

  const checkTourState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata || {};
      
      if (!meta.has_completed_onboarding) return;

      const currentStep = meta.welcome_tour_step || 0;
      setUserName(meta.fullName?.split(' ')[0] || meta.username || 'Student');
      setStep(currentStep);

      if (currentStep === 1) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const advanceStep = async (newStep: number) => {
    setStep(newStep);
    if (newStep === 1) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    try {
      await supabase.auth.updateUser({
        data: { welcome_tour_step: newStep }
      });
    } catch (e) {
      console.error("Failed to update tour step", e);
    }
  };

  const handleQuestionSolved = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentStep = user?.user_metadata?.welcome_tour_step;
    if (currentStep === 1 || step === 1) {
      advanceStep(2);
    }
  };

  const handleNextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      advanceStep(1);
    }
  };

  if (step === null || step >= 3) return null;

  const currentSlide = SLIDES[slideIndex];
  const Icon = currentSlide.icon;

  return (
    <>
      {/* Step 0: Welcome Carousel Popup */}
      <Modal visible={step === 0} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center items-center px-6 bg-black/80">
          <View className="bg-white dark:bg-slate-900 w-full rounded-[32px] p-6 shadow-2xl overflow-hidden items-center">
            
            {/* Progress Bar */}
            <View className="flex-row gap-1.5 w-full mb-8 justify-center">
              {SLIDES.map((_, i) => (
                <View 
                  key={i} 
                  className={`h-1.5 rounded-full flex-1 ${i <= slideIndex ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} 
                />
              ))}
            </View>

            {/* Glowing Icon Graphic */}
            <View className="relative mb-8 mt-4">
              <View className={`absolute -inset-8 opacity-20 rounded-full blur-2xl`} style={{ backgroundColor: currentSlide.color }} />
              <View className={`w-28 h-28 rounded-full items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl ${currentSlide.bg}`}>
                <Icon size={48} color={currentSlide.iconColor} />
              </View>
            </View>
            
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight text-center">
              {slideIndex === 0 ? `Hey ${userName}!` : currentSlide.title}
            </Text>
            
            <Text className="text-base text-slate-500 dark:text-slate-400 font-medium mb-8 text-center px-2 min-h-[60px]">
              {currentSlide.desc}
            </Text>

            <TouchableOpacity 
              onPress={handleNextSlide}
              className="w-full bg-indigo-600 py-4 rounded-2xl items-center shadow-lg shadow-indigo-600/30 active:scale-95 flex-row justify-center"
            >
              <Text className="text-white font-black text-base uppercase tracking-widest mr-2">
                {slideIndex === SLIDES.length - 1 ? "Accept Mission" : "Next"}
              </Text>
              {slideIndex !== SLIDES.length - 1 && <ArrowRight size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Step 1: Floating Task Banner */}
      {step === 1 && (
        <Animated.View 
          style={{ 
            transform: [{ translateY: slideAnim }],
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          <View className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 flex-row items-center shadow-2xl border border-indigo-500/30">
            <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center mr-3">
              <Target size={20} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-0.5">Active Task</Text>
              <Text className="text-white font-black text-sm">Solve your first question</Text>
            </View>
            <View className="w-6 h-6 rounded-full border-2 border-slate-600 items-center justify-center" />
          </View>
        </Animated.View>
      )}

      {/* Step 2: Congrats Popup */}
      <Modal visible={step === 2} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center items-center px-6 bg-black/80">
          <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fallSpeed={2500} fadeOut />
          
          <View className="bg-white dark:bg-slate-900 w-full rounded-[32px] p-6 shadow-2xl items-center z-10">
            <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color="#10b981" />
            </View>
            
            <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">
              Task Complete!
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
              You just solved your first question. The arena is yours now. Climb the leagues, help your peers, and never stop learning.
            </Text>

            <TouchableOpacity 
              onPress={() => advanceStep(3)}
              className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <Text className="text-white font-black text-base uppercase tracking-widest">
                Claim Glory
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
