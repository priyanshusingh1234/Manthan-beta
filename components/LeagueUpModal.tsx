'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeagueBadge from '@/components/LeagueBadge';
import { getLeague } from '@/lib/leagues';
import confetti from 'canvas-confetti';

interface Props {
  oldLeagueName: string;
  newLeagueName: string;
  onDismiss: () => void;
}

export default function LeagueUpModal({ oldLeagueName, newLeagueName, onDismiss }: Props) {
  const newLeague = getLeague(9999); // we'll just use name lookup
  const fired = useRef(false);

  // Find league color by name
  const LEAGUE_COLORS: Record<string, string> = {
    Scholar: '#94a3b8', Explorer: '#22c55e', Spark: '#f59e0b',
    Catalyst: '#f97316', Visionary: '#a855f7', Vanguard: '#3b82f6',
    Luminary: '#eab308', Apex: '#ef4444', Pinnacle: '#e879f9',
  };
  const color = LEAGUE_COLORS[newLeagueName] || '#6366f1';

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Burst confetti
    const fire = (angle: number, origin: { x: number }) =>
      confetti({ angle, spread: 60, particleCount: 60, origin: { ...origin, y: 0.6 }, colors: [color, '#fff', '#fbbf24'] });
    setTimeout(() => { fire(60, { x: 0.2 }); fire(120, { x: 0.8 }); }, 400);
    setTimeout(() => { fire(70, { x: 0.1 }); fire(110, { x: 0.9 }); }, 800);
  }, [color]);

  return (
    <AnimatePresence>
      <motion.div
        key="league-up"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(ellipse at center, ${color}22 0%, #000 100%)`,
          padding: 24,
        }}
      >
        {/* Animated particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 5 + 2,
                height: Math.random() * 5 + 2,
                borderRadius: '50%',
                background: color,
              }}
              animate={{ y: [0, -80, 0], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.2, opacity: 0, y: 80 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, maxWidth: 320, width: '100%' }}
        >
          {/* "LEAGUE UP!" pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: color, borderRadius: 999,
              padding: '6px 20px', marginBottom: 28,
              fontSize: 11, fontWeight: 900, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#fff',
              boxShadow: `0 0 30px ${color}88`,
            }}
          >
            ⚡ League Up!
          </motion.div>

          {/* Old → New badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 0.4, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <LeagueBadge name={oldLeagueName} size={64} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>{oldLeagueName}</span>
            </motion.div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              style={{ fontSize: 28, color: '#fff' }}
            >
              →
            </motion.div>

            {/* New badge — big and glowing */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.7 }}
              animate={{ opacity: 1, x: 0, scale: 1.1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 14 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <LeagueBadge name={newLeagueName} size={90} animate />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>{newLeagueName}</span>
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 32 }}
          >
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1 }}>
              You've reached
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color, letterSpacing: '-1px' }}>
              {newLeagueName} League!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              Keep earning points to stay here
            </div>
          </motion.div>

          {/* Dismiss */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onDismiss}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px',
              background: color, borderRadius: 18,
              color: '#fff', fontWeight: 900, fontSize: 16,
              border: 'none', cursor: 'pointer',
              boxShadow: `0 8px 30px ${color}55`,
            }}
          >
            Awesome! Let's go 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
