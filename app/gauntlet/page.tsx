'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swords, Lock, Star, ChevronRight } from 'lucide-react';

const CHAPTERS = [
  {
    id: 'nationalism-europe',
    title: 'Rise of Nationalism in Europe',
    subject: 'History · Chapter 1',
    grade: 'Class 10',
    emoji: '⚔️',
    color: '#6366f1',
    glow: '#6366f144',
    acts: 3,
    battles: 3,
    xp: 135,
    unlocked: true,
    description: 'From the French Revolution to Bismarck — fight your way through the birth of modern nations.',
    enemies: ['French Royal Guard', 'Duke Metternich', '💀 Bismarck BOSS'],
  },
  {
    id: 'nationalism-india',
    title: 'Nationalism in India',
    subject: 'History · Chapter 2',
    grade: 'Class 10',
    emoji: '🇮🇳',
    color: '#f59e0b',
    glow: '#f59e0b44',
    acts: 3,
    battles: 3,
    xp: 135,
    unlocked: false,
    description: 'Coming soon — Gandhi, Non-Cooperation, Civil Disobedience, and the fight for Swaraj.',
    enemies: ['British Viceroy', 'Imperial General', '💀 Lord Mountbatten BOSS'],
  },
  {
    id: 'making-global-world',
    title: 'The Making of a Global World',
    subject: 'History · Chapter 3',
    grade: 'Class 10',
    emoji: '🌍',
    color: '#10b981',
    glow: '#10b98144',
    acts: 3,
    battles: 3,
    xp: 135,
    unlocked: false,
    description: 'Coming soon — Trade, colonialism, the Great Depression, and rebuilding the post-war world.',
    enemies: ['Colonial Merchant', 'The Great Depression', '💀 Wall Street Boss'],
  },
];

export default function GauntletIndexPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d0d2e 0%, #07070f 100%)' }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl mb-3">⚔️</motion.div>
        <h1 className="text-2xl font-black text-white">Chapter Gauntlet</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Defeat enemies. Master history. Earn XP.
        </p>
        <p className="text-xs text-indigo-400 font-bold mt-1">Class 10 · Social Science</p>
      </div>

      {/* How it works strip */}
      <div className="mx-4 mb-6 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 p-4">
        <div className="flex justify-around text-center">
          {[['📖', 'Read Acts'], ['⚔️', 'Battle enemies'], ['🧠', 'Answer MCQs'], ['⭐', 'Earn XP']].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-bold text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter cards */}
      <div className="px-4 space-y-4">
        {CHAPTERS.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {ch.unlocked ? (
              <Link href={`/gauntlet/${ch.id}`}>
                <div
                  className="rounded-3xl overflow-hidden border p-5 active:scale-95 transition-transform cursor-pointer"
                  style={{ background: `radial-gradient(ellipse at top left, ${ch.glow} 0%, #0f0f1f 100%)`, borderColor: ch.color + '44' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl shrink-0 mt-1">{ch.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ch.color }}>{ch.grade} · {ch.subject}</span>
                      </div>
                      <h2 className="text-base font-black text-white leading-snug mb-1">{ch.title}</h2>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">{ch.description}</p>

                      {/* Enemies preview */}
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {ch.enemies.map(e => (
                          <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ch.color + '22', color: ch.color, border: `1px solid ${ch.color}44` }}>
                            {e}
                          </span>
                        ))}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs font-bold text-slate-400">
                          <span>📖 {ch.acts} Acts</span>
                          <span>⚔️ {ch.battles} Battles</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {ch.xp} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black" style={{ color: ch.color }}>
                          Play <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                className="rounded-3xl overflow-hidden border p-5 opacity-50 cursor-not-allowed"
                style={{ background: '#0f0f1f', borderColor: '#334155' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl shrink-0 mt-1 grayscale">{ch.emoji}</div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{ch.grade} · {ch.subject}</span>
                    <h2 className="text-base font-black text-slate-500 leading-snug mb-1">{ch.title}</h2>
                    <p className="text-xs text-slate-600 font-medium mb-3">{ch.description}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Lock className="w-3.5 h-3.5" /> Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 font-medium mt-8 px-8">
        More chapters from Physics, Chemistry & English coming soon.
      </p>
    </div>
  );
}
