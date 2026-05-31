import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Link } from 'expo-router';
import {
  Crown, Zap, Clock, Flame, Swords, Share2,
  Play, CheckCircle, Lock, Sparkles, TrendingDown,
  Users, AlertTriangle, Trophy,
} from 'lucide-react-native';
import { Share } from 'react-native';
import { Platform } from 'react-native';
import { supabase } from "@/lib/supabaseClient";
import DuelChallengeModal from "@/components/DuelChallengeModal";

type VipQuestion = {
  id: string;
  title: string;
  subject?: string | null;
  chapter?: string | null;
  classGrade?: string | null;
  points?: number | null;
  timeLimit?: number | null;
  difficulty?: string | null;
  options?: string[] | null;
  questionType?: string;
  matchPairs?: { left: string, right: string }[] | null;
  createdByName?: string | null;
  createdByAvatar?: string | null;
  createdByUsername?: string | null;
  createdBy?: string | null;
  totalAttempts?: number;
  solvedCount?: number;
  hasAttempted?: boolean;
  createdAt?: string | null;
  is_vip?: boolean;
};

// ── Gradient palette per subject ──────────────────────────────────────────────
const GRADIENTS: Record<string, { from: string; to: string; glow: string }> = {
  science:  { from: "#06b6d4", to: "#4f46e5", glow: "rgba(6,182,212,0.35)"  },
  maths:    { from: "#7c3aed", to: "#db2777", glow: "rgba(124,58,237,0.35)" },
  math:     { from: "#7c3aed", to: "#db2777", glow: "rgba(124,58,237,0.35)" },
  sst:      { from: "#059669", to: "#0891b2", glow: "rgba(5,150,105,0.35)"  },
  english:  { from: "#d97706", to: "#dc2626", glow: "rgba(217,119,6,0.35)"  },
  hindi:    { from: "#e11d48", to: "#7c3aed", glow: "rgba(225,29,72,0.35)"  },
  default:  { from: "#4f46e5", to: "#7c3aed", glow: "rgba(79,70,229,0.35)"  },
};

function getPalette(subject?: string | null) {
  const s = (subject || "").toLowerCase();
  for (const key of Object.keys(GRADIENTS)) {
    if (s.includes(key)) return GRADIENTS[key];
  }
  return GRADIENTS.default;
}

const SUBJECT_EMOJI: Record<string, string> = {
  science: "🔬", maths: "📐", math: "📐", sst: "🌍", english: "📖", hindi: "🇮🇳",
};
function getEmoji(s?: string | null) {
  const lower = (s || "").toLowerCase();
  for (const key of Object.keys(SUBJECT_EMOJI)) {
    if (lower.includes(key)) return SUBJECT_EMOJI[key];
  }
  return "⚡";
}

// ── Animated stat bar ─────────────────────────────────────────────────────────
function StatBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <View className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <View
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </View>
  );
}

// ── Pulsing crown badge ───────────────────────────────────────────────────────
function PulseCrown() {
  return (
    <Text className="relative flex h-5 w-5 flex-row">
      <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40 flex-row" />
      <Crown className="relative w-5 h-5 text-amber-300 fill-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
    </Text>
  );
}

