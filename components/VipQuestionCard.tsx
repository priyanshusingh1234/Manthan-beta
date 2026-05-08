"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Zap, Clock, Flame, Swords, Share2, Play, CheckCircle, Lock, Sparkles } from "lucide-react";
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

const SUBJECT_GRADIENTS: Record<string, string> = {
  science:  'from-cyan-500 via-blue-600 to-indigo-700',
  maths:    'from-violet-600 via-purple-700 to-fuchsia-700',
  math:     'from-violet-600 via-purple-700 to-fuchsia-700',
  sst:      'from-emerald-500 via-teal-600 to-cyan-700',
  english:  'from-amber-500 via-orange-600 to-rose-600',
  hindi:    'from-rose-500 via-pink-600 to-fuchsia-700',
  default:  'from-indigo-600 via-violet-700 to-purple-800',
};

function getGradient(subject?: string | null) {
  const s = (subject || '').toLowerCase();
  for (const key of Object.keys(SUBJECT_GRADIENTS)) {
    if (s.includes(key)) return SUBJECT_GRADIENTS[key];
  }
  return SUBJECT_GRADIENTS.default;
}

const SUBJECT_EMOJI: Record<string, string> = {
  science: '🔬', maths: '📐', math: '📐', sst: '🌍', english: '📖', hindi: '🇮🇳',
};
function getEmoji(subject?: string | null) {
  const s = (subject || '').toLowerCase();
  for (const key of Object.keys(SUBJECT_EMOJI)) {
    if (s.includes(key)) return SUBJECT_EMOJI[key];
  }
  return '⚡';
}

// Animated pulse ring
function PulseRing() {
  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400" />
    </span>
  );
}

export default function VipQuestionCard({ q }: { q: VipQuestion }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [duelOpen, setDuelOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const gradient = getGradient(q.subject);
  const emoji = getEmoji(q.subject);
  const isTeacher = !!user?.user_metadata?.isTeacher;
  const solveRate = q.totalAttempts ? Math.round(((q.solvedCount || 0) / q.totalAttempts) * 100) : null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user || null));
  }, []);

  // Entrance animation via IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/questions/${q.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: q.title || '', url }); return; }
      await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div
        ref={cardRef}
        className="relative w-full overflow-hidden"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* ── Outer glow ring ── */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-20 blur-xl scale-105 pointer-events-none`} />

        {/* ── Card shell ── */}
        <div className={`relative rounded-3xl bg-gradient-to-br ${gradient} p-[2px] shadow-2xl`}>
          <div className="rounded-[22px] bg-[#0d0d14] overflow-hidden">

            {/* ── Top strip ── */}
            <div className={`bg-gradient-to-r ${gradient} px-5 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Crown className="w-5 h-5 text-white drop-shadow-md" fill="white" />
                  <PulseRing />
                </div>
                <span className="text-white font-black text-sm tracking-widest uppercase">VIP Challenge</span>
                <Sparkles className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur px-3 py-1 rounded-full">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span className="text-amber-300 font-black text-sm">{q.points ?? 0} pts</span>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-5 pt-5 pb-4 space-y-4">

              {/* Subject + chapter pill row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-black shadow-lg`}>
                  {emoji} {q.subject}
                </span>
                {q.chapter && (
                  <span className="text-xs font-bold text-white/50 truncate max-w-[180px]">{q.chapter}</span>
                )}
                {q.classGrade && (
                  <span className="ml-auto text-[10px] font-black text-white/30 uppercase tracking-widest">Class {q.classGrade}</span>
                )}
              </div>

              {/* Question title */}
              <p className="text-white font-bold text-base sm:text-lg leading-snug">
                {q.title}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-4">
                {q.timeLimit && (
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{q.timeLimit}m</span>
                  </div>
                )}
                {q.difficulty && (
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-black text-rose-400 capitalize">{q.difficulty}</span>
                  </div>
                )}
                {solveRate !== null && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[10px] text-white/30 font-bold">Only</span>
                    <span className="text-sm font-black text-amber-400">{solveRate}%</span>
                    <span className="text-[10px] text-white/30 font-bold">solved</span>
                  </div>
                )}
              </div>

              {/* Options preview — blurred to tease */}
              {Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <div className="grid grid-cols-2 gap-2 select-none">
                  {q.options.slice(0, 4).map((opt, i) => (
                    <div key={i} className="relative px-3 py-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      <span className="text-xs font-semibold text-white/40 blur-[3px] select-none">{opt}</span>
                      <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                    </div>
                  ))}
                </div>
              )}

              {/* Already attempted — show solved checkmark */}
              {q.hasAttempted && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-emerald-400">You solved this VIP challenge!</span>
                </div>
              )}
            </div>

            {/* ── Footer action bar ── */}
            <div className="px-5 pb-5 flex items-center gap-3">
              {/* Share */}
              <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs font-bold">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>

              {/* Duel — students only, MCQ only, not attempted */}
              {user && !isTeacher && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
                <button onClick={() => setDuelOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-black">
                  <Swords className="w-3.5 h-3.5" /> Duel
                </button>
              )}

              {/* Main CTA */}
              {user === undefined ? (
                <div className="ml-auto h-10 w-28 rounded-xl bg-white/10 animate-pulse" />
              ) : isTeacher ? (
                <div className="ml-auto px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/30 text-xs font-bold">Teacher View</div>
              ) : q.hasAttempted ? (
                <Link href={`/questions/${q.id}`} className="ml-auto">
                  <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white font-black text-sm shadow-lg transition-all hover:-translate-y-0.5 active:scale-95`}>
                    <CheckCircle className="w-4 h-4" /> View Result
                  </button>
                </Link>
              ) : (
                <Link href={`/questions/${q.id}`} className="ml-auto">
                  <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white font-black text-sm shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 active:scale-95 relative overflow-hidden`}>
                    {/* shimmer */}
                    <span className="absolute inset-0 bg-white/10 -skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                    <Play className="w-4 h-4 fill-white" /> Accept Challenge
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div className={`absolute -bottom-1 left-8 right-8 h-0.5 bg-gradient-to-r ${gradient} opacity-60 blur-sm rounded-full`} />
      </div>

      {user && !isTeacher && (
        <DuelChallengeModal isOpen={duelOpen} onClose={() => setDuelOpen(false)} questionId={q.id} questionTitle={q.title} currentUserId={user.id} />
      )}
    </>
  );
}
