import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, DeviceEventEmitter } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { PartyPopper, Swords, MessageCircle, Users, CheckCircle, Sparkles, Target } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function WelcomeTour() {
  const [step, setStep] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [slideAnim] = useState(new Animated.Value(100)); // For floating banner animation

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
      
      // If onboarding is not complete, don't show the tour yet.
      // The CompleteProfileModal will handle onboarding. We only show tour after onboarding.
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
    // Re-check user state to ensure we are actually on step 1
    const { data: { user } } = await supabase.auth.getUser();
    const currentStep = user?.user_metadata?.welcome_tour_step;
    if (currentStep === 1 || step === 1) {
      advanceStep(2);
    }
  };

  if (step === null || step >= 3) return null; // 3 means fully completed and dismissed

  return (
    <>
      {/* Step 0: Welcome Popup */}
      <Modal visible={step === 0} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center items-center px-6 bg-black/60">
          <View className="bg-white dark:bg-slate-900 w-full rounded-[32px] p-6 shadow-2xl overflow-hidden">
            <View className="absolute -top-10 -right-10 opacity-10">
              <Sparkles size={120} color="#4f46e5" />
            </View>
            
            <View className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl items-center justify-center mb-6">
              <PartyPopper size={32} color="#4f46e5" />
            </View>
            
            <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              Hey {userName}! 👋
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 font-medium mb-8">
              Welcome to Dheeyudhha, the ultimate arena for peer-to-peer learning.
            </Text>

            <View className="space-y-5 mb-8">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl items-center justify-center">
                  <Swords size={20} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 dark:text-white text-base">Challenge Friends</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Duel on questions and prove your skills.</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl items-center justify-center">
                  <MessageCircle size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 dark:text-white text-base">Chat & Collaborate</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Discuss solutions in real-time co-op.</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center">
                  <Users size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 dark:text-white text-base">Follow & Post</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Build your network and share knowledge.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => advanceStep(1)}
              className="w-full bg-indigo-600 py-4 rounded-2xl items-center shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Text className="text-white font-black text-base uppercase tracking-widest">
                Start My Journey
              </Text>
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
            zIndex: 9999, // High z-index to appear over feed
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
        <View className="flex-1 justify-center items-center px-6 bg-black/70">
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
              onPress={() => advanceStep(3)} // 3 means done
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
