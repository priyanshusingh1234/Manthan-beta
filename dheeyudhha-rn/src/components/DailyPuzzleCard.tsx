import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Vibration,
} from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { Lightbulb, CheckCircle2, XCircle, Lock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';

export default function DailyPuzzleCard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [puzzle, setPuzzle] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ is_correct: boolean; correct_answer: number; reward: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { fetchPuzzle(); }, []);

  const fetchPuzzle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/puzzle`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setPuzzle(data.puzzle);
      setAttempt(data.attempt);
      if (data.attempt) {
        setResult({
          is_correct: data.attempt.is_correct,
          correct_answer: 5,
          reward: data.attempt.is_correct ? 10 : 0,
        });
      }
    } catch (e) {
      console.error('Puzzle fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const num = parseInt(answer, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      triggerShake();
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/puzzle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: num }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setAttempt({ user_answer: num, is_correct: data.is_correct });
      triggerPop();
      if (data.is_correct) Vibration.vibrate([0, 80, 60, 80]);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerPop = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View className="mx-6 mb-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 items-center">
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  if (!puzzle) return null;

  const alreadyAnswered = !!attempt;

  return (
    <Animated.View
      style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}
      className="mx-6 mb-5 rounded-3xl overflow-hidden"
    >
      <View
        style={{
          backgroundColor: isDark ? '#1e1033' : '#f5f3ff',
          borderWidth: 1,
          borderColor: isDark ? '#4c1d95' : '#ddd6fe',
          borderRadius: 24,
        }}
      >
        {/* Header Strip */}
        <View
          style={{
            backgroundColor: '#7c3aed',
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🧩</Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Daily Puzzle
            </Text>
          </View>
          <View style={{ backgroundColor: '#ffffff22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ color: '#e9d5ff', fontWeight: '800', fontSize: 11 }}>+{puzzle.reward_correct} pts</Text>
          </View>
        </View>

        {/* Body */}
        <View style={{ padding: 18 }}>
          {/* Title */}
          <Text style={{ color: isDark ? '#c4b5fd' : '#6d28d9', fontWeight: '900', fontSize: 15, marginBottom: 10 }}>
            {puzzle.title}
          </Text>

          {/* Question */}
          <Text style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14, fontWeight: '600', lineHeight: 22, marginBottom: 14 }}>
            {puzzle.question}
          </Text>

          {/* Reward Preview — The Crusher Title */}
          {!alreadyAnswered && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: isDark ? '#1a0a0a' : '#fff1f2',
              borderWidth: 1.5, borderColor: '#dc2626',
              borderRadius: 14, padding: 12, marginBottom: 14,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#dc2626',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#dc2626', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
                  Rare Title Reward
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: isDark ? '#fca5a5' : '#991b1b', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
                    The Crusher
                  </Text>
                  <View style={{ backgroundColor: '#dc2626', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>RARE</Text>
                  </View>
                </View>
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '600', marginTop: 1 }}>
                  Answer correctly to unlock this title + 10 pts
                </Text>
              </View>
            </View>
          )}

          {/* Result or Input */}
          {alreadyAnswered ? (
            <View
              style={{
                backgroundColor: result?.is_correct
                  ? (isDark ? '#064e3b' : '#d1fae5')
                  : (isDark ? '#450a0a' : '#fee2e2'),
                borderRadius: 16,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {result?.is_correct
                ? <CheckCircle2 size={22} color="#10b981" />
                : <XCircle size={22} color="#ef4444" />
              }
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontWeight: '900',
                  fontSize: 14,
                  color: result?.is_correct ? '#065f46' : '#991b1b',
                }}>
                  {result?.is_correct ? `Correct! +${result.reward} points 🎉` : `Incorrect. Correct answer: ${result?.correct_answer}`}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                  Your answer: {attempt?.user_answer}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              {/* Hint toggle */}
              <TouchableOpacity
                onPress={() => setShowHint(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, alignSelf: 'flex-start' }}
              >
                <Lightbulb size={14} color="#a78bfa" />
                <Text style={{ color: '#a78bfa', fontWeight: '700', fontSize: 12 }}>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </Text>
              </TouchableOpacity>

              {showHint && (
                <View style={{
                  backgroundColor: isDark ? '#2e1065' : '#ede9fe',
                  borderRadius: 12, padding: 10, marginBottom: 12,
                }}>
                  <Text style={{ color: isDark ? '#c4b5fd' : '#5b21b6', fontSize: 12, fontWeight: '600' }}>
                    💡 {puzzle.hint}
                  </Text>
                </View>
              )}

              {/* Input */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: isDark ? '#0f172a' : '#fff',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: '#7c3aed',
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}>
                  <TextInput
                    value={answer}
                    onChangeText={t => setAnswer(t.replace(/[^0-9]/g, '').slice(0, 2))}
                    placeholder="1–99"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    keyboardType="numeric"
                    maxLength={2}
                    style={{
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      fontWeight: '900',
                      fontSize: 22,
                      textAlign: 'center',
                      paddingVertical: 10,
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || !answer}
                  style={{
                    backgroundColor: !answer ? '#6b7280' : '#7c3aed',
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Submit</Text>
                  }
                </TouchableOpacity>
              </View>

              <Text style={{ color: isDark ? '#475569' : '#94a3b8', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8 }}>
                Enter a whole number between 1 and 99
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
