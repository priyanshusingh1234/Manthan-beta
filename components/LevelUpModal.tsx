"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap, Star, Trophy, ChevronRight } from "lucide-react";

// ── Level colour palette (cycles every 10 levels) ────────────────────────────
const LEVEL_PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", glow: "#6366f133", label: "Apprentice"   },
  { from: "#3b82f6", to: "#06b6d4", glow: "#3b82f633", label: "Scholar"      },
  { from: "#10b981", to: "#34d399", glow: "#10b98133", label: "Achiever"     },
  { from: "#f59e0b", to: "#fbbf24", glow: "#f59e0b33", label: "Expert"       },
  { from: "#ef4444", to: "#f97316", glow: "#ef444433", label: "Champion"     },
  { from: "#ec4899", to: "#f43f5e", glow: "#ec489933", label: "Elite"        },
  { from: "#8b5cf6", to: "#a855f7", glow: "#8b5cf633", label: "Legend"       },
  { from: "#0ea5e9", to: "#6366f1", glow: "#0ea5e933", label: "Master"       },
  { from: "#f59e0b", to: "#ef4444", glow: "#f59e0b44", label: "Grandmaster"  },
  { from: "#fbbf24", to: "#f97316", glow: "#fbbf2444", label: "Immortal"     },
];

function getPalette(level: number) {
  return LEVEL_PALETTES[(level - 1) % LEVEL_PALETTES.length];
}

// ── Floating particle ─────────────────────────────────────────────────────────
function Particle({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) {
  return (
    <span
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        background: color,
        left: `${x}%`,
        top: `${y}%`,
        animation: `lvlParticle 1.2s ease-out ${delay}ms forwards`,
        opacity: 0,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}

// ── Orbit ring ────────────────────────────────────────────────────────────────
function OrbitRing({ size, duration, from, to }: { size: number; duration: number; from: string; to: string }) {
  return (
    <div
      className="absolute rounded-full border-2 pointer-events-none"
      style={{
        width: size,
        height: size,
        borderImage: `linear-gradient(135deg, ${from}, ${to}) 1`,
        borderColor: from,
        opacity: 0,
        animation: `orbitExpand ${duration}ms ease-out forwards`,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ isOpen, newLevel, onClose }: LevelUpModalProps) {
  const palette = getPalette(newLevel);
  const [show, setShow] = useState(false);
  const [badgeReady, setBadgeReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) { setShow(false); setBadgeReady(false); return; }
    // Stagger: overlay first, then badge
    const t1 = setTimeout(() => setShow(true), 10);
    const t2 = setTimeout(() => setBadgeReady(true), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate particles
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: i % 3 === 0 ? palette.from : i % 3 === 1 ? palette.to : "#fff",
    delay: Math.random() * 400,
    x: 10 + Math.random() * 80,
    y: 5 + Math.random() * 90,
  }));

  const gradientCss = `linear-gradient(135deg, ${palette.from}, ${palette.to})`;

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes lvlParticle {
          0%   { transform: translate(0,0) scale(0); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(${`var(--tx,0)`}px, -80px) scale(0.3); opacity: 0; }
        }
        @keyframes orbitExpand {
          0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes lvlBadgePop {
          0%   { transform: scale(0.4) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(3deg); opacity: 1; }
          80%  { transform: scale(0.96) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes lvlShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lvlFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes lvlGlowPulse {
          0%, 100% { box-shadow: 0 0 40px 10px ${palette.glow}; }
          50%       { box-shadow: 0 0 70px 20px ${palette.from}55; }
        }
        @keyframes lvlStarSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(12px)",
          opacity: show ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      >
        {/* Particles */}
        {particles.map(p => <Particle key={p.id} {...p} />)}

        {/* ── Card ── */}
        <div
          className="relative flex flex-col items-center text-center max-w-xs w-full"
          onClick={e => e.stopPropagation()}
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "scale(1)" : "scale(0.85)",
            transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* Orbit rings */}
          <OrbitRing size={200} duration={900} from={palette.from} to={palette.to} />
          <OrbitRing size={200} duration={1200} from={palette.to} to={palette.from} />

          {/* ── Badge ── */}
          <div
            className="relative mb-6"
            style={{
              animation: badgeReady ? "lvlBadgePop 0.7s cubic-bezier(.22,1,.36,1) forwards, lvlFloat 3s ease-in-out 1s infinite" : "none",
              opacity: badgeReady ? undefined : 0,
            }}
          >
            {/* Glow halo */}
            <div
              className="absolute inset-0 rounded-full blur-2xl scale-125"
              style={{ background: gradientCss, opacity: 0.5, animation: "lvlGlowPulse 2s ease-in-out 1s infinite" }}
            />

            {/* Spinning star ring */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ animation: "lvlStarSpin 8s linear infinite" }}
            >
              {[0,60,120,180,240,300].map(deg => (
                <Star
                  key={deg}
                  className="absolute w-3 h-3 fill-amber-400 text-amber-400"
                  style={{ transform: `rotate(${deg}deg) translateY(-64px)` }}
                />
              ))}
            </div>

            {/* Badge circle */}
            <div
              className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center"
              style={{
                background: gradientCss,
                boxShadow: `0 0 50px 12px ${palette.from}66, inset 0 2px 4px rgba(255,255,255,0.2)`,
              }}
            >
              <Zap className="w-8 h-8 text-white fill-white mb-1 drop-shadow-lg" />
              <span className="text-white font-black text-3xl leading-none drop-shadow-lg">{newLevel}</span>
            </div>
          </div>

          {/* ── Text ── */}
          <div className="space-y-2 mb-8">
            <p
              className="text-xs font-black uppercase tracking-[0.3em] mb-1"
              style={{ color: palette.from }}
            >
              Level Up!
            </p>
            <h2
              className="text-3xl font-black leading-tight"
              style={{
                background: `linear-gradient(90deg, ${palette.from}, ${palette.to}, ${palette.from})`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "lvlShimmer 2s linear infinite",
              }}
            >
              You reached<br />Level {newLevel}
            </h2>
            <p className="text-white/50 text-sm font-bold mt-1">
              {palette.label} — Keep the momentum going!
            </p>
          </div>

          {/* ── Stat pill ── */}
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border mb-8 w-full justify-center"
            style={{ background: `${palette.from}14`, borderColor: `${palette.from}40` }}
          >
            <Trophy className="w-4 h-4" style={{ color: palette.from }} />
            <span className="text-sm font-black text-white/80">
              {(newLevel - 1) * 50} XP reached!
            </span>
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>

          {/* ── CTA ── */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-base relative overflow-hidden group"
            style={{
              background: gradientCss,
              boxShadow: `0 8px 30px ${palette.from}55`,
            }}
          >
            <span
              className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 bg-white/20"
            />
            <span className="relative z-10">Keep Grinding 🔥</span>
            <ChevronRight className="w-5 h-5 relative z-10" />
          </button>

          <p className="text-white/25 text-xs mt-4 font-medium">Tap anywhere to dismiss</p>
        </div>
      </div>
    </>
  );
}
