import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
'use client';
import { useState, useEffect } from 'react';
const confetti = Object.assign(() => {}, { reset: () => {} });
import { X, Star, Heart, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import RoughSketch from './RoughSketch';

export type NoteBlock = {
  type: 'heading' | 'subheading' | 'paragraph' | 'highlight' | 'quote' | 'bullet' | 'narrative' | 'sketch';
  content?: string;
  title?: string;
  sketchType?: string;
};

export type Question = {
  q: string;
  opts: string[];
  ans: number;
  explain: string;
};

export type MapLevel = {
  id: number;
  title: string;
  icon: string;
  color: string;
  notes: NoteBlock[];
  questions: Question[];
};

export default function GauntletEngine({ chapterId, title, levels }: { chapterId: string, title: string, levels: MapLevel[] }) {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [completedToast, setCompletedToast] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/gauntlet/progress?chapter=${chapterId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const json = await res.json();
        if (json.success && json.unlockedLevel) {
          setUnlockedLevel(Math.max(1, json.unlockedLevel));
        }
      } catch (e) {
        console.error('Failed to load gauntlet progress', e);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetchProgress();
  }, [chapterId]);

  const saveProgress = async (newLevel: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/gauntlet/progress', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ unlockedLevel: newLevel, chapter: chapterId })
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  };

  const grantRewards = async (xp: number, points: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/gauntlet/reward', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ xp, points })
      });
    } catch (e) {
      console.error('Failed to grant rewards', e);
    }
  };

  const handleWin = (id: number) => {
    setActiveLevel(null);
    if (unlockedLevel === id) {
      const newLevel = id + 1;
      setUnlockedLevel(newLevel);
      confetti({ particleCount: 150, zIndex: 10000, spread: 90, colors: ['#4f46e5', '#ec4899', '#f59e0b'] });
      saveProgress(newLevel);
      
      // BOSS Rewards (detect if it's the final level)
      if (id === levels.length) {
        grantRewards(5, 10); 
        alert(`🎉 INCREDIBLE! You defeated the Boss and mastered ${title}! +10 Points, +5 XP!`);
      }
    }
  };

  const handleNodeClick = (level: MapLevel) => {
    const isCompleted = unlockedLevel > level.id;
    const isUnlocked = unlockedLevel >= level.id;
    if (!isUnlocked) return;
    if (isCompleted) {
      setCompletedToast(true);
      setTimeout(() => setCompletedToast(false), 2500);
      return;
    }
    setActiveLevel(level.id);
  };

  if (loadingProgress) {
    return <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-black text-slate-400 dark:text-slate-600">Loading your progress...</View>;
  }

  return (
    <View className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden flex flex-col items-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      {/* Completed Level Toast */}
      {completedToast && (
        <View className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl animate-bounce">
          ✅ Level already completed! Keep going.
        </View>
      )}
      
      <View className="w-full max-w-md bg-white dark:bg-slate-900 shadow-sm px-4 py-3 sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-row">
        <View onPress={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </View>
        <View className="flex-1 text-center flex-row">
          <View className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">{title}</View>
          <View className="text-[10px] font-bold text-sky-500 uppercase tracking-widest leading-none">Competitive Study Notes</View>
        </View>
        <View className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/30 flex-row">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <Text className="font-black text-amber-600">{(unlockedLevel - 1) * 20}</Text>
        </View>
      </View>

      <View className="flex-1 w-full max-w-md relative overflow-y-auto pb-32 pt-12 flex flex-col-reverse items-center justify-start gap-14" 
           style={{ backgroundImage: 'radial-gradient(#e2e8f0 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
        
        <Svg className="absolute inset-0 w-full h-[1800px] pointer-events-none" preserveAspectRatio="none" style={{ top: 'auto', bottom: 0 }}>
          <Path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="20" strokeLinecap="round" />
          <Path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" className="stroke-slate-100 dark:stroke-slate-900" strokeWidth="12" strokeLinecap="round" />
        </Svg>

        {levels.map((level, index) => {
          const isUnlocked = unlockedLevel >= level.id;
          const isCurrent = unlockedLevel === level.id;
          const isCompleted = unlockedLevel > level.id;

          const offsets = ['-50px', '20px', '50px', '-20px'];
          const xOffset = offsets[index % 4];

          return (
            <View
              key={level.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              style={{ transform: `translateX(${xOffset})`, zIndex: 5 }}
              className="relative group block"
            >
              <View className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap shadow-md border border-slate-200 dark:border-slate-700">
                {level.title}
                <View className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-200 dark:border-slate-700"></View>
              </View>

              <View
                onPress={() => handleNodeClick(level)}
                disabled={!isUnlocked}
                className={`
                  w-[80px] h-[80px] rounded-2xl flex flex-col items-center justify-center text-3xl shadow-lg transition-transform relative
                  ${isUnlocked ? 'active:scale-95 cursor-pointer' : 'grayscale opacity-60 cursor-not-allowed'}
                  ${isCurrent ? 'ring-4 ring-offset-4 ring-sky-300 animate-pulse' : ''}
                  ${isCompleted ? 'cursor-not-allowed' : ''}
                `}
                style={{ 
                  background: isCompleted ? '#10b981' : (isUnlocked ? level.color : '#cbd5e1'),
                  borderBottom: `6px solid ${isCompleted ? '#059669' : (isUnlocked ? level.color + 'aa' : '#94a3b8')}`,
                }}
              >
                {isCompleted ? '📖' : level.icon}
                <Text className="text-[9px] font-black uppercase text-white/90 mt-1.5 tracking-wider">Lvl {level.id}</Text>
                
                {isCompleted && (
                  <View className="absolute -bottom-2 -right-2 bg-white rounded-full text-emerald-500 shadow-md p-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <>
        {activeLevel && (
          <StudyNotesModal
            level={levels.find(l => l.id === activeLevel)!}
            onClose={() => setActiveLevel(null)}
            onWin={() => handleWin(activeLevel)}
          />
        )}
      </>

    </View>
  );
}

// ── Notes Modal UI ────────────────────────────────────────────────────────
function StudyNotesModal({ level, onClose, onWin }: { level: MapLevel; onClose: () => void; onWin: () => void; }) {
  const [phase, setPhase] = useState<'study' | 'quiz' | 'feedback'>('study');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  
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
      setLives(l => l - 1);
      if (lives - 1 <= 0) onClose(); 
      else {
        setSelected(null);
        setPhase('quiz');
      }
    }
  };

  return (
    <View
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[10000] bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <View className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 shrink-0 flex-row">
        <View onPress={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-6 h-6" />
        </View>
        <View className="flex flex-col items-center">
          <Text className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full mb-0.5">Study Notes</Text>
          <Text className="font-extrabold text-base text-slate-800 dark:text-slate-100 leading-none">{level.title}</Text>
        </View>
        <View className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/20 px-2 py-1 rounded-full border border-rose-100 dark:border-rose-500/30 flex-shrink-0 flex-row">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <Text className="font-black text-rose-600">{lives}</Text>
        </View>
      </View>

      <View className="flex-1 overflow-hidden relative flex-row">
        {phase === 'study' && (
          <View className="absolute inset-0 overflow-y-auto p-6 lg:px-12 pb-32">
            <View className="max-w-2xl mx-auto space-y-6">
              {level.notes.map((note, i) => {
                if (note.type === 'heading') return <Text key={i} className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-8 mb-2 leading-tight font-serif">{note.content}</Text>;
                if (note.type === 'subheading') return <Text key={i} className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-6 mb-1">{note.content}</Text>;
                if (note.type === 'paragraph') return <Text key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">{note.content}</Text>;
                if (note.type === 'highlight') return <View key={i} className="inline-block bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 font-bold px-2 py-0.5 rounded text-sm mb-1 mt-4">{note.content}</View>;
                if (note.type === 'quote') return <blockquote key={i} className="border-l-4 border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 pl-4 py-3 pr-4 rounded-r-xl italic text-slate-600 dark:text-slate-400 my-4 text-sm font-medium">{note.content}</blockquote>;
                if (note.type === 'bullet') return (
                    <View key={i} className="flex gap-3 my-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex-row">
                      <View className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-sm" />
                      <View>
                        {note.title && <Text className="font-bold text-slate-800 dark:text-slate-200 mr-2">{note.title}:</Text>}
                        <Text className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed">{note.content}</Text>
                      </View>
                    </View>
                );
                if (note.type === 'narrative') return <View key={i} className="text-center italic text-slate-400 dark:text-slate-500 text-sm my-8 font-serif px-8">{note.content}</View>;
                if (note.type === 'sketch' && note.sketchType) return <RoughSketch key={i} type={note.sketchType} width={250} height={250} />;
                return null;
              })}
            </View>
          </View>
        )}

        {phase === 'quiz' && (
          <View className="absolute inset-0 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
            <View className="min-h-full flex flex-col justify-center py-4">
              <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 max-w-2xl mx-auto w-full">
                <View className="inline-block bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-black text-xs uppercase px-3 py-1 rounded-full mb-4 border border-sky-200 dark:border-sky-500/30">
                  Knowledge Check • {qIndex + 1}/{level.questions.length}
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-snug font-serif">{q.q}</Text>
              </View>
              <View className="space-y-3 max-w-2xl mx-auto w-full">
                {q.opts.map((opt, i) => (
                  <View key={i} whileTap={{ scale: 0.98 }} onPress={() => handleAnswer(i)} className="w-full text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all flex items-start gap-4 flex-row">
                    <Text className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold px-3 py-1 rounded-lg text-sm shrink-0">{['A','B','C','D'][i]}</Text>
                    <Text className="mt-0.5 leading-snug">{opt}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {phase === 'feedback' && (
          <View className={`absolute inset-0 overflow-y-auto p-6 ${selected === q.ans ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
            <View className="min-h-full flex flex-col justify-center py-4">
              <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mx-auto">
                <View className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 flex-row">
                  {selected === q.ans ? <CheckCircle2 className="w-12 h-12 text-emerald-500" /> : <X className="w-12 h-12 text-rose-500" />}
                </View>
                <Text className={`text-4xl font-black mb-6 font-serif ${selected === q.ans ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {selected === q.ans ? 'Correct!' : 'Incorrect'}
                </Text>
                <View className={`p-6 rounded-2xl border text-left ${selected === q.ans ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900' : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900'}`}>
                  <Text className="font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed"><Text className="font-black text-slate-800 dark:text-slate-100">Explanation:</Text> {q.explain}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 z-20">
        <View
          whileTap={{ scale: 0.98 }}
          onPress={phase === 'study' ? () => setPhase('quiz') : handleNextQuiz}
          disabled={phase === 'quiz'}
          className={`
            w-full max-w-md mx-auto py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 text-white transition-all
            ${phase === 'study' ? 'bg-indigo-600 hover:bg-indigo-700 border-b-4 border-indigo-800' : ''}
            ${phase === 'feedback' && selected === q.ans ? 'bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800' : ''}
            ${phase === 'feedback' && selected !== q.ans ? 'bg-rose-600 hover:bg-rose-700 border-b-4 border-rose-800' : ''}
            ${phase === 'quiz' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
          `}
        >
          {phase === 'study' ? <><BookOpen className="w-5 h-5" /> Take the Knowledge Check</> : phase === 'quiz' ? 'Select an answer' : (
            <Text className="text-white dark:text-white">Continue</Text>
          )}
        </View>
      </View>
    </View>
  );
}
