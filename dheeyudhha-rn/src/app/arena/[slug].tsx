import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  Minus,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Share2,
  ArrowLeft,
  ShieldAlert,
  Play,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

// ─── Types ───────────────────────────────────────────────────────────────────
type Question = {
  id: string;
  title: string;
  options: string[];
  correct_option: number;
  subject: string;
};

type Gauntlet = {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  class_grade: string | null;
  difficulty: string;
  question_count: number;
  time_minutes: number;
  color: string;
  reward: string;
  custom_questions?: Question[];
};

type AttemptSnapshot = {
  questionId: string;
  title: string;
  options: string[];
  correct_option: number;
  isCorrect: boolean;
  selectedOption: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gradientToColor(color: string): string {
  if (color.includes('indigo')) return '#4f46e5';
  if (color.includes('emerald') || color.includes('teal')) return '#059669';
  if (color.includes('rose') || color.includes('red')) return '#e11d48';
  if (color.includes('violet') || color.includes('fuchsia')) return '#7c3aed';
  if (color.includes('amber') || color.includes('orange')) return '#d97706';
  if (color.includes('sky') || color.includes('blue')) return '#0284c7';
  return '#4f46e5';
}

// ─── Question Breakdown Component ────────────────────────────────────────────
function QuestionBreakdown({ snapshot, isDark }: { snapshot: AttemptSnapshot[]; isDark: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!snapshot.length) return null;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden mb-4">
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <BarChart3 size={18} color="#6366f1" />
        <Text className="font-black uppercase tracking-widest text-xs text-slate-700 dark:text-slate-200 ml-1">
          Full Question Breakdown
        </Text>
      </View>
      {snapshot.map((q, idx) => {
        const hasAnswer = q.selectedOption !== null && q.selectedOption !== undefined;
        const isOpen = expanded === idx;
        const statusColor = q.isCorrect ? '#10b981' : !hasAnswer ? '#94a3b8' : '#ef4444';

        return (
          <View key={idx} className="border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity
              onPress={() => setExpanded(isOpen ? null : idx)}
              className="flex-row items-center gap-3 px-4 py-4"
              activeOpacity={0.7}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, flexShrink: 0 }} />
              <View className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center flex-shrink-0">
                <Text className="font-black text-[10px] text-slate-500">{idx + 1}</Text>
              </View>
              <Text
                className="flex-1 text-xs font-medium leading-snug text-slate-700 dark:text-slate-300"
                numberOfLines={2}
              >
                {q.title}
              </Text>
              <View className="flex-row items-center gap-1.5 flex-shrink-0">
                {q.isCorrect
                  ? <CheckCircle2 size={14} color="#10b981" />
                  : !hasAnswer
                    ? <Minus size={14} color="#94a3b8" />
                    : <XCircle size={14} color="#ef4444" />
                }
                {isOpen
                  ? <ChevronUp size={14} color="#94a3b8" />
                  : <ChevronDown size={14} color="#94a3b8" />
                }
              </View>
            </TouchableOpacity>

            {isOpen && (
              <View className="px-4 pb-4 gap-2">
                {(q.options || []).map((opt, oIdx) => {
                  const isCorrectOpt = oIdx === q.correct_option;
                  const isSelectedOpt = oIdx === q.selectedOption;
                  const isWrong = isSelectedOpt && !isCorrectOpt;

                  let bgColor = isDark ? '#1e293b' : '#f8fafc';
                  let borderColor = isDark ? '#334155' : '#e2e8f0';
                  let textColor = isDark ? '#94a3b8' : '#64748b';
                  let circleBg = isDark ? '#334155' : '#e2e8f0';
                  let circleText = isDark ? '#94a3b8' : '#64748b';

                  if (isCorrectOpt) {
                    bgColor = isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5';
                    borderColor = '#10b981';
                    textColor = isDark ? '#34d399' : '#065f46';
                    circleBg = '#10b981';
                    circleText = '#fff';
                  } else if (isWrong) {
                    bgColor = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2';
                    borderColor = '#ef4444';
                    textColor = isDark ? '#f87171' : '#991b1b';
                    circleBg = '#ef4444';
                    circleText = '#fff';
                  }

                  return (
                    <View
                      key={oIdx}
                      className="flex-row items-center gap-3 p-3 rounded-xl border"
                      style={{ backgroundColor: bgColor, borderColor }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: circleBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ color: circleText, fontSize: 10, fontWeight: '900' }}>
                          {String.fromCharCode(65 + oIdx)}
                        </Text>
                      </View>
                      <Text className="flex-1 text-xs leading-snug" style={{ color: textColor }}>{opt}</Text>
                      {isCorrectOpt && <CheckCircle2 size={14} color="#10b981" />}
                      {isWrong && <XCircle size={14} color="#ef4444" />}
                    </View>
                  );
                })}
                {!hasAnswer && (
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 pt-1">— Not attempted</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Leaderboard Component ────────────────────────────────────────────────────
function GauntletLeaderboard({ slug, isDark }: { slug: string; isDark: boolean }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Direct Supabase query — join test_results with profiles
        const { data } = await supabase
          .from('test_results')
          .select('score, max_score, accuracy, time_taken, user_id, profiles(full_name, username, avatar_url)')
          .eq('test_id', slug)
          .order('score', { ascending: false })
          .order('time_taken', { ascending: true })
          .limit(20);
        setEntries(data || []);
      } catch (e) {
        console.error('Leaderboard error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <ActivityIndicator color="#4f46e5" className="my-4" />;
  if (!entries.length) return (
    <Text className="text-center text-xs text-slate-400 font-bold py-6 uppercase tracking-widest">
      No submissions yet — be first!
    </Text>
  );

  return (
    <View className="gap-2">
      {entries.map((e, i) => {
        const profile = (e.profiles as any) || {};
        const name = profile.full_name || profile.username || 'Anonymous';
        const pct = e.max_score > 0 ? Math.round((e.score / e.max_score) * 100) : 0;
        const mins = Math.floor((e.time_taken || 0) / 60);
        const secs = (e.time_taken || 0) % 60;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

        return (
          <View
            key={i}
            className="flex-row items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
          >
            <View className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 items-center justify-center flex-shrink-0">
              {medal
                ? <Text style={{ fontSize: 16 }}>{medal}</Text>
                : <Text className="font-black text-xs text-slate-500">#{i + 1}</Text>
              }
            </View>
            <View className="flex-1">
              <Text className="font-black text-xs text-slate-800 dark:text-slate-200" numberOfLines={1}>{name}</Text>
              <Text className="text-[10px] text-slate-400 font-bold">{mins}m {secs}s</Text>
            </View>
            <View className="items-end">
              <Text className="font-black text-sm text-indigo-600 dark:text-indigo-400">{e.score}</Text>
              <Text className="text-[10px] text-slate-400 font-bold">{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ArenaGauntletScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine if view-only mode
  const view = useLocalSearchParams<{ view?: string }>().view;
  const viewOnly = view === 'records';

  const [gauntlet, setGauntlet] = useState<Gauntlet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [snapshot, setSnapshot] = useState<AttemptSnapshot[]>([]);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);

  const accentColor = gauntlet ? gradientToColor(gauntlet.color) : '#4f46e5';

  // ── Init ──
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        // 1. Load gauntlet metadata — direct Supabase call
        const { data: found, error: gErr } = await supabase
          .from('gauntlets')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (gErr || !found) throw new Error('Gauntlet not found.');
        setGauntlet(found);
        setTimeLeft(found.time_minutes * 60);

        const { data: { user } } = await supabase.auth.getUser();

        // 2. View-only: fetch existing result
        if (viewOnly) {
          if (user) {
            const { data: result } = await supabase
              .from('test_results')
              .select('*')
              .eq('user_id', user.id)
              .eq('test_id', found.slug)
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (result) {
              setDbResult(result);
              const snap = result.metadata?.answers_snapshot || [];
              setSnapshot(snap);
            }
          }
          setIsSubmitted(true);
          setLoading(false);
          return;
        }

        // 3. Must be logged in to attempt
        if (!user) throw new Error('You must be logged in to take a Gauntlet.');

        // 4. Check for existing submission — direct Supabase call
        const { data: existing } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', user.id)
          .eq('test_id', found.slug)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setDbResult(existing);
          const snap: AttemptSnapshot[] = existing.metadata?.answers_snapshot || [];
          setSnapshot(snap);
          setCorrectCount(snap.filter((s: AttemptSnapshot) => s.isCorrect).length);
          setTimeTaken(existing.time_taken || 0);
          setIsSubmitted(true);
          setLoading(false);
          return;
        }

        // 5. Fresh attempt — use custom questions or fetch from DB
        if (found.custom_questions && Array.isArray(found.custom_questions) && found.custom_questions.length > 0) {
          setQuestions(found.custom_questions);
          setLoading(false);
          return;
        }

        // 6. Fetch questions directly from Supabase — no external API!
        let query = supabase
          .from('questions')
          .select('id, title, options, correct_option, subject')
          .ilike('difficulty', found.difficulty)
          .not('options', 'is', null)
          .limit(200);

        if (found.class_grade) query = query.ilike('class_grade', found.class_grade) as any;
        if (found.subject) query = query.ilike('subject', `%${found.subject}%`) as any;

        const { data: qData, error: qErr } = await query;
        if (qErr) throw qErr;

        const valid = (qData || []).filter((q: any) => Array.isArray(q.options) && q.options.length >= 2);
        // Fisher-Yates shuffle
        for (let i = valid.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [valid[i], valid[j]] = [valid[j], valid[i]];
        }
        const selected = valid.slice(0, found.question_count);
        if (!selected.length) throw new Error('Not enough questions found. Please contact admin.');
        setQuestions(selected);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, viewOnly]);

  // ── Timer ──
  useEffect(() => {
    if (loading || isSubmitted || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, isSubmitted]);

  const handleSelectOption = (optIndex: number) =>
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));

  // ── Submit — uses Supabase RPC, no external URL ──
  const handleSubmit = useCallback(async () => {
    if (!gauntlet || !questions.length || submitting) return;
    setSubmitting(true);
    const elapsed = (gauntlet.time_minutes * 60) - timeLeft;
    setTimeTaken(elapsed);

    let correct = 0;
    const attempts: AttemptSnapshot[] = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correct_option;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        title: q.title,
        options: q.options,
        correct_option: q.correct_option,
        isCorrect,
        selectedOption: answers[idx] ?? null,
      };
    });
    setCorrectCount(correct);
    setSnapshot(attempts);

    const score = correct * 3;
    const maxScore = questions.length * 3;
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    try {
      // Call SECURITY DEFINER RPC — no admin SDK or external URL needed
      const { data: result, error: rpcErr } = await supabase.rpc('submit_gauntlet', {
        p_test_id: gauntlet.slug,
        p_answers: attempts as any,
        p_score: score,
        p_max_score: maxScore,
        p_time_taken: elapsed,
        p_accuracy: accuracy,
      });

      if (rpcErr) {
        Alert.alert('⚠️ Sync Failed', rpcErr.message + '\n\nPlease screenshot your score.');
      } else if (result?.error) {
        // Duplicate submission or other logical error
        Alert.alert('Note', result.error);
      } else if (result?.bonusMessage) {
        setBonusMessage(result.bonusMessage);
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message);
    }

    setIsSubmitted(true);
    setSubmitting(false);
  }, [gauntlet, questions, answers, timeLeft, submitting]);

  const handleShare = async () => {
    if (!gauntlet) return;
    const score = correctCount * 3;
    const max = (snapshot.length || questions.length) * 3;
    await Share.share({
      message: `I scored ${score}/${max} on "${gauntlet.title}" at Dheeyudha Academy! 🧠🔥`,
      title: gauntlet.title,
    });
  };

  // ── LOADING ──
  if (loading) return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
        Initializing Gauntlet…
      </Text>
    </View>
  );

  // ── ERROR ──
  if (error || !gauntlet) return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
      <View className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-8 rounded-3xl w-full max-w-sm items-center">
        <ShieldAlert size={48} color="#ef4444" />
        <Text className="text-xl font-black mb-2 text-red-600 dark:text-red-400 mt-4 text-center">Gauntlet Unavailable</Text>
        <Text className="text-slate-500 text-sm mb-6 text-center">{error || 'Not found'}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full py-3 bg-slate-900 dark:bg-white rounded-xl items-center"
        >
          <Text className="text-white dark:text-slate-900 font-bold">Return to Arena</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── RESULTS ──
  if (isSubmitted) {
    const resultSnap = snapshot.length > 0 ? snapshot : (dbResult?.metadata?.answers_snapshot || []);
    const resultCorrect = resultSnap.length > 0
      ? resultSnap.filter((s: AttemptSnapshot) => s.isCorrect).length
      : correctCount;
    const totalQ = resultSnap.length || gauntlet.question_count;
    const maxScore = totalQ * 3;
    const totalScore = resultCorrect * 3;
    const acc = totalQ > 0 ? Math.round((resultCorrect / totalQ) * 100) : 0;
    const displayTime = timeTaken || dbResult?.time_taken || 0;
    const tMins = Math.floor(displayTime / 60);
    const tSecs = displayTime % 60;
    const incorrectCount = resultSnap.filter((s: AttemptSnapshot) => !s.isCorrect && s.selectedOption !== null && s.selectedOption !== undefined).length;
    const skippedCount = resultSnap.filter((s: AttemptSnapshot) => s.selectedOption === null || s.selectedOption === undefined).length;

    return (
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1.5">
            <ArrowLeft size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500">Arena</Text>
          </TouchableOpacity>
          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1 mx-3 text-center" numberOfLines={1}>
            {gauntlet.title}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: accentColor }}
          >
            <Share2 size={12} color="#fff" />
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">Share</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-5 gap-5">
          {/* Hero Score Card */}
          <View
            className="rounded-[2.5rem] p-6 overflow-hidden"
            style={{ backgroundColor: accentColor }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Trophy size={18} color="rgba(255,255,255,0.8)" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-1">Gauntlet Complete</Text>
            </View>
            <View className="flex-row items-end gap-3 mb-5">
              <Text className="text-7xl font-black italic text-white leading-none">{totalScore}</Text>
              <View className="pb-1.5">
                <Text className="text-xl font-bold text-white/50">/ {maxScore}</Text>
                <Text className="text-[10px] text-white/60 font-black uppercase tracking-widest">Total Score</Text>
              </View>
            </View>
            <View className="flex-row gap-2 mb-4">
              {[
                { label: 'Correct', value: resultCorrect, color: '#6ee7b7' },
                { label: 'Wrong', value: incorrectCount, color: '#fca5a5' },
                { label: 'Skipped', value: skippedCount, color: '#fcd34d' },
                { label: 'Accuracy', value: `${acc}%`, color: '#ffffff' },
              ].map(stat => (
                <View key={stat.label} className="flex-1 rounded-2xl p-2.5 items-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <Text className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</Text>
                  <Text className="text-[8px] text-white/60 font-black uppercase tracking-widest mt-0.5">{stat.label}</Text>
                </View>
              ))}
            </View>
            {/* Accuracy bar */}
            <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <View className="h-full rounded-full" style={{ width: `${acc}%`, backgroundColor: '#34d399' }} />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-[9px] text-white/50 font-bold">0%</Text>
              <Text className="text-[9px] text-white/70 font-bold">{tMins}m {tSecs}s time taken</Text>
              <Text className="text-[9px] text-white/50 font-bold">100%</Text>
            </View>
          </View>

          {/* Bonus Banner */}
          {bonusMessage && (
            <View className="flex-row items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl">
              <View className="w-10 h-10 rounded-xl bg-emerald-500 items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-sm text-emerald-700 dark:text-emerald-400">{bonusMessage}</Text>
                <Text className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60 font-bold mt-0.5">Bonus points added instantly</Text>
              </View>
            </View>
          )}

          {/* Question Breakdown */}
          {resultSnap.length > 0 ? (
            <QuestionBreakdown snapshot={resultSnap} isDark={isDark} />
          ) : (
            <View className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 items-center">
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest">Detailed breakdown not available</Text>
              <Text className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Only newer submissions include per-question data</Text>
            </View>
          )}

          {/* Leaderboard */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden mb-4">
            <View className="flex-row items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <Trophy size={18} color="#eab308" />
              <Text className="font-black uppercase tracking-widest text-xs text-slate-700 dark:text-slate-200 flex-1 ml-1">Hall of Fame</Text>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? '#312e81' : '#eef2ff' }}>
                <Text className="text-[10px] font-black text-indigo-600 dark:text-indigo-300" numberOfLines={1}>{gauntlet.title}</Text>
              </View>
            </View>
            <View className="p-4">
              <GauntletLeaderboard slug={gauntlet.slug} isDark={isDark} />
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 py-4 rounded-2xl items-center"
              style={{ backgroundColor: accentColor }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-black uppercase text-xs tracking-widest">Back to Arena</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)' as any)}
              className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center"
              activeOpacity={0.8}
            >
              <Text className="font-black uppercase text-xs tracking-widest text-slate-700 dark:text-slate-200">Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── ACTIVE QUIZ ──
  if (!questions.length) return null;
  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft < 300;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex-row items-center justify-between gap-3">
        {/* Timer */}
        <View
          className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: isLowTime
              ? (isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2')
              : (isDark ? '#1e293b' : '#f1f5f9'),
          }}
        >
          <Clock size={16} color={isLowTime ? '#ef4444' : (isDark ? '#cbd5e1' : '#475569')} />
          <Text
            className="font-black text-sm tabular-nums"
            style={{ color: isLowTime ? '#ef4444' : (isDark ? '#cbd5e1' : '#334155') }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </Text>
        </View>

        {/* Progress */}
        <View className="flex-1 items-center gap-1">
          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400" numberOfLines={1}>
            {gauntlet.title}
          </Text>
          <View className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${(answeredCount / questions.length) * 100}%`, backgroundColor: accentColor }}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Submit Gauntlet',
              `You've answered ${answeredCount}/${questions.length} questions. Submit now?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', style: 'destructive', onPress: handleSubmit },
              ]
            );
          }}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: accentColor, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text className="text-white font-black text-xs uppercase tracking-widest">
                Submit ({answeredCount}/{questions.length})
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Question Card */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
              Q {currentIndex + 1} / {questions.length}
            </Text>
            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <Text className="text-[10px] font-bold text-slate-400">{currentQ.subject}</Text>
            </View>
          </View>
          <Text className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
            {currentQ.title}
          </Text>

          {/* Options */}
          <View className="mt-5 gap-2.5">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = answers[currentIndex] === oIdx;
              return (
                <TouchableOpacity
                  key={oIdx}
                  onPress={() => handleSelectOption(oIdx)}
                  className="flex-row items-center gap-3 p-4 rounded-2xl border-2"
                  style={{
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff')
                      : (isDark ? '#0f172a' : '#f8fafc'),
                    borderColor: isSelected ? accentColor : (isDark ? '#1e293b' : '#e2e8f0'),
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isSelected ? accentColor : (isDark ? '#334155' : '#e2e8f0') }}
                  >
                    <Text
                      className="font-black text-xs"
                      style={{ color: isSelected ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </Text>
                  </View>
                  <Text className="flex-1 font-medium text-sm leading-snug text-slate-800 dark:text-slate-200">
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Prev / Next */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setCurrentIndex(c => c - 1)}
            disabled={currentIndex === 0}
            className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center"
            style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
          >
            <Text className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200">← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCurrentIndex(c => c + 1)}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 py-4 rounded-2xl items-center"
            style={{ backgroundColor: accentColor, opacity: currentIndex === questions.length - 1 ? 0.3 : 1 }}
          >
            <Text className="text-white font-black text-xs uppercase tracking-widest">Next →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Question Palette Footer */}
      <View className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          {questions.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[idx] !== undefined;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentIndex(idx)}
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: isCurrent
                    ? accentColor
                    : isAnswered
                      ? (isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5')
                      : (isDark ? '#1e293b' : '#fff'),
                  borderWidth: isCurrent ? 0 : 1,
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  transform: [{ scale: isCurrent ? 1.1 : 1 }],
                }}
              >
                <Text
                  className="font-black"
                  style={{
                    fontSize: 11,
                    color: isCurrent
                      ? '#fff'
                      : isAnswered
                        ? (isDark ? '#34d399' : '#065f46')
                        : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
