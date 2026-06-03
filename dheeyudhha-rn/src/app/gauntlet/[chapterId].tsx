import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X, Star, Heart, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react-native';
import Svg, { Path as SvgPath, Circle as SvgCircle, Rect as SvgRect } from 'react-native-svg';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import level data
import { ALL_LEVELS as nationalismEuropeLevels } from '@/data/gauntlet/nationalism-europe';
import { ALL_LEVELS as frenchRevolutionLevels } from '@/data/gauntlet/french-revolution';
import { ALL_LEVELS as nationalismIndiaLevels } from '@/data/gauntlet/nationalism-india';

const LEVEL_DATA_MAP: Record<string, any[]> = {
  'nationalism-europe': nationalismEuropeLevels,
  'french-revolution': frenchRevolutionLevels,
  'nationalism-india': nationalismIndiaLevels,
};

// SVG Sketches to replace HTML Canvas
export function RoughSketch({ type, width = 160, height = 160 }: { type: string; width?: number; height?: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (type === 'demon') {
    return (
      <View className="items-center my-4">
        <Svg width={width} height={height} viewBox="0 0 200 200">
          <SvgCircle cx="100" cy="100" r="60" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
          <SvgPath d="M50 50 L20 10 L60 40 Z" fill="#b91c1c" />
          <SvgPath d="M150 50 L180 10 L140 40 Z" fill="#b91c1c" />
          <SvgCircle cx="70" cy="80" r="10" fill="#facc15" />
          <SvgCircle cx="130" cy="80" r="10" fill="#facc15" />
          <SvgPath d="M50 70 L90 85" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          <SvgPath d="M150 70 L110 85" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          <SvgPath d="M 60 130 L 140 130 L 130 150 L 100 135 L 70 150 Z" fill="#000" />
        </Svg>
      </View>
    );
  }
  if (type === 'sword') {
    return (
      <View className="items-center my-4">
        <Svg width={width} height={height} viewBox="0 0 200 200">
          <SvgPath d="M90 150 L110 150 L100 20 Z" fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth="2" />
          <SvgRect x="80" y="150" width="40" height="10" fill="#b45309" rx={2} />
          <SvgRect x="95" y="160" width="10" height="30" fill="#78350f" rx={1} />
        </Svg>
      </View>
    );
  }
  if (type === 'map') {
    return (
      <View className="items-center my-4">
        <Svg width={width} height={height} viewBox="0 0 200 200">
          <SvgRect x="20" y="20" width="160" height="160" fill={isDark ? '#78350f' : '#fef3c7'} stroke="#d97706" strokeWidth="2" rx={8} />
          <SvgPath d="M 40 40 C 60 20, 80 80, 160 40 L 160 160 C 120 120, 60 180, 40 160 Z" fill="none" stroke={isDark ? '#fef3c7' : '#92400e'} strokeWidth="2" strokeDasharray="4 4" />
          <SvgPath d="M 90 90 L 110 110 M 110 90 L 90 110" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }
  return null;
}

export default function GauntletEngineScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { chapterId } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [completedToast, setCompletedToast] = useState(false);
  const [screenWidth, setScreenWidth] = useState(360);

  const levels = LEVEL_DATA_MAP[chapterId as string] || [];
  const chapterTitle = {
    'nationalism-europe': 'Nationalism in Europe',
    'french-revolution': 'The French Revolution',
    'nationalism-india': 'Nationalism in India',
  }[chapterId as string] || 'Chapter Study';

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const userMeta = user.user_metadata || {};
        let lvl = Number(userMeta[`gauntletLevel_${chapterId}`]) || 1;
        if (chapterId === 'nationalism-europe') {
          const legacyLvl = Number(userMeta['gauntletLevel_nationalism']) || 1;
          lvl = Math.max(lvl, legacyLvl);
        }
        setUnlockedLevel(Math.max(1, lvl));
      } catch (e) {
        console.error('Failed to load progress', e);
      } finally {
        setLoadingProgress(false);
      }
    };
    if (chapterId) fetchProgress();
  }, [chapterId]);

  const saveProgress = async (newLevel: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userMeta = user.user_metadata || {};
      let updatedMeta = { ...userMeta, [`gauntletLevel_${chapterId}`]: newLevel };
      if (chapterId === 'nationalism-europe') {
        updatedMeta = { ...updatedMeta, gauntletLevel_nationalism: newLevel };
      }
      await supabase.auth.updateUser({ data: updatedMeta });

      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  };

  const grantRewards = async (xp: number, points: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userMeta = user.user_metadata || {};
      const currentPoints = Number(userMeta.totalPoints) || 0;
      const currentXp = Number(userMeta.xp) || 0;

      const newPoints = currentPoints + points;
      const newXp = currentXp + xp;

      await supabase.auth.updateUser({
        data: {
          totalPoints: newPoints,
          xp: newXp
        }
      });

      await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          xp: newXp
        })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to grant rewards', e);
    }
  };

  const handleWin = (id: number) => {
    setActiveLevelId(null);
    if (unlockedLevel === id) {
      const newLevel = id + 1;
      setUnlockedLevel(newLevel);
      saveProgress(newLevel);

      if (id === levels.length) {
        grantRewards(5, 10);
        Alert.alert(
          '🎉 INCREDIBLE!',
          `You defeated the Boss and mastered ${chapterTitle}!\n\n+10 Points, +5 XP awarded!`
        );
      } else {
        Alert.alert('🎉 Level Complete!', 'You successfully finished this level. The next level is now unlocked!');
      }
    }
  };

  const handleNodeClick = (levelId: number) => {
    const isCompleted = unlockedLevel > levelId;
    const isUnlocked = unlockedLevel >= levelId;

    if (!isUnlocked) {
      Alert.alert('Locked 🔒', 'Complete previous levels first to unlock this one!');
      return;
    }
    if (isCompleted) {
      setCompletedToast(true);
      setTimeout(() => setCompletedToast(false), 2000);
      return;
    }
    setActiveLevelId(levelId);
  };

  // Math for dynamic SVG map road
  const centerX = screenWidth / 2;
  const offsets = [-60, 20, 60, -20];
  const mapHeight = levels.length * 130 + 100;

  // Generate SVG path string connecting node coordinates
  let pathD = '';
  if (levels.length > 0) {
    pathD = `M ${centerX + offsets[0]} ${mapHeight - 80}`;
    for (let i = 1; i < levels.length; i++) {
      const prevX = centerX + offsets[(i - 1) % 4];
      const prevY = mapHeight - ((i - 1) * 130 + 80);
      const currX = centerX + offsets[i % 4];
      const currY = mapHeight - (i * 130 + 80);

      const controlY1 = prevY - 45;
      const controlY2 = currY + 45;
      pathD += ` C ${prevX} ${controlY1}, ${currX} ${controlY2}, ${currX} ${currY}`;
    }
  }

  if (loadingProgress) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-slate-500 dark:text-slate-400 font-bold mt-4">Loading your progress...</Text>
      </View>
    );
  }

  // Reverse list so Level 10 sits at the top and Level 1 at the bottom
  const reversedLevels = [...levels].reverse();

  return (
    <View 
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      onLayout={(event) => setScreenWidth(event.nativeEvent.layout.width)}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: chapterTitle,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/gauntlet' as any);
                }
              }} 
              className="mr-4"
            >
              <ArrowLeft size={24} color={isDark ? '#cbd5e1' : '#0f172a'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row items-center bg-amber-100 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
              <Star size={14} color={isDark ? '#fbbf24' : '#f59e0b'} fill={isDark ? '#fbbf24' : '#f59e0b'} className="mr-1" />
              <Text className="font-black text-amber-700 dark:text-amber-400 text-xs">{(unlockedLevel - 1) * 20}</Text>
            </View>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
          headerTintColor: isDark ? '#cbd5e1' : '#0f172a',
        }}
      />

      {/* Completed Level Notification */}
      {completedToast && (
        <View className="absolute top-4 left-4 right-4 z-50 bg-emerald-600 rounded-2xl py-3 px-5 shadow-lg border border-emerald-500 items-center">
          <Text className="text-white font-bold text-sm">✅ Level already completed! Keep going.</Text>
        </View>
      )}

      {/* Level Road Map */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ height: mapHeight }}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Zigzag Path Line */}
        <View className="absolute inset-0 pointer-events-none">
          <Svg width="100%" height={mapHeight}>
            <SvgPath d={pathD} fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth={18} strokeLinecap="round" />
            <SvgPath d={pathD} fill="none" stroke={isDark ? '#0f172a' : '#f1f5f9'} strokeWidth={10} strokeLinecap="round" />
          </Svg>
        </View>

        {/* Level buttons placed absolutely on coordinates */}
        {levels.map((level, index) => {
          const isUnlocked = unlockedLevel >= level.id;
          const isCurrent = unlockedLevel === level.id;
          const isCompleted = unlockedLevel > level.id;

          const nodeX = centerX + offsets[index % 4];
          const nodeY = mapHeight - (index * 130 + 80);

          return (
            <View
              key={level.id}
              style={{
                position: 'absolute',
                left: nodeX - 40,
                top: nodeY - 40,
                width: 80,
                height: 80,
                zIndex: 10,
              }}
            >
              {/* Level Title Tag above node */}
              <View 
                style={{ position: 'absolute', top: -38, alignSelf: 'center' }}
                className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <Text className="text-[9px] font-black text-slate-800 dark:text-slate-200 text-center" numberOfLines={1}>
                  {level.title}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleNodeClick(level.id)}
                disabled={!isUnlocked}
                activeOpacity={0.8}
                className={`
                  w-full h-full rounded-3xl items-center justify-center shadow-md relative
                  ${isUnlocked ? 'active:scale-95' : 'opacity-65'}
                `}
                style={{
                  backgroundColor: isCompleted ? '#10b981' : (isUnlocked ? level.color : (isDark ? '#334155' : '#cbd5e1')),
                  borderBottomWidth: 6,
                  borderBottomColor: isCompleted ? '#059669' : (isUnlocked ? level.color + 'aa' : (isDark ? '#1e293b' : '#94a3b8')),
                  transform: isCurrent ? [{ scale: 1.05 }] : [],
                }}
              >
                {isCompleted ? (
                  <Text className="text-2xl">📖</Text>
                ) : (
                  <Text className="text-2xl">{level.icon}</Text>
                )}
                <Text className="text-[9px] font-black uppercase text-white/90 mt-1 tracking-wider">
                  Lvl {level.id}
                </Text>

                {isCompleted && (
                  <View 
                    style={{ position: 'absolute', bottom: -4, right: -4 }}
                    className="bg-white dark:bg-slate-900 rounded-full p-0.5 shadow border border-slate-100 dark:border-slate-850"
                  >
                    <CheckCircle2 size={16} color="#10b981" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Active Level Study / Quiz Modal */}
      {activeLevelId !== null && (
        <StudyNotesModal
          level={levels.find(l => l.id === activeLevelId)!}
          onClose={() => setActiveLevelId(null)}
          onWin={() => handleWin(activeLevelId)}
        />
      )}
    </View>
  );
}

// ── Notes & Quiz Modal Component ───────────────────────────────────────────
function StudyNotesModal({ 
  level, 
  onClose, 
  onWin 
}: { 
  level: any; 
  onClose: () => void; 
  onWin: () => void; 
}) {
  const [phase, setPhase] = useState<'study' | 'quiz' | 'feedback'>('study');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const q = level.questions[qIndex];

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setPhase('feedback');
  };

  const handleNextQuiz = () => {
    const isCorrect = selected === q.ans;
    if (isCorrect) {
      if (qIndex + 1 < level.questions.length) {
        setQIndex(i => i + 1);
        setSelected(null);
        setPhase('quiz');
      } else {
        onWin();
      }
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        Alert.alert('💀 Out of Lives', 'You ran out of lives! Read the notes again and try again.');
        onClose();
      } else {
        setSelected(null);
        setPhase('quiz');
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      visible={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Header bar */}
        <View className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <TouchableOpacity 
            onPress={onClose} 
            className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
          >
            <X size={24} color={isDark ? '#cbd5e1' : '#64748b'} />
          </TouchableOpacity>
          <View className="flex-1 items-center px-4">
            <View className="bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-full mb-0.5">
              <Text className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">
                Study Notes
              </Text>
            </View>
            <Text className="font-extrabold text-base text-slate-800 dark:text-slate-100 text-center" numberOfLines={1}>
              {level.title}
            </Text>
          </View>
          <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/30">
            <Heart size={16} color="#ef4444" fill="#ef4444" className="mr-1" />
            <Text className="font-black text-rose-600 dark:text-rose-400 text-xs">{lives}</Text>
          </View>
        </View>

        {/* Scrollable Main Content */}
        <View className="flex-1">
          {phase === 'study' && (
            <ScrollView 
              className="flex-1 px-6 pt-6 pb-24"
              showsVerticalScrollIndicator={false}
            >
              <View className="pb-32">
                {level.notes.map((note: any, i: number) => {
                  if (note.type === 'heading') {
                    return (
                      <Text key={i} className="text-xl font-black text-slate-900 dark:text-slate-50 mt-6 mb-2 font-serif leading-tight">
                        {note.content}
                      </Text>
                    );
                  }
                  if (note.type === 'subheading') {
                    return (
                      <Text key={i} className="text-base font-bold text-slate-800 dark:text-slate-200 mt-4 mb-1">
                        {note.content}
                      </Text>
                    );
                  }
                  if (note.type === 'paragraph') {
                    return (
                      <Text key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed text-[14px] mb-3">
                        {note.content}
                      </Text>
                    );
                  }
                  if (note.type === 'highlight') {
                    return (
                      <View key={i} className="self-start bg-amber-100 dark:bg-amber-950/30 rounded px-2 py-0.5 mb-2 mt-3 border border-amber-200 dark:border-amber-900/50">
                        <Text className="text-amber-800 dark:text-amber-400 font-bold text-[12px]">{note.content}</Text>
                      </View>
                    );
                  }
                  if (note.type === 'quote') {
                    return (
                      <View key={i} className="border-l-4 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 pl-4 py-3 pr-3 rounded-r-xl my-4">
                        <Text className="text-slate-600 dark:text-slate-300 italic text-[13px] leading-relaxed font-medium">{note.content}</Text>
                      </View>
                    );
                  }
                  if (note.type === 'bullet') {
                    return (
                      <View key={i} className="flex-row bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm my-2">
                        <View className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 mr-3 shrink-0" />
                        <View className="flex-1">
                          {note.title && (
                            <Text className="font-bold text-slate-800 dark:text-slate-200 text-[14px] mb-0.5">{note.title}</Text>
                          )}
                          <Text className="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">{note.content}</Text>
                        </View>
                      </View>
                    );
                  }
                  if (note.type === 'narrative') {
                    return (
                      <Text key={i} className="text-center italic text-slate-400 dark:text-slate-500 text-[13px] my-6 px-4">
                        {note.content}
                      </Text>
                    );
                  }
                  if (note.type === 'sketch' && note.sketchType) {
                    return <RoughSketch key={i} type={note.sketchType} width={180} height={180} />;
                  }
                  return null;
                })}
              </View>
            </ScrollView>
          )}

          {phase === 'quiz' && (
            <View className="flex-1 px-6 justify-center bg-slate-50 dark:bg-slate-950">
              <View className="w-full mb-6">
                <View className="self-start bg-sky-100 dark:bg-sky-950/30 px-3 py-1 rounded-full mb-3 border border-sky-200 dark:border-sky-900/50">
                  <Text className="text-sky-700 dark:text-sky-400 font-black text-[10px] uppercase">
                    Knowledge Check • {qIndex + 1}/{level.questions.length}
                  </Text>
                </View>
                <Text className="text-xl font-black text-slate-800 dark:text-slate-100 leading-snug font-serif">
                  {q.q}
                </Text>
              </View>

              <View className="space-y-3 w-full">
                {q.opts.map((opt: string, i: number) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => handleAnswer(i)}
                    activeOpacity={0.7}
                    className="w-full flex-row items-start p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-3 active:bg-sky-50 dark:active:bg-sky-950/20 active:border-sky-300 dark:active:border-sky-800"
                  >
                    <View className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-2.5 py-0.5 rounded-lg mr-3 shrink-0">
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">{['A','B','C','D'][i]}</Text>
                    </View>
                    <Text className="flex-1 mt-0.5 text-slate-700 dark:text-slate-200 font-bold text-sm leading-snug">{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {phase === 'feedback' && (
            <View className={`flex-1 px-6 justify-center ${selected === q.ans ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
              <View className="items-center w-full max-w-md mx-auto">
                <View className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full items-center justify-center mb-6 shadow-md border border-slate-100 dark:border-slate-800">
                  <Text className="text-4xl">
                    {selected === q.ans ? '✅' : '❌'}
                  </Text>
                </View>
                <Text className={`text-2xl font-black mb-6 font-serif ${selected === q.ans ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {selected === q.ans ? 'Correct!' : 'Incorrect'}
                </Text>
                <View className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm w-full">
                  <Text className="text-slate-800 dark:text-slate-200 text-[14px] leading-relaxed">
                    <Text className="font-black text-slate-900 dark:text-slate-100">Explanation: </Text>
                    {q.explain}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Footer Navigation Button */}
        <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <TouchableOpacity
            onPress={phase === 'study' ? () => setPhase('quiz') : handleNextQuiz}
            disabled={phase === 'quiz'}
            activeOpacity={0.8}
            className={`
              w-full py-4 rounded-xl flex-row justify-center items-center gap-2
              ${phase === 'study' ? 'bg-indigo-600 border-b-4 border-indigo-800' : ''}
              ${phase === 'feedback' && selected === q.ans ? 'bg-emerald-600 border-b-4 border-emerald-800' : ''}
              ${phase === 'feedback' && selected !== q.ans ? 'bg-rose-600 border-b-4 border-rose-800' : ''}
              ${phase === 'quiz' ? 'bg-slate-100 dark:bg-slate-800' : ''}
            `}
          >
            {phase === 'study' ? (
              <>
                <BookOpen size={18} color="white" />
                <Text className="text-white font-bold text-base">Take the Knowledge Check</Text>
              </>
            ) : phase === 'quiz' ? (
              <Text className="text-slate-400 dark:text-slate-500 font-bold text-base">Select an answer</Text>
            ) : (
              <Text className="text-white font-bold text-base">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
