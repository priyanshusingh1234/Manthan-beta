'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Minus } from 'lucide-react';
import Image from 'next/image';

type DuelResult = {
  id: string;
  subject: string;
  isDraw: boolean;
  winner: { name: string; username: string; avatar: string | null } | null;
  loser: { name: string; username: string; avatar: string | null } | null;
  challenger: { name: string; username: string };
  challenged: { name: string; username: string };
  winnerCorrect: boolean;
  loserCorrect: boolean;
  createdAt: string;
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#6366f1',
  Science: '#10b981',
  History: '#f59e0b',
  English: '#3b82f6',
  Physics: '#8b5cf6',
  Chemistry: '#ec4899',
  Biology: '#14b8a6',
  Geography: '#f97316',
  Economics: '#84cc16',
};

function Avatar({ src, name, size = 8 }: { src: string | null; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0`}>
        <Image src={src} alt={name} width={32} height={32} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shrink-0`}>
      <span className="text-white font-black text-sm">{name[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentDuelsCard() {
  const [duels, setDuels] = useState<DuelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(3); // show 3, expandable to all

  useEffect(() => {
    fetch('/api/duel/recent')
      .then(r => r.json())
      .then(json => {
        if (json.duels) setDuels(json.duels);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="mb-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent Duels</span>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!duels.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Swords className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">Battle Feed</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Latest Duel Results</p>
            </div>
          </div>
          <Link href="/duels" className="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors">
            View All →
          </Link>
        </div>

        {/* Duel list */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          <AnimatePresence>
            {duels.slice(0, visible).map((duel, i) => {
              const subjectColor = SUBJECT_COLORS[duel.subject] || '#6366f1';
              return (
                <motion.div
                  key={duel.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Subject pill */}
                  <div
                    className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider min-w-[52px] text-center"
                    style={{ background: subjectColor + '18', color: subjectColor }}
                  >
                    {duel.subject?.slice(0, 6)}
                  </div>

                  {/* Winner */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={duel.isDraw ? null : duel.winner?.avatar || null} name={duel.isDraw ? duel.challenger.name : duel.winner?.name || '?'} size={8} />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate leading-none">
                        {duel.isDraw ? duel.challenger.name : duel.winner?.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {duel.isDraw ? 'Draw' : '🏆 Won'}
                      </p>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    duel.isDraw
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'bg-gradient-to-br from-rose-500 to-orange-500'
                  }`}>
                    {duel.isDraw
                      ? <Minus className="w-3.5 h-3.5 text-slate-400" />
                      : <Swords className="w-3.5 h-3.5 text-white" />
                    }
                  </div>

                  {/* Loser */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate leading-none">
                        {duel.isDraw ? duel.challenged.name : duel.loser?.name}
                      </p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium mt-0.5">
                        {timeAgo(duel.createdAt)}
                      </p>
                    </div>
                    <Avatar src={duel.isDraw ? null : duel.loser?.avatar || null} name={duel.isDraw ? duel.challenged.name : duel.loser?.name || '?'} size={8} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more */}
        {duels.length > visible && (
          <button
            onClick={() => setVisible(duels.length)}
            className="w-full py-3 text-xs font-black text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors border-t border-slate-50 dark:border-slate-800/50"
          >
            Show {duels.length - visible} more results ↓
          </button>
        )}
      </div>
    </motion.div>
  );
}
