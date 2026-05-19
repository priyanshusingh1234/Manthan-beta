'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { getLeague } from '@/lib/leagues';
import LeagueBadge from '@/components/LeagueBadge';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

const LEAGUE_NAMES = ['Scholar','Explorer','Spark','Catalyst','Visionary','Vanguard','Luminary','Apex','Pinnacle'];
const CACHE_KEY = 'last_known_league';
const PROMO_SHOWN_KEY = 'promo_shown_for_league';

export default function PromotionBanner() {
  const router = useRouter();
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('monthly_points, monthly_points_month')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;

        const currentMonth = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 7);
        const pts = profile.monthly_points_month === currentMonth ? (Number(profile.monthly_points) || 0) : 0;
        const currentLeague = getLeague(pts).name;

        const lastLeague = localStorage.getItem(CACHE_KEY);
        const promoShownFor = localStorage.getItem(PROMO_SHOWN_KEY);

        // Show promo if: we have a previous league, it changed upward, and we haven't shown this promo yet
        if (
          lastLeague &&
          lastLeague !== currentLeague &&
          promoShownFor !== currentLeague
        ) {
          const oldIdx = LEAGUE_NAMES.indexOf(lastLeague);
          const newIdx = LEAGUE_NAMES.indexOf(currentLeague);
          if (newIdx > oldIdx) {
            setPromo({ from: lastLeague, to: currentLeague });
            localStorage.setItem(PROMO_SHOWN_KEY, currentLeague); // mark as shown
            // Fire confetti after mount
            setTimeout(() => {
              setShowContent(true);
              const color = getLeague(pts).color;
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: [color, '#fff', '#fbbf24'] });
              setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { y: 0.5 }, angle: 60, colors: [color, '#fff'] }), 400);
              setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { y: 0.5 }, angle: 120, colors: [color, '#fff'] }), 600);
            }, 800);
          }
        }

        // Always update the stored league
        localStorage.setItem(CACHE_KEY, currentLeague);
      } catch (e) {
        console.error('[PromotionBanner]', e);
      }
    };

    // Slight delay so page renders first
    const t = setTimeout(check, 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShowContent(false);
    setTimeout(() => setPromo(null), 500);
  };

  if (!promo) return null;

  const newLeague = getLeague(250); // placeholder, we use promo.to
  const LEAGUE_COLORS: Record<string, string> = {
    Scholar: '#94a3b8', Explorer: '#22c55e', Spark: '#f59e0b',
    Catalyst: '#f97316', Visionary: '#a855f7', Vanguard: '#3b82f6',
    Luminary: '#eab308', Apex: '#ef4444', Pinnacle: '#e879f9',
  };
  const color = LEAGUE_COLORS[promo.to] || '#6366f1';

  return (
    <AnimatePresence>
      {promo && (
        <motion.div
          key="promo-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9990] flex items-end justify-center p-4 pb-8"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={dismiss}
        >
          <AnimatePresence>
            {showContent && (
              <motion.div
                key="promo-card"
                initial={{ y: 120, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 80, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: `linear-gradient(145deg, #0f0520 0%, #1a0535 100%)`, border: `1.5px solid ${color}55` }}
              >
                {/* Glowing top bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

                <div className="p-6 flex flex-col items-center text-center">
                  {/* Particles bg */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div key={i}
                        className="absolute rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                          width: Math.random() * 4 + 2, height: Math.random() * 4 + 2,
                          background: color,
                        }}
                        animate={{ y: [0, -50, 0], opacity: [0, 0.8, 0], scale: [0, 1.2, 0] }}
                        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                      />
                    ))}
                  </div>

                  {/* Promotion pill */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
                    style={{ background: `${color}30`, color, border: `1px solid ${color}50` }}
                  >
                    ⚡ You've been promoted!
                  </motion.div>

                  {/* Badges: from → to */}
                  <div className="flex items-center gap-4 mb-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 0.5, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <LeagueBadge name={promo.from} size={56} />
                      <span className="text-[10px] text-white/40 font-bold">{promo.from}</span>
                    </motion.div>

                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="text-2xl"
                    >→</motion.span>

                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.7 }}
                      animate={{ opacity: 1, x: 0, scale: 1.05 }}
                      transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 14 }}
                      className="flex flex-col items-center gap-1"
                      style={{ filter: `drop-shadow(0 0 16px ${color}88)` }}
                    >
                      <LeagueBadge name={promo.to} size={80} animate />
                      <span className="text-xs font-black" style={{ color }}>{promo.to}</span>
                    </motion.div>
                  </div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-2xl font-black text-white leading-tight">Welcome to</p>
                    <p className="text-3xl font-black leading-tight" style={{ color }}>{promo.to} League!</p>
                    <p className="text-white/50 text-sm font-medium mt-2">
                      Keep earning points to stay here.<br />Rankings reset every month.
                    </p>
                  </motion.div>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 w-full space-y-2"
                  >
                    <button
                      onClick={() => { dismiss(); router.push('/league'); }}
                      className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 8px 24px ${color}44` }}
                    >
                      🏆 See Full League Details
                    </button>
                    <button
                      onClick={dismiss}
                      className="w-full py-2.5 rounded-2xl font-bold text-white/50 text-sm active:scale-95 transition-all"
                    >
                      Maybe Later
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
