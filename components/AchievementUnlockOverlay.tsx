'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFirstVictory, CardDuelHero, CardFinalBoss } from '@/components/AchievementCards';

/* ─── Achievement definitions ─────────────────────────────────────────────── */
export type AchievementId = 'first_victory' | 'duel_hero' | 'final_boss';

const ACHIEVEMENTS: Record<AchievementId, { title: string; subtitle: string; rarity: string; rarityColor: string }> = {
  first_victory: {
    title: 'FIRST VICTORY',
    subtitle: 'You solved your very first question. The journey begins.',
    rarity: 'COMMON',
    rarityColor: '#64748b',
  },
  duel_hero: {
    title: 'DUEL HERO',
    subtitle: 'Five duels won. You are a force on the battlefield.',
    rarity: 'COMMON',
    rarityColor: '#d97706',
  },
  final_boss: {
    title: 'FINAL BOSS',
    subtitle: '20 questions conquered. Students fear your name.',
    rarity: 'UNCOMMON',
    rarityColor: '#7c3aed',
  },
};

/* ─── Queue helpers (localStorage) ─────────────────────────────────────────── */
const QUEUE_KEY = 'pending_achievement_unlocks';

export function queueAchievementUnlock(id: AchievementId) {
  if (typeof window === 'undefined') return;
  const existing: AchievementId[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  const shown: AchievementId[] = JSON.parse(localStorage.getItem('shown_achievements') || '[]');
  if (!existing.includes(id) && !shown.includes(id)) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, id]));
    window.dispatchEvent(new Event('check_achievements'));
  }
}

function popNextAchievement(): AchievementId | null {
  if (typeof window === 'undefined') return null;
  const queue: AchievementId[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return null;
  const [next, ...rest] = queue;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(rest));
  const shown: AchievementId[] = JSON.parse(localStorage.getItem('shown_achievements') || '[]');
  localStorage.setItem('shown_achievements', JSON.stringify([...shown, next]));
  return next;
}

/* ─── Card renderer ─────────────────────────────────────────────────────────── */
function AchievementCardPreview({ id }: { id: AchievementId }) {
  const shared = { earned: true, progress: 1 };
  if (id === 'first_victory') return <CardFirstVictory {...shared} />;
  if (id === 'duel_hero')     return <CardDuelHero {...shared} current={5} />;
  if (id === 'final_boss')    return <CardFinalBoss {...shared} current={20} />;
  return null;
}

/* ─── Main overlay component ─────────────────────────────────────────────────── */
export default function AchievementUnlockOverlay() {
  const [current, setCurrent] = useState<AchievementId | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Check queue on mount + after navigation + on custom event
  useEffect(() => {
    const check = () => {
      // Don't pop if we are already showing one
      setCurrent((prev) => {
          if (prev) return prev;
          const next = popNextAchievement();
          if (next) {
              setTimeout(() => setShowContent(true), 400);
              return next;
          }
          return null;
      });
    };
    
    // Small delay so the home page renders first
    const t = setTimeout(check, 1200);
    
    // Listen for real-time unlocks
    window.addEventListener('check_achievements', check);
    
    return () => {
        clearTimeout(t);
        window.removeEventListener('check_achievements', check);
    };
  }, []);

  const dismiss = () => {
    setShowContent(false);
    setTimeout(() => {
      setCurrent(null);
      // Check if there's another one queued
      setTimeout(() => {
        const next = popNextAchievement();
        if (next) {
          setCurrent(next);
          setTimeout(() => setShowContent(true), 400);
        }
      }, 600);
    }, 500);
  };

  const info = current ? ACHIEVEMENTS[current] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #0f0520 0%, #000000 100%)',
            padding: '24px',
          }}
          onClick={dismiss}
        >
          {/* Particle background */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  borderRadius: '50%',
                  background: info?.rarityColor || '#7c3aed',
                }}
                animate={{ y: [0, -60, 0], opacity: [0, 0.8, 0], scale: [0, 1.4, 0] }}
                transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>

          {/* Spotlight glow behind card */}
          <motion.div
            style={{
              position: 'absolute',
              width: 400, height: 400,
              background: `radial-gradient(circle, ${info?.rarityColor}55, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
            animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <AnimatePresence>
            {showContent && (
              <motion.div
                key="content"
                initial={{ scale: 0.3, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -40 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{ width: '100%', maxWidth: 340, position: 'relative', zIndex: 10 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Top label */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ textAlign: 'center', marginBottom: 24 }}
                >
                  <div style={{
                    display: 'inline-block',
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: '#fff',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 999, padding: '5px 16px',
                    backdropFilter: 'blur(8px)',
                  }}>
                    🏆 Achievement Unlocked
                  </div>
                </motion.div>

                {/* The animated card */}
                <AchievementCardPreview id={current!} />

                {/* Title + subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ textAlign: 'center', marginTop: 28 }}
                >
                  <div style={{
                    display: 'inline-block',
                    fontSize: 9, fontWeight: 900, letterSpacing: '0.15em',
                    color: '#fff', background: info?.rarityColor,
                    borderRadius: 999, padding: '3px 12px', marginBottom: 10,
                  }}>
                    {info?.rarity}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>
                    {info?.title}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>
                    {info?.subtitle}
                  </div>
                </motion.div>

                {/* Dismiss button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={dismiss}
                  style={{
                    marginTop: 32, width: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 16, padding: '14px',
                    color: '#fff', fontWeight: 900, fontSize: 15,
                    cursor: 'pointer', backdropFilter: 'blur(8px)',
                    letterSpacing: '0.02em',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.18)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Claim & Continue →
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                >
                  Tap anywhere to dismiss
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
