"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Crown, Zap, Clock, Flame, Swords, Share2,
  Play, CheckCircle, Lock, Sparkles, TrendingDown,
  Users, AlertTriangle, Trophy,
} from "lucide-react";
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
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

// ── Pulsing crown badge ───────────────────────────────────────────────────────
function PulseCrown() {
  return (
    <span className="relative flex h-5 w-5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40" />
      <Crown className="relative w-5 h-5 text-amber-300 fill-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
    </span>
  );
}

// ── Fail-rate badge ───────────────────────────────────────────────────────────
function FailBadge({ failPct }: { failPct: number }) {
  const isSpicy = failPct >= 70;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
        isSpicy
          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
      }`}
    >
      {isSpicy ? <AlertTriangle className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {failPct}% failed
    </span>
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
    try {
      if (navigator.share) { await navigator.share({ title: q.title || "", url }); return; }
      await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
  };

  const gradientCss = `linear-gradient(135deg, ${palette.from}, ${palette.to})`;

  return (
    <>
      {/* Outer container — handles entrance animation */}
      <div
        ref={cardRef}
        className="relative w-full my-2"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "opacity 0.55s cubic-bezier(.22,1,.36,1), transform 0.55s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-3xl blur-2xl scale-110 pointer-events-none"
          style={{ background: gradientCss, opacity: 0.18 }}
        />

        {/* Card border (gradient outline trick) */}
        <div
          className="relative rounded-3xl p-[1.5px] shadow-2xl"
          style={{ background: gradientCss }}
        >
          {/* Card body — dark glass */}
          <div className="rounded-[22px] bg-[#080b14] overflow-hidden">

            {/* ── Top header strip ──────────────────────────────────────────── */}
            <div
              className="relative px-5 pt-4 pb-3 flex items-center justify-between overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${palette.from}22, ${palette.to}18)` }}
            >
              {/* Subtle grid texture */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 24px)",
                }}
              />

              {/* Left — VIP label */}
              <div className="relative flex items-center gap-2">
                <PulseCrown />
                <span
                  className="text-sm font-black tracking-widest uppercase"
                  style={{ background: gradientCss, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  VIP Challenge
                </span>
                <Sparkles className="w-3.5 h-3.5 text-white/30" />
              </div>

              {/* Right — points pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border"
                style={{ borderColor: `${palette.from}60`, background: `${palette.from}18`, color: "#fcd34d" }}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                {q.points ?? 0} pts
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="px-5 pt-4 pb-2 space-y-4">

              {/* Subject + chapter row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-lg"
                  style={{ background: gradientCss }}
                >
                  {emoji} {q.subject}
                </span>
                {q.chapter && (
                  <span className="text-[11px] font-bold text-white/40 truncate max-w-[200px]">
                    {q.chapter}
                  </span>
                )}
                {q.classGrade && (
                  <span className="ml-auto text-[10px] font-black text-white/25 uppercase tracking-widest">
                    Class {q.classGrade}
                  </span>
                )}
              </div>

              {/* Question title */}
              <p className="text-white font-bold text-[15px] sm:text-base leading-snug">
                {q.title}
              </p>

              {/* Difficulty + time */}
              <div className="flex items-center gap-4">
                {q.difficulty && (
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-black text-rose-400 capitalize">{q.difficulty}</span>
                  </div>
                )}
                {q.timeLimit && (
                  <div className="flex items-center gap-1.5 text-white/35">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{q.timeLimit}m</span>
                  </div>
                )}
              </div>

              {/* ── TRACKING CARD ─────────────────────────────────────────── */}
              {totalAttempts > 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3.5 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {totalAttempts} attempted
                      </span>
                    </div>
                    {failRate !== null && <FailBadge failPct={failRate} />}
                  </div>

                  {/* Solve bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-emerald-400">✓ Solved — {solveRate}%</span>
                      <span className="text-rose-400">✗ Failed — {failRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                      <div
                        className="h-full rounded-l-full transition-all duration-700 ease-out"
                        style={{
                          width: `${solveRate ?? 0}%`,
                          background: "linear-gradient(90deg,#10b981,#34d399)",
                        }}
                      />
                      <div
                        className="h-full rounded-r-full transition-all duration-700 ease-out"
                        style={{
                          width: `${failRate ?? 0}%`,
                          background: "linear-gradient(90deg,#f87171,#fb923c)",
                        }}
                      />
                    </div>
                    {/* Mini avatar count pills */}
                    <div className="flex items-center gap-3 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-black text-amber-400">{solvedCount} correct</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span className="text-[10px] font-black text-rose-400">{failedCount} failed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No attempts yet — teaser */
                <div
                  className="rounded-2xl border border-white/10 p-3.5 flex items-center gap-3"
                  style={{ background: `${palette.from}10` }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: palette.from }} />
                  <div>
                    <p className="text-white font-black text-xs">Be the first to attempt!</p>
                    <p className="text-white/35 text-[10px] font-medium mt-0.5">No one has tried this yet. Make history.</p>
                  </div>
                </div>
              )}

              {/* Options preview — blurred to tease (only for unattempted) */}
              {Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <div className="grid grid-cols-2 gap-2 select-none">
                  {q.options.slice(0, 4).map((opt, i) => (
                    <div
                      key={i}
                      className="relative px-3 py-2 rounded-xl bg-white/5 border border-white/8 overflow-hidden"
                    >
                      <span className="text-xs font-semibold text-white/30 blur-[3px] select-none">{opt}</span>
                      <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15" />
                    </div>
                  ))}
                </div>
              )}

              {/* Already attempted banner */}
              {q.hasAttempted && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-emerald-400">VIP Challenge Completed!</p>
                    <p className="text-[11px] text-emerald-400/60 font-medium">You've already solved this one.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer action bar ──────────────────────────────────────── */}
            <div className="px-5 pt-2 pb-5 flex items-center gap-2.5">
              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>

              {/* Duel — students only, MCQ only */}
              {user && !isTeacher && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <button
                  onClick={() => setDuelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-black"
                >
                  <Swords className="w-3.5 h-3.5" /> Duel
                </button>
              )}

              {/* Main CTA */}
              <div className="ml-auto">
                {user === undefined ? (
                  <div className="h-10 w-32 rounded-xl bg-white/10 animate-pulse" />
                ) : isTeacher ? (
                  <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/25 text-xs font-bold">
                    Teacher View
                  </div>
                ) : q.hasAttempted ? (
                  <Link href={`/questions/${q.id}`}>
                    <button
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                      style={{ background: gradientCss }}
                    >
                      <CheckCircle className="w-4 h-4" /> View Result
                    </button>
                  </Link>
                ) : (
                  <Link href={`/questions/${q.id}`}>
                    <button
                      className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm shadow-lg active:scale-95 transition-all overflow-hidden group"
                      style={{ background: gradientCss, boxShadow: `0 6px 24px ${palette.glow}` }}
                    >
                      {/* Shimmer sweep */}
                      <span className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-white/15 pointer-events-none" />
                      <Play className="w-4 h-4 fill-white relative z-10" />
                      <span className="relative z-10">Accept Challenge</span>
                    </button>
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute -bottom-px left-10 right-10 h-[2px] rounded-full blur-sm"
          style={{ background: gradientCss, opacity: 0.5 }}
        />
      </div>

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
