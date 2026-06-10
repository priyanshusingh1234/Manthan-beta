import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Easing, Modal, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { X, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DailyEggDrop() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isEligible, setIsEligible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'flying' | 'landed' | 'cracking' | 'question' | 'done'>('idle');
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  
  const heroX = useRef(new Animated.Value(-100)).current;
  const eggScale = useRef(new Animated.Value(0)).current;
  const eggY = useRef(new Animated.Value(-100)).current;
  const eggRotate = useRef(new Animated.Value(-20)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkEligibility = async () => {
      const now = new Date();
      const hour = now.getHours();
      // Only eligible after 6 PM
      if (hour < 18) return;
      
      const dateStr = now.toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.last_egg_claim_date !== dateStr) {
        setIsEligible(true);
      }
    };
    checkEligibility();
    const interval = setInterval(checkEligibility, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isEligible || phase !== 'idle') return;
    
    // Wait 3s then start the fly-in
    const t = setTimeout(() => {
      setPhase('flying');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      
      Animated.timing(heroX, {
        toValue: SCREEN_WIDTH + 100,
        duration: 3200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => {
        setPhase('landed');
      });

      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.spring(eggY, {
            toValue: SCREEN_HEIGHT * 0.65,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(eggScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(eggRotate, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        // Start glow pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(glowPulse, { toValue: 0.5, duration: 800, useNativeDriver: true })
          ])
        ).start();
      });

    }, 3000);
    return () => clearTimeout(t);
  }, [isEligible, phase]);

  const handleEggTap = async () => {
    if (phase !== 'landed') return;
    setPhase('cracking');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.85, duration: 250, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start();

    // Fetch user class first
    const { data: { user } } = await supabase.auth.getUser();
    let userClass = null;
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('class').eq('id', user.id).single();
      if (profile) userClass = profile.class;
    }

    // Fetch question based on class
    let query = supabase.from('questions').select('id');
    if (userClass) query = query.eq('class_grade', userClass);
    
    let { data: idsData } = await query.limit(500);
    
    // Fallback if no questions for user's class
    if (!idsData || idsData.length === 0) {
      const fallback = await supabase.from('questions').select('id').limit(500);
      idsData = fallback.data;
    }

    if (idsData && idsData.length > 0) {
      const randomId = idsData[Math.floor(Math.random() * idsData.length)].id;
      const { data: qData } = await supabase.from('questions').select('*').eq('id', randomId).single();
      setQuestion(qData);
    }

    setTimeout(() => setPhase('question'), 600);
  };

  const submitAnswer = async (index: number) => {
    if (!question || selectedOption !== null) return;
    setSelectedOption(index);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/daily-egg/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ questionId: question.id, selectedOptionIndex: index })
      });
      
      if (res.ok) {
        const json = await res.json();
        setResult(json.isCorrect ? 'won' : 'lost');
        Haptics.impactAsync(json.isCorrect ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        
        setTimeout(() => {
          dismiss();
        }, 2500);
      } else {
        setResult('lost');
        setTimeout(() => dismiss(), 2000);
      }
    } catch (e) {
      setResult('lost');
      setTimeout(() => dismiss(), 2000);
    }
  };

  const dismiss = () => {
    setPhase('done');
    setIsEligible(false);
  };

  if (!isEligible && phase === 'idle') return null;
  if (phase === 'done') return null;

  const rotateInterpolate = eggRotate.interpolate({
    inputRange: [-20, 0],
    outputRange: ['-20deg', '0deg']
  });

  return (
    <>
      {/* ── Flying man + egg layer ── */}
      {(phase === 'flying' || phase === 'landed') && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 60, pointerEvents: 'box-none' }]}>
          {/* Hero */}
          <Animated.View style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.1, transform: [{ translateX: heroX }] }}>
            <Text style={{ fontSize: 52 }}>🦸‍♂️</Text>
          </Animated.View>

          {/* Egg */}
          <Animated.View 
            style={{ 
              position: 'absolute', 
              left: SCREEN_WIDTH / 2 - 40,
              transform: [{ translateY: eggY }, { scale: eggScale }, { rotate: rotateInterpolate }],
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TouchableOpacity onPress={handleEggTap} activeOpacity={0.8}>
              <Animated.View style={{
                position: 'absolute',
                inset: -20,
                borderRadius: 100,
                backgroundColor: 'rgba(255,215,0,0.6)',
                transform: [{ scale: glowPulse }],
                opacity: glowPulse
              }} />
              <Text style={{ fontSize: 72 }}>🥚</Text>
              {phase === 'landed' && (
                <View className="absolute -bottom-8 bg-black/70 px-3 py-1.5 rounded-full self-center whitespace-nowrap">
                  <Text className="text-white text-xs font-black">👆 Tap me!</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* ── Crack flash ── */}
      {phase === 'cracking' && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 70, backgroundColor: '#fbbf24', opacity: flashOpacity, pointerEvents: 'none' }]} />
      )}

      {/* ── Question sheet ── */}
      <Modal visible={phase === 'question'} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-12 shadow-2xl max-h-[85%]">
            
            {/* Handle bar */}
            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <Text style={{ fontSize: 32 }}>🥚</Text>
                <View>
                  <Text className="font-black text-lg text-slate-900 dark:text-white leading-tight">Daily Egg</Text>
                  <Text className="text-xs font-bold text-emerald-500">
                    +5 correct  •  <Text className="text-red-500">-1 wrong</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={dismiss} className="w-9 h-9 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!question ? (
                <View className="py-16 items-center justify-center gap-3">
                  <ActivityIndicator size="large" color="#eab308" />
                  <Text className="text-sm font-bold text-slate-400">Loading question...</Text>
                </View>
              ) : (
                <View className="space-y-5">
                  <View>
                    <Text className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {question.title}
                    </Text>
                    {question.body ? (
                      <Text className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {question.body}
                      </Text>
                    ) : null}
                  </View>

                  <View className="space-y-2.5 mt-4">
                    {question.options?.map((opt: string, idx: number) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === question.correct_option;
                      const revealed = result !== null;

                      let bgClass = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                      let textClass = 'text-slate-700 dark:text-slate-300';
                      
                      if (revealed) {
                        if (isCorrect) {
                          bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400';
                          textClass = 'text-emerald-800 dark:text-emerald-300';
                        } else if (isSelected) {
                          bgClass = 'bg-red-50 dark:bg-red-900/30 border-red-400';
                          textClass = 'text-red-700 dark:text-red-400';
                        } else {
                          bgClass = 'opacity-40 border-slate-200 dark:border-slate-700';
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={idx}
                          disabled={revealed}
                          onPress={() => submitAnswer(idx)}
                          className={`w-full flex-row px-4 py-3.5 rounded-2xl border-2 mb-2 ${bgClass}`}
                        >
                          <Text className={`font-black mr-2 ${revealed ? textClass : 'text-slate-400 dark:text-slate-500'}`}>
                            {String.fromCharCode(65 + idx)}.
                          </Text>
                          <Text className={`font-semibold text-sm flex-1 ${textClass}`}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {result && (
                    <View className={`mt-4 p-4 rounded-2xl items-center ${result === 'won' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                      <Text className={`font-black text-sm mb-2 ${result === 'won' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                        {result === 'won' ? '🎉 Correct! +5 pts added.' : '💀 Wrong! -1 pt deducted.'}
                      </Text>
                      {question.explanation ? (
                        <View className="w-full mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                          <Text className={`text-[10px] font-black uppercase tracking-wider mb-1 ${result === 'won' ? 'text-emerald-800/70 dark:text-emerald-300/70' : 'text-red-800/70 dark:text-red-300/70'}`}>
                            Explanation
                          </Text>
                          <Text className={`text-xs font-medium ${result === 'won' ? 'text-emerald-800/90 dark:text-emerald-300/90' : 'text-red-800/90 dark:text-red-300/90'}`}>
                            {question.explanation}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
