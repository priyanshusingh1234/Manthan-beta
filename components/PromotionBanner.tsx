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
const WELCOME_KEY = 'league_welcome_shown_v1';  // bump version to re-show for all users
const PROMO_KEY = 'promo_shown_for_league';

type PromoState = { from: string | null; to: string; isWelcome: boolean };

export default function PromotionBanner() {
  const router = useRouter();
  const [promo, setPromo] = useState<PromoState | null>(null);
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
        const color = getLeague(pts).color;

        const lastLeague = localStorage.getItem(CACHE_KEY);
        const welcomeShown = localStorage.getItem(WELCOME_KEY);

        const fireConfetti = (c: string) => {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: [c, '#fff', '#fbbf24'] });
          setTimeout(() => confetti({ particleCount: 70, spread: 100, origin: { y: 0.55 }, angle: 60, colors: [c, '#fff'] }), 400);
          setTimeout(() => confetti({ particleCount: 70, spread: 100, origin: { y: 0.55 }, angle: 120, colors: [c, '#fff'] }), 700);
        };

        // ── FIRST TIME: show welcome to current league ──
        if (!welcomeShown) {
          localStorage.setItem(WELCOME_KEY, '1');
          localStorage.setItem(CACHE_KEY, currentLeague);
          setPromo({ from: null, to: currentLeague, isWelcome: true });
          setTimeout(() => { setShowContent(true); fireConfetti(color); }, 1200);
          return;
        }

        // ── PROMOTION: league went up ──
        if (lastLeague && lastLeague !== currentLeague) {
          const promoShownFor = localStorage.getItem(PROMO_KEY);
          const oldIdx = LEAGUE_NAMES.indexOf(lastLeague);
          const newIdx = LEAGUE_NAMES.indexOf(currentLeague);
          if (newIdx > oldIdx && promoShownFor !== currentLeague) {
            localStorage.setItem(PROMO_KEY, currentLeague);
            localStorage.setItem(CACHE_KEY, currentLeague);
            setPromo({ from: lastLeague, to: currentLeague, isWelcome: false });
            setTimeout(() => { setShowContent(true); fireConfetti(color); }, 800);
            return;
          }
        }

        localStorage.setItem(CACHE_KEY, currentLeague);
      } catch (e) {
        console.error('[PromotionBanner]', e);
      }
    };

    const t = setTimeout(check, 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShowContent(false);
    setTimeout(() => setPromo(null), 500);
  };

  if (!promo) return null;

  const color = getLeague(0).color; // fallback, overridden below
  const leagueColor: Record<string, string> = {
    Scholar: '#94a3b8', Explorer: '#22c55e', Spark: '#f59e0b',
    Catalyst: '#f97316', Visionary: '#a855f7', Vanguard: '#3b82f6',
    Luminary: '#eab308', Apex: '#ef4444', Pinnacle: '#e879f9',
  };
  const c = leagueColor[promo.to] || '#6366f1';

  return (
    <AnimatePresence>
      {promo && (
        <motion.div
          key="promo-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9990] flex items-end justify-center p-4 pb-10"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
          onClick={dismiss}
        >
          <AnimatePresence>
            {showContent && (
              <motion.div
                key="promo-card"
                initial={{ y: 140, opacity: 0, scale: 0.92 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative"
                style={{ background: 'linear-gradient(160deg, #0c0118 0%, #150828 100%)', border: `1.5px solid ${c}44` }}
              >
                {/* Top glow line */}
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <motion.div key={i} className="absolute rounded-full"
                      style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: Math.random() * 5 + 2, height: Math.random() * 5 + 2, background: c }}
                      animate={{ y: [0, -60, 0], opacity: [0, 0.9, 0], scale: [0, 1.4, 0] }}
                      transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    />
                  ))}
                </div>

                <div className="p-7 flex flex-col items-center text-center relative">
                  {/* Pill label */}
                  <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6"
                    style={{ background: `${c}25`, color: c, border: `1px solid ${c}45` }}>
                    {promo.isWelcome ? '🏅 Welcome to Leagues!' : '⚡ You\'ve been promoted!'}
                  </motion.div>

                  {/* Badge(s) */}
                  {promo.isWelcome ? (
                    /* Welcome: single large badge */
                    <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 16 }}
                      className="mb-6" style={{ filter: `drop-shadow(0 0 28px ${c}99)` }}>
                      <LeagueBadge name={promo.to} size={110} animate />
                    </motion.div>
                  ) : (
                    /* Promotion: from → to */
                    <div className="flex items-center gap-5 mb-6">
                      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 0.45, x: 0 }} transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-1.5">
                        <LeagueBadge name={promo.from!} size={58} />
                        <span className="text-[10px] text-white/35 font-bold">{promo.from}</span>
                      </motion.div>
                      <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.32, type: 'spring' }} className="text-2xl text-white/60">→</motion.span>
                      <motion.div initial={{ opacity: 0, x: 24, scale: 0.65 }} animate={{ opacity: 1, x: 0, scale: 1.08 }}
                        transition={{ delay: 0.38, type: 'spring', stiffness: 200, damping: 14 }}
                        className="flex flex-col items-center gap-1.5" style={{ filter: `drop-shadow(0 0 20px ${c}aa)` }}>
                        <LeagueBadge name={promo.to} size={86} animate />
                        <span className="text-xs font-black" style={{ color: c }}>{promo.to}</span>
                      </motion.div>
                    </div>
                  )}

                  {/* Text */}
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    {promo.isWelcome ? (
                      <>
                        <p className="text-2xl font-black text-white leading-tight">You're in</p>
                        <p className="text-3xl font-black leading-tight" style={{ color: c }}>{promo.to} League</p>
                        <p className="text-white/45 text-sm font-medium mt-2.5 leading-relaxed">
                          Earn points every month to climb leagues.<br />Rankings reset on the 1st of each month.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-white leading-tight">Welcome to</p>
                        <p className="text-3xl font-black leading-tight" style={{ color: c }}>{promo.to} League!</p>
                        <p className="text-white/45 text-sm font-medium mt-2.5 leading-relaxed">
                          Keep earning points to stay here.<br />Rankings reset on the 1st of each month.
                        </p>
                      </>
                    )}
                  </motion.div>

                  {/* Buttons */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.72 }}
                    className="mt-7 w-full space-y-2.5">
                    <button onClick={() => { dismiss(); router.push('/league'); }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm active:scale-95 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${c}ee, ${c}99)`, boxShadow: `0 10px 28px ${c}44` }}>
                      🏆 See Full League Details
                    </button>
                    <button onClick={dismiss}
                      className="w-full py-2.5 font-bold text-white/40 text-sm active:scale-95 transition-transform">
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
