'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Flame, Zap, RotateCcw, X } from 'lucide-react';

// ── Particle component ───────────────────────────────────────────────────────
function Particle({ delay, x }: { delay: number; x: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: '-10px',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: `hsl(${20 + Math.random() * 30}, 90%, 55%)`,
        animation: `floatUp ${1.2 + Math.random()}s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

// ── Main overlay ─────────────────────────────────────────────────────────────
export default function StreakLostOverlay() {
  const [show, setShow] = useState(false);
  const [lostStreak, setLostStreak] = useState(0);
  const [closing, setClosing] = useState(false);
  const [flame1, setFlame1] = useState(false);
  const checked = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const check = async () => {
      // Only show once per day
      const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const seenKey = `streak_lost_shown_${today}`;
      if (typeof window !== 'undefined' && localStorage.getItem(seenKey)) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('streak_count, daily_solve_date, last_streak_count')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000)
        .toISOString().slice(0, 10);

      // Streak is lost if:
      // - current streak is 0 AND last known streak was > 0
      // - OR daily_solve_date is before yesterday (missed a day)
      const streakIsZero = Number(profile.streak_count) === 0;
      const lastStreak = Number(profile.last_streak_count) || 0;
      const missedDay = profile.daily_solve_date && profile.daily_solve_date < yesterday;

      if ((streakIsZero && lastStreak > 0) || (missedDay && lastStreak > 0)) {
        setLostStreak(lastStreak || 1);
        setShow(true);
        // Mark as shown for today
        if (typeof window !== 'undefined') localStorage.setItem(seenKey, '1');
        // Animate flame after mount
        setTimeout(() => setFlame1(true), 100);
      }
    };

    // Small delay so page loads first
    setTimeout(check, 1500);
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setShow(false), 500);
  };

  const solveNow = () => {
    close();
    setTimeout(() => router.push('/questions'), 500);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-120px) scale(0.3); opacity: 0; }
        }
        @keyframes shakeIn {
          0%   { transform: scale(0.7) rotate(-4deg); opacity: 0; }
          40%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
          70%  { transform: scale(0.96) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOutDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(40px) scale(0.95); }
        }
        @keyframes cracklePulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.05); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 40px 10px rgba(239,68,68,0.3); }
          50%       { box-shadow: 0 0 80px 20px rgba(249,115,22,0.5); }
        }
        .streak-overlay-enter { animation: shakeIn 0.6s cubic-bezier(.17,.67,.34,1.3) forwards; }
        .streak-overlay-exit  { animation: fadeOutDown 0.45s ease-in forwards; }
        .fade-up-1 { animation: fadeInUp 0.5s ease 0.4s both; }
        .fade-up-2 { animation: fadeInUp 0.5s ease 0.55s both; }
        .fade-up-3 { animation: fadeInUp 0.5s ease 0.7s both; }
        .fade-up-4 { animation: fadeInUp 0.5s ease 0.85s both; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          animation: closing ? 'fadeOutDown 0.4s ease-in forwards' : undefined,
        }}
        onClick={close}
      >
        {/* Card */}
        <div
          className={closing ? 'streak-overlay-exit' : 'streak-overlay-enter'}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 380,
            borderRadius: 32,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #1a0a00 0%, #2d0f00 40%, #1a0505 100%)',
            border: '1px solid rgba(249,115,22,0.25)',
            animation: closing
              ? 'streak-overlay-exit 0.45s ease-in forwards'
              : 'shakeIn 0.6s cubic-bezier(.17,.67,.34,1.3) forwards, glowPulse 2.5s ease-in-out 0.8s infinite',
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X size={16} />
          </button>

          {/* Top crackle glow */}
          <div style={{
            position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)',
            animation: 'cracklePulse 2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Particles */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Particle key={i} delay={i * 0.15} x={5 + i * 8} />
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '40px 28px 32px', textAlign: 'center', position: 'relative', zIndex: 2 }}>

            {/* Cracked flame icon */}
            <div className="fade-up-1" style={{ marginBottom: 20, display: 'inline-block', position: 'relative' }}>
              {/* Outer glow ring */}
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)',
                animation: 'cracklePulse 1.8s ease-in-out infinite',
              }} />
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(239,68,68,0.3)',
                position: 'relative',
              }}>
                <Flame size={44} color="#ef4444" style={{ opacity: flame1 ? 1 : 0, transition: 'opacity 0.4s' }} />
                {/* Crack overlay */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }} viewBox="0 0 90 90">
                  <path d="M45 10 L42 35 L50 38 L40 70" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M55 20 L52 40 L58 42" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="fade-up-2" style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 13, fontWeight: 900, letterSpacing: '0.15em',
                color: '#ef4444', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Streak Lost
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: '#fff',
                lineHeight: 1.1, letterSpacing: '-0.02em',
              }}>
                Your {lostStreak}-day<br />streak is gone 💔
              </div>
            </div>

            {/* Body */}
            <div className="fade-up-3" style={{
              fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
              marginTop: 12, marginBottom: 28, fontWeight: 500,
            }}>
              You missed a day and your flame went out.<br />
              But every champion comes back stronger. ⚡
            </div>

            {/* Stats row */}
            <div className="fade-up-3" style={{
              display: 'flex', gap: 12, marginBottom: 28,
            }}>
              <div style={{
                flex: 1, background: 'rgba(239,68,68,0.1)', borderRadius: 16,
                padding: '14px 12px', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{lostStreak}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>Days lost</div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(249,115,22,0.1)', borderRadius: 16,
                padding: '14px 12px', border: '1px solid rgba(249,115,22,0.2)',
              }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f97316' }}>0</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>Current streak</div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(234,179,8,0.1)', borderRadius: 16,
                padding: '14px 12px', border: '1px solid rgba(234,179,8,0.2)',
              }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#eab308' }}>2</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>To rebuild</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="fade-up-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={solveNow}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  color: '#fff', fontWeight: 900, fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(239,68,68,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(239,68,68,0.4)';
                }}
              >
                <Flame size={20} fill="white" />
                Start New Streak Now
              </button>

              <button
                onClick={close}
                style={{
                  width: '100%', padding: '13px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.45)', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
