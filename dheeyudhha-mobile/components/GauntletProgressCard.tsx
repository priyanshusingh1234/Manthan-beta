import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
'use client';
import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ChevronRight, Star, BookOpen, AlertCircle, Share2, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { Share } from 'react-native';
import { Platform } from 'react-native';

const BASE_URL = 'https://dheeyudha.vercel.app';
const CHAPTER  = 'Rise of Nationalism in Europe';
const CHAPTER_SLUG = 'nationalism-europe';
const TOTAL_LEVELS = 10;

export default function GauntletProgressCard() {
  const [level, setLevel] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/gauntlet/progress?chapter=${CHAPTER_SLUG}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const json = await res.json();
        if (json.success && json.unlockedLevel) {
          setLevel(Math.max(1, json.unlockedLevel));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProgress();
  }, []);

  if (level === null) return null;

  const progressPercent = Math.min(100, Math.max(0, ((level - 1) / TOTAL_LEVELS) * 100));
  const isCompleted = level > TOTAL_LEVELS;
  const isBossPhase = level === TOTAL_LEVELS;
  const pct = Math.round(progressPercent);

  // Build the canonical share URL and OG image URL
  const shareUrl = `${BASE_URL}/gauntlet/${CHAPTER_SLUG}`;
  const ogImageUrl = `${BASE_URL}/api/gauntlet/og-image?chapter=${encodeURIComponent(CHAPTER)}&level=${level}&total=${TOTAL_LEVELS}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const text = isCompleted
      ? `🏆 I just MASTERED "${CHAPTER}" on Dheeyudha! All 10 levels done. Can you beat my score? #Dheeyudha #StudyGoals`
      : isBossPhase
      ? `💀 I reached the BOSS FIGHT in the "${CHAPTER}" Gauntlet on Dheeyudha! Come challenge me! #Dheeyudha`
      : `⚔️ I'm ${pct}% through the "${CHAPTER}" Gauntlet on Dheeyudha — Level ${level}/${TOTAL_LEVELS}! Join the battle! #Dheeyudha #StudyGoals`;

    // Use Capacitor Share on native (Android/iOS) — same as rest of app
    if ((Platform.OS !== 'web')) {
      try {
        await Share.share({
          title: 'My Gauntlet Progress — Dheeyudha',
          text,
          url: shareUrl,
          dialogTitle: 'Share your Gauntlet progress',
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch (err) {
        // User dismissed — do nothing
        return;
      }
    }

    // Web: try navigator.share (desktop PWA / Chrome) then fall to clipboard
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'My Gauntlet Progress — Dheeyudha', text, url: shareUrl });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch (err: any) {
        // AbortError = user dismissed, not a real failure — don't copy clipboard
        if (err?.name === 'AbortError') return;
      }
    }

    // Clipboard fallback (desktop browsers without Web Share)
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Clipboard toast */}
      <>
        {copied && (
          <View
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 flex-row"
          >
            <Check className="w-4 h-4 text-emerald-400" /> Link copied to clipboard!
          </View>
        )}
        {shared && (
          <View
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 flex-row"
          >
            <Share2 className="w-4 h-4 text-indigo-400" /> Shared successfully!
          </View>
        )}
      </>

      <Link href={`/gauntlet/${CHAPTER_SLUG}`}>
        <View className="relative overflow-hidden rounded-3xl bg-indigo-950 p-6 flex flex-col justify-between border-2 border-indigo-500/20 shadow-xl shadow-indigo-900/10 group cursor-pointer active:scale-[0.98] transition-transform">

          {/* Background Decor */}
          <View className="absolute top-0 right-0 -mr-6 -mt-6">
            <View className="w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
          </View>
          <View className="absolute bottom-0 left-0 -ml-6 -mb-6">
            <View className="w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />
          </View>

          <View className="relative z-10 flex items-start justify-between flex-row">
            <View className="flex-1 min-w-0 pr-3 flex-row">
              <View className="flex items-center gap-2 mb-1 flex-row">
                <Text className="bg-indigo-500/20 text-indigo-300 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-400/20">
                  Featured Course
                </Text>
                {isBossPhase && (
                  <Text className="bg-rose-500/20 text-rose-400 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-rose-400/20 flex items-center gap-1 flex-row">
                    <AlertCircle className="w-3 h-3" /> Boss Fight
                  </Text>
                )}
              </View>
              <Text className="text-xl font-black text-white leading-tight mb-1">{CHAPTER}</Text>
              <Text className="text-indigo-200/80 text-sm font-medium">
                {isCompleted
                  ? 'Mastery Achieved. You have defeated the Gauntlet!'
                  : isBossPhase ? 'The Final Boss awaits. Claim your 10 Points!'
                  : 'Continue your epic journey across 18th century Europe.'}
              </Text>
            </View>

            {/* Share button */}
            <View
              onPress={handleShare}
              className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 hover:bg-indigo-500/40 active:scale-95 transition-all flex-row"
              title="Share your progress"
            >
              <Share2 className="w-5 h-5 text-indigo-300" />
            </View>
          </View>

          <View className="relative z-10 mt-5 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <View className="flex items-center justify-between mb-2 flex-row">
              <View className="flex items-center gap-1 text-sm font-bold text-white flex-row">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Level {Math.min(level, TOTAL_LEVELS)} of {TOTAL_LEVELS}
              </View>
              <View className="font-extrabold text-indigo-300 text-sm">{pct}%</View>
            </View>

            {/* Progress Bar */}
            <View className="w-full bg-slate-800/80 rounded-full h-2.5 mb-3 overflow-hidden shadow-inner">
              <View
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-2.5 rounded-full ${isBossPhase ? 'bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
              />
            </View>

            {/* Reward Preview / CTA row */}
            {!isCompleted ? (
              <View className="flex items-center justify-between flex-row">
                <View className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20 flex-row">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {isBossPhase ? 'Reward: 10 Points + 5 XP' : `Win to earn ${level * 20} XP`}
                </View>
                <View className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-0.5 group-hover:text-indigo-300 transition-colors flex-row">
                  Resume <ChevronRight className="w-4 h-4" />
                </View>
              </View>
            ) : (
              <View className="flex items-center justify-between flex-row">
                <View className="flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20 flex-row">
                  <Text>✓</Text> Completed with Mastery
                </View>
                <View className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-0.5 group-hover:text-indigo-300 transition-colors flex-row">
                  Review <ChevronRight className="w-4 h-4" />
                </View>
              </View>
            )}
          </View>
        </View>
      </Link>
    </View>
  );
}
