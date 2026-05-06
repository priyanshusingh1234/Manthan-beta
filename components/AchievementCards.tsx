'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sword, Swords, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/* ── inject CSS once ─────────────────────────────────────────────────────── */
let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes ac-shimmer { 0%{left:-60%} 100%{left:160%} }
    @keyframes ac-silver-glow {
      0%,100%{ box-shadow:0 0 14px 3px #2563eb33,0 8px 32px rgba(0,0,0,.5); }
      50%    { box-shadow:0 0 30px 8px #2563eb66,0 8px 40px rgba(0,0,0,.6); }
    }
    @keyframes ac-gold-glow {
      0%,100%{ box-shadow:0 0 16px 4px #f59e0b44,0 8px 32px rgba(0,0,0,.5); }
      50%    { box-shadow:0 0 38px 12px #f59e0baa,0 8px 40px rgba(0,0,0,.6); }
    }
    @keyframes ac-purple-glow {
      0%,100%{ box-shadow:0 0 20px 5px #7c3aed55,0 8px 40px rgba(0,0,0,.6); }
      50%    { box-shadow:0 0 50px 16px #7c3aedcc,0 8px 50px rgba(0,0,0,.7); }
    }
    @keyframes ac-scan {
      from{background-position:0 0} to{background-position:0 80px}
    }
    @keyframes ac-demon-aura {
      0%,100%{ transform:scale(1);   opacity:.45; }
      50%    { transform:scale(1.25);opacity:.85; }
    }
    @keyframes ac-spark {
      0%  { transform:translateY(0) scale(1);    opacity:.9; }
      100%{ transform:translateY(-65px) scale(0);opacity:0;  }
    }
    @keyframes ac-eye {
      0%,100%{ filter:drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 16px #7c3aed); }
      50%    { filter:drop-shadow(0 0 20px #ff4444) drop-shadow(0 0 40px #9333ea); }
    }
    @keyframes ac-swords-clash {
      0%,100%{ transform:rotate(0deg) scale(1); }
      30%    { transform:rotate(-6deg) scale(1.08); }
      60%    { transform:rotate(6deg) scale(1.08); }
    }
  `;
  document.head.appendChild(s);
}

/* ── 3-D tilt wrapper ────────────────────────────────────────────────────── */
function TiltCard({ children, glow }: { children: React.ReactNode; glow: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 22 });
  const sy = useSpring(my, { stiffness: 200, damping: 22 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const glare = useTransform(sx, [-0.5, 0.5], [0, 1]);

  React.useEffect(() => { injectStyles(); }, []);

  return (
    <div
      ref={ref}
      style={{ perspective: 700 }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {/* dynamic glare overlay */}
        <motion.div
          style={{
            position: 'absolute', inset: 0, borderRadius: 20, zIndex: 50,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 60% 30%, ${glow}, transparent 65%)`,
            opacity: glare,
            mixBlendMode: 'screen',
          }}
        />
        {children}
      </motion.div>
    </div>
  );
}

/* ── spark particle ──────────────────────────────────────────────────────── */
function Spark({ x, delay, color }: { x: string; delay: string; color: string }) {
  return (
    <span style={{
      position: 'absolute', bottom: 0, left: x,
      width: 4, height: 4, borderRadius: '50%', background: color,
      animation: `ac-spark 1.8s ${delay} ease-in infinite`,
      pointerEvents: 'none',
    }} />
  );
}

/* ── rarity pill ─────────────────────────────────────────────────────────── */
function Rarity({ label, bg }: { label: string; bg: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999, background: bg, color: '#fff',
    }}>{label}</span>
  );
}

/* ── progress bar ────────────────────────────────────────────────────────── */
function Bar({ v, track, fill }: { v: number; track: string; fill: string }) {
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 999, background: track, overflow: 'hidden', marginTop: 6 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(v * 100)}%` }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }}
        style={{ height: '100%', borderRadius: 999, background: fill }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CARD 1 — FIRST VICTORY  ·  Common  ·  Steel / Blue
   ══════════════════════════════════════════════════════════════════════════ */
export function CardFirstVictory({ earned, progress }: { earned: boolean; progress: number }) {
  return (
    <div style={{ paddingTop: 72, position: 'relative' }}>
      {/* Floating sword above card */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 30, pointerEvents: 'none' }}>
        <motion.div
          animate={{ y: [0, -9, 0], rotate: [-10, -5, -10] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sword size={54} strokeWidth={1.6}
            style={{
              color: '#93c5fd',
              filter: earned
                ? 'drop-shadow(0 0 10px #3b82f6) drop-shadow(0 0 22px #1d4ed8)'
                : 'drop-shadow(0 0 4px #3b82f633) grayscale(.6)',
            }}
          />
        </motion.div>
      </div>

      <TiltCard glow="rgba(59,130,246,0.20)">
        <div style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg,#0d1f3c 0%,#1e3a5f 50%,#0d1f3c 100%)',
          animation: 'ac-silver-glow 3s ease-in-out infinite',
          border: '1px solid #1e40af88',
        }}>
          {/* Shimmer */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 20, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, width: '38%', height: '100%',
              background: 'linear-gradient(90deg,transparent,rgba(147,197,253,.15),transparent)',
              animation: 'ac-shimmer 2.8s ease-in-out infinite',
            }} />
          </div>
          {/* top gradient to blend sword base */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom,#0d1f3c,transparent)', zIndex: 10, pointerEvents: 'none', borderRadius: '20px 20px 0 0' }} />

          <div style={{ padding: '16px 18px 16px', position: 'relative', zIndex: 5 }}>
            <div style={{ height: 18 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Rarity label="Common" bg="linear-gradient(90deg,#334155,#475569)" />
              {earned ? <CheckCircle2 size={17} color="#34d399" /> : <Lock size={13} color="#475569" />}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#bfdbfe', letterSpacing: '-.02em' }}>First Victory</div>
            <div style={{ fontSize: 11, color: '#60a5fa99', fontWeight: 600, marginTop: 2 }}>Solve your first question</div>
            {earned
              ? <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: '#34d399', background: '#064e3b44', borderRadius: 8, padding: '3px 9px', display: 'inline-block' }}>✓ Unlocked</div>
              : <><Bar v={progress} track="#0d1f3c" fill="linear-gradient(90deg,#3b82f6,#60a5fa)" /><div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 800, marginTop: 4 }}>{Math.round(progress * 100)}% — solve 1 question</div></>
            }
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CARD 2 — DUEL HERO  ·  Common  ·  Gold / Flame
   ══════════════════════════════════════════════════════════════════════════ */
export function CardDuelHero({ earned, progress, current }: { earned: boolean; progress: number; current: number }) {
  return (
    <div style={{ paddingTop: 72, position: 'relative' }}>
      {/* Floating crossed swords */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 30, pointerEvents: 'none' }}>
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.07, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ animation: 'ac-swords-clash 3s ease-in-out infinite' }}
        >
          <Swords size={54} strokeWidth={1.6}
            style={{
              color: '#fde68a',
              filter: earned
                ? 'drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 24px #d97706)'
                : 'drop-shadow(0 0 4px #f59e0b33) grayscale(.6)',
            }}
          />
        </motion.div>
      </div>
      {earned && (
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, zIndex: 28, pointerEvents: 'none' }}>
          <div style={{ position: 'relative', height: 60 }}>
            <Spark x="30%" delay="0s"   color="#fbbf24" />
            <Spark x="52%" delay=".5s"  color="#fb923c" />
            <Spark x="70%" delay="1s"   color="#fde68a" />
            <Spark x="42%" delay="1.4s" color="#f97316" />
          </div>
        </div>
      )}

      <TiltCard glow="rgba(245,158,11,0.22)">
        <div style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg,#1a0a00 0%,#431407 45%,#1a0a00 100%)',
          animation: 'ac-gold-glow 2.4s ease-in-out infinite',
          border: '1px solid #92400e88',
        }}>
          {/* Shimmer */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 20, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, width: '42%', height: '100%',
              background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.14),transparent)',
              animation: 'ac-shimmer 2.2s ease-in-out infinite',
            }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top,rgba(251,146,60,.1),transparent)', pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom,#1a0a00,transparent)', zIndex: 10, pointerEvents: 'none', borderRadius: '20px 20px 0 0' }} />

          <div style={{ padding: '16px 18px 16px', position: 'relative', zIndex: 5 }}>
            <div style={{ height: 18 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Rarity label="Common" bg="linear-gradient(90deg,#92400e,#d97706)" />
              {earned ? <CheckCircle2 size={17} color="#34d399" /> : <Lock size={13} color="#92400e" />}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fde68a', letterSpacing: '-.02em' }}>Duel Hero</div>
            <div style={{ fontSize: 11, color: '#fbbf2488', fontWeight: 600, marginTop: 2 }}>Win 5 duels</div>
            {earned
              ? <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: '#fbbf24', background: '#78350f55', borderRadius: 8, padding: '3px 9px', display: 'inline-block' }}>✓ Unlocked</div>
              : <><Bar v={progress} track="#1a0a00" fill="linear-gradient(90deg,#d97706,#fbbf24)" /><div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, marginTop: 4 }}>{current}/5 duel wins — {Math.round(progress * 100)}% complete</div></>
            }
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CARD 3 — FINAL BOSS  ·  Uncommon  ·  Demon / Void Purple
   ══════════════════════════════════════════════════════════════════════════ */
export function CardFinalBoss({ earned, progress, current }: { earned: boolean; progress: number; current: number }) {
  return (
    <div style={{ paddingTop: 84, position: 'relative' }}>

      {/* ── Demon character rising from card ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 40, pointerEvents: 'none' }}>
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Aura blob behind demon */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%',
            width: 88, height: 88,
            transform: 'translateX(-50%)',
            background: earned ? 'radial-gradient(circle,#7c3aedcc,transparent 70%)' : 'radial-gradient(circle,#7c3aed44,transparent 70%)',
            borderRadius: '50%',
            animation: 'ac-demon-aura 1.6s ease-in-out infinite',
          }} />

          {/* Demon face */}
          <span style={{
            fontSize: 64,
            lineHeight: 1,
            display: 'block',
            animation: earned ? 'ac-eye 1.8s ease-in-out infinite' : 'none',
            filter: earned
              ? 'drop-shadow(0 0 14px #ef4444) drop-shadow(0 0 28px #7c3aed) drop-shadow(0 -4px 20px #a855f7)'
              : 'drop-shadow(0 0 4px #7c3aed44) grayscale(.7)',
            transform: 'translateZ(30px)',
          }}>
            👹
          </span>

          {/* shadow beneath demon */}
          <div style={{
            width: 50, height: 10,
            background: 'radial-gradient(ellipse,rgba(124,58,237,.6),transparent 70%)',
            borderRadius: '50%',
            marginTop: -4,
            filter: 'blur(4px)',
          }} />
        </motion.div>
      </div>

      {/* Sparks around the demon */}
      {earned && (
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 35, pointerEvents: 'none' }}>
          <div style={{ position: 'relative', height: 70 }}>
            <Spark x="20%" delay="0s"   color="#a78bfa" />
            <Spark x="45%" delay=".4s"  color="#c4b5fd" />
            <Spark x="65%" delay=".9s"  color="#7c3aed" />
            <Spark x="78%" delay="1.3s" color="#ddd6fe" />
            <Spark x="33%" delay="1.7s" color="#8b5cf6" />
          </div>
        </div>
      )}

      <TiltCard glow="rgba(124,58,237,0.25)">
        <div style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg,#0a0118 0%,#2e1065 35%,#1a0545 65%,#0a0118 100%)',
          animation: 'ac-purple-glow 2s ease-in-out infinite',
          border: '1px solid #6d28d999',
        }}>
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(167,139,250,.05) 8px)',
            backgroundSize: '100% 80px',
            animation: 'ac-scan 3s linear infinite',
          }} />
          {/* Rainbow holo shimmer */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 20, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, width: '55%', height: '100%',
              background: 'linear-gradient(90deg,transparent,rgba(196,181,253,.14),rgba(236,72,153,.07),transparent)',
              animation: 'ac-shimmer 2.5s ease-in-out infinite',
            }} />
          </div>
          {/* corner glow */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, background: 'radial-gradient(circle,#7c3aed55,transparent 70%)', pointerEvents: 'none' }} />
          {/* emergence gradient — hides demon's lower body inside card */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, background: 'linear-gradient(to bottom,#0a0118 0%,transparent 100%)', zIndex: 10, pointerEvents: 'none', borderRadius: '20px 20px 0 0' }} />

          <div style={{ padding: '16px 18px 16px', position: 'relative', zIndex: 5 }}>
            <div style={{ height: 24 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Rarity label="Uncommon" bg="linear-gradient(90deg,#4c1d95,#7c3aed)" />
              {earned ? <CheckCircle2 size={17} color="#34d399" /> : <Lock size={13} color="#6d28d9" />}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#e9d5ff', letterSpacing: '-.02em' }}>Final Boss</div>
            <div style={{ fontSize: 11, color: '#a78bfa88', fontWeight: 600, marginTop: 2 }}>Solve 20 questions</div>
            {earned
              ? <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: '#c4b5fd', background: '#3b076466', borderRadius: 8, padding: '3px 9px', display: 'inline-block' }}>✓ Unlocked</div>
              : <><Bar v={progress} track="#2e1065" fill="linear-gradient(90deg,#6d28d9,#a78bfa)" /><div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, marginTop: 4 }}>{current}/20 questions — {Math.round(progress * 100)}% complete</div></>
            }
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

/* ── default export: 3-card grid ─────────────────────────────────────────── */
export default function AchievementCards({ battlesWon, battlesAttempted }: { battlesWon: number; battlesAttempted: number }) {
  // Fetch REAL 1v1 duel wins from duel_challenges table
  // battlesWon just counts correct answers — not actual duel victories.
  const [realDuelWins, setRealDuelWins] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDuelWins() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRealDuelWins(0); return; }
      const { count } = await supabase
        .from('duel_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', user.id)
        .eq('status', 'completed');
      setRealDuelWins(count ?? 0);
    }
    fetchDuelWins();
  }, []);

  // Show a loading state until duel wins are fetched
  const duelWins = realDuelWins ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
      <CardFirstVictory
        earned={battlesAttempted >= 1}
        progress={Math.min(battlesAttempted / 1, 1)}
      />
      <CardDuelHero
        earned={duelWins >= 5}
        progress={Math.min(duelWins / 5, 1)}
        current={duelWins}
      />
      <CardFinalBoss
        earned={battlesAttempted >= 20}
        progress={Math.min(battlesAttempted / 20, 1)}
        current={battlesAttempted}
      />
    </div>
  );
}