// ── Fail-rate badge ───────────────────────────────────────────────────────────
function FailBadge({ failPct }: { failPct: number }) {
  const isSpicy = failPct >= 70;
  return (
    <Text
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
        isSpicy
          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
      }`}
    >
      {isSpicy ? <AlertTriangle className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {failPct}% failed
    </Text>
  );
}

export default function VipQuestionCard({ q }: { q: VipQuestion }) {
  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [duelOpen, setDuelOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const palette = getPalette(q.subject);
  const emoji = getEmoji(q.subject);
  const isTeacher = !!user?.user_metadata?.isTeacher;

  // Stat calculations
  const totalAttempts = q.totalAttempts ?? 0;
  const solvedCount = q.solvedCount ?? 0;
  const failedCount = totalAttempts - solvedCount;
  const solveRate = totalAttempts > 0 ? Math.round((solvedCount / totalAttempts) * 100) : null;
  const failRate  = totalAttempts > 0 ? Math.round((failedCount / totalAttempts) * 100) : null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user || null));
  }, []);

  // Scroll-triggered entrance
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/questions/${q.id}`;
    const title = q.title || "Dheeyudha VIP Challenge";
    try {
      if ((Platform.OS !== 'web')) {
        await Share.share({ title, url, dialogTitle: "Share this VIP Challenge" });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.share) { 
        await navigator.share({ title, url }); 
        return; 
      }
      await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
  };

  const gradientCss = `linear-gradient(135deg, ${palette.from}, ${palette.to})`;

  return (
    <>
      {/* Outer container — handles entrance animation */}
      <View
        ref={cardRef}
        className="relative w-full my-2"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "opacity 0.55s cubic-bezier(.22,1,.36,1), transform 0.55s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Ambient glow */}
        <View
          className="absolute inset-0 rounded-3xl blur-2xl scale-110 pointer-events-none"
          style={{ background: gradientCss, opacity: 0.18 }}
        />

        {/* Card border (gradient outline trick) */}
        <View
          className="relative rounded-3xl p-[1.5px] shadow-2xl"
          style={{ background: gradientCss }}
        >
          {/* Card body — dark glass */}
          <View className="rounded-[22px] bg-[#080b14] overflow-hidden">

            {/* ── Top header strip ──────────────────────────────────────────── */}
            <View
              className="relative px-5 pt-4 pb-3 flex items-center justify-between overflow-hidden flex-row"
              style={{ background: `linear-gradient(135deg, ${palette.from}22, ${palette.to}18)` }}
            >
              {/* Subtle grid texture */}
              <View
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 24px)",
                }}
              />

              {/* Left — VIP label */}
              <View className="relative flex items-center gap-2 flex-row">
                <PulseCrown />
                <Text
                  className="text-sm font-black tracking-widest uppercase"
                  style={{ background: gradientCss, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  VIP Challenge
                </Text>
                <Sparkles className="w-3.5 h-3.5 text-white/30" />
              </View>

              {/* Right — points pill */}
              <View
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border flex-row"
                style={{ borderColor: `${palette.from}60`, background: `${palette.from}18`, color: "#fcd34d" }}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                {q.points ?? 0} pts
              </View>
            </View>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <View className="px-5 pt-4 pb-2 space-y-4">

              {/* Subject + chapter row */}
              <View className="flex flex-wrap items-center gap-2 flex-row">
                <Text
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-lg flex-row"
                  style={{ background: gradientCss }}
                >
                  {emoji} {q.subject}
                </Text>
                {q.chapter && (
                  <Text className="text-[11px] font-bold text-white/40 truncate max-w-[200px]">
                    {q.chapter}
                  </Text>
                )}
                {q.classGrade && (
                  <Text className="ml-auto text-[10px] font-black text-white/25 uppercase tracking-widest">
                    Class {q.classGrade}
                  </Text>
                )}
                {q.questionType === 'match' && (
                  <Text className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider flex-row">
                    <Svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3v18"/><Path d="M3 8h6"/><Path d="M3 16h6"/><Path d="M15 8h6"/><Path d="M15 16h6"/></Svg>
                    Match
                  </Text>
                )}
              </View>

              {/* Question title */}
              <Text className="text-white font-bold text-[15px] sm:text-base leading-snug">
                {q.title}
              </Text>

              {/* Difficulty + time */}
              <View className="flex items-center gap-4 flex-row">
                {q.difficulty && (
                  <View className="flex items-center gap-1.5 flex-row">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <Text className="text-xs font-black text-rose-400 capitalize">{q.difficulty}</Text>
                  </View>
                )}
                {q.timeLimit && (
                  <View className="flex items-center gap-1.5 text-white/35 flex-row">
                    <Clock className="w-3.5 h-3.5" />
                    <Text className="text-xs font-bold">{q.timeLimit}m</Text>
                  </View>
                )}
              </View>

              {/* ── TRACKING CARD ─────────────────────────────────────────── */}
              {totalAttempts > 0 ? (
                <View className="rounded-2xl border border-white/8 bg-white/[0.04] p-3.5 space-y-3">
                  {/* Header row */}
                  <View className="flex items-center justify-between flex-row">
                    <View className="flex items-center gap-1.5 text-white/50 flex-row">
                      <Users className="w-3.5 h-3.5" />
                      <Text className="text-[11px] font-bold uppercase tracking-wider">
                        {totalAttempts} attempted
                      </Text>
                    </View>
                    {failRate !== null && <FailBadge failPct={failRate} />}
                  </View>

                  {/* Solve bar */}
                  <View className="space-y-1.5">
                    <View className="flex justify-between text-[10px] font-bold flex-row">
                      <Text className="text-emerald-400">✓ Solved — {solveRate}%</Text>
                      <Text className="text-rose-400">✗ Failed — {failRate}%</Text>
                    </View>
                    <View className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex flex-row">
                      <View
                        className="h-full rounded-l-full transition-all duration-700 ease-out"
                        style={{
                          width: `${solveRate ?? 0}%`,
                          background: "linear-gradient(90deg,#10b981,#34d399)",
                        }}
                      />
                      <View
                        className="h-full rounded-r-full transition-all duration-700 ease-out"
                        style={{
                          width: `${failRate ?? 0}%`,
                          background: "linear-gradient(90deg,#f87171,#fb923c)",
                        }}
                      />
                    </View>
                    {/* Mini avatar count pills */}
                    <View className="flex items-center gap-3 pt-0.5 flex-row">
                      <View className="flex items-center gap-1 flex-row">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <Text className="text-[10px] font-black text-amber-400">{solvedCount} correct</Text>
                      </View>
                      <View className="flex items-center gap-1 flex-row">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <Text className="text-[10px] font-black text-rose-400">{failedCount} failed</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* No attempts yet — teaser */
                <View
                  className="rounded-2xl border border-white/10 p-3.5 flex items-center gap-3 flex-row"
                  style={{ background: `${palette.from}10` }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: palette.from }} />
                  <View>
                    <Text className="text-white font-black text-xs">Be the first to attempt!</Text>
                    <Text className="text-white/35 text-[10px] font-medium mt-0.5">No one has tried this yet. Make history.</Text>
                  </View>
                </View>
              )}

              {/* Options or Match Pairs preview — blurred to tease (only for unattempted) */}
              {q.questionType === 'match' && q.matchPairs && q.matchPairs.length > 0 && !q.hasAttempted && (
                <View className="grid grid-cols-2 gap-2 select-none relative">
                  <View className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none flex-row">
                     <Svg width="40" height="10" className="text-white">
                        <Path d="M 0 5 L 40 5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
                     </Svg>
                  </View>
                  <View className="relative px-3 py-2 rounded-xl bg-white/5 border border-white/8 overflow-hidden text-center">
                    <Text className="text-xs font-semibold text-white/30 blur-[3px] select-none">{q.matchPairs[0].left}</Text>
                  </View>
                  <View className="relative px-3 py-2 rounded-xl bg-white/5 border border-white/8 overflow-hidden text-center">
                    <Text className="text-xs font-semibold text-white/30 blur-[3px] select-none">{q.matchPairs[0].right}</Text>
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15" />
                  </View>
                </View>
              )}
              {q.questionType !== 'match' && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <View className="grid grid-cols-2 gap-2 select-none">
                  {q.options.slice(0, 4).map((opt, i) => (
                    <View
                      key={i}
                      className="relative px-3 py-2 rounded-xl bg-white/5 border border-white/8 overflow-hidden"
                    >
                      <Text className="text-xs font-semibold text-white/30 blur-[3px] select-none">{opt}</Text>
                      <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15" />
                    </View>
                  ))}
                </View>
              )}

              {/* Already attempted banner */}
              {q.hasAttempted && (
                <View className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex-row">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <View>
                    <Text className="text-sm font-black text-emerald-400">VIP Challenge Completed!</Text>
                    <Text className="text-[11px] text-emerald-400/60 font-medium">You've already solved this one.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── Footer action bar ──────────────────────────────────────── */}
            <View className="px-5 pt-2 pb-5 flex items-center gap-2.5 flex-row">
              {/* Share */}
              <View
                onPress={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs font-bold flex-row"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </View>

              {/* Duel — students only, MCQ only */}
              {user && !isTeacher && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <View
                  onPress={() => setDuelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-black flex-row"
                >
                  <Swords className="w-3.5 h-3.5" /> Duel
                </View>
              )}

              {/* Main CTA */}
              <View className="ml-auto">
                {user === undefined ? (
                  <View className="h-10 w-32 rounded-xl bg-white/10 animate-pulse" />
                ) : isTeacher ? (
                  <View className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/25 text-xs font-bold">
                    Teacher View
                  </View>
                ) : q.hasAttempted ? (
                  <Link href={`/questions/${q.id}`}>
                    <View
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm shadow-lg active:scale-95 transition-all flex-row"
                      style={{ background: gradientCss }}
                    >
                      <CheckCircle className="w-4 h-4" /> View Result
                    </View>
                  </Link>
                ) : (
                  <Link href={`/questions/${q.id}`}>
                    <View
                      className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm shadow-lg active:scale-95 transition-all overflow-hidden group flex-row"
                      style={{ background: gradientCss, boxShadow: `0 6px 24px ${palette.glow}` }}
                    >
                      {/* Shimmer sweep */}
                      <Text className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-white/15 pointer-events-none" />
                      <Play className="w-4 h-4 fill-white relative z-10" />
                      <Text className="relative z-10">Accept Challenge</Text>
                    </View>
                  </Link>
                )}
              </View>
            </View>

          </View>
        </View>

        {/* Bottom accent line */}
        <View
          className="absolute -bottom-px left-10 right-10 h-[2px] rounded-full blur-sm"
          style={{ background: gradientCss, opacity: 0.5 }}
        />
      </View>

      {/* Duel modal */}
      {user && !isTeacher && (
        <DuelChallengeModal
          isOpen={duelOpen}
          onClose={() => setDuelOpen(false)}
          questionId={q.id}
          questionTitle={q.title}
          currentUserId={user.id}
        />
      )}
    </>
  );
}
