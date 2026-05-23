'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Star, ChevronRight, BookOpen } from 'lucide-react';

const CHAPTERS = [
  {
    id: 'nationalism-europe',
    title: 'Rise of Nationalism in Europe',
    subject: 'History · Chapter 1',
    grade: 'Class 10',
    emoji: '⚔️',
    color: '#6366f1',
    bgLight: '#e0e7ff',
    acts: 9,
    battles: 1,
    unlocked: true,
    description: 'Master the story from the French Revolution to Bismarck.',
  },
  {
    id: 'french-revolution',
    title: 'The French Revolution',
    subject: 'History · Chapter 1',
    grade: 'Class 9',
    emoji: '🇫🇷',
    color: '#8b5cf6',
    bgLight: '#ede9fe',
    acts: 5,
    battles: 2,
    unlocked: true,
    description: 'Master the story of the fall of the Bourbon monarchy.',
  },
  {
    id: 'nationalism-india',
    title: 'Nationalism in India',
    subject: 'History · Chapter 2',
    grade: 'Class 10',
    emoji: '🇮🇳',
    color: '#f59e0b',
    bgLight: '#fef3c7',
    acts: 5,
    battles: 1,
    unlocked: false,
    description: 'Coming soon — Gandhi, Non-Cooperation, and Swaraj.',
  },
  {
    id: 'making-global-world',
    title: 'The Making of a Global World',
    subject: 'History · Chapter 3',
    grade: 'Class 10',
    emoji: '🌍',
    color: '#10b981',
    bgLight: '#d1fae5',
    acts: 6,
    battles: 1,
    unlocked: false,
    description: 'Coming soon — Trade, colonialism, and the Great Depression.',
  },
];

export default function GauntletIndexPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 flex flex-col items-center text-slate-800 dark:text-slate-100 font-sans"
         style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.9 }}>
      
      {/* Header */}
      <div className="w-full max-w-md px-4 pt-8 pb-6 text-center z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl mb-3 drop-shadow-md">🎓</motion.div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Chapter Gauntlets</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
          The ultimate competitive study modules. Read deep narrative notes and survive the final boss exams.
        </p>
      </div>

      {/* Chapter cards */}
      <div className="w-full max-w-md px-4 space-y-5 z-10">
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
                  className="rounded-3xl overflow-hidden border p-5 active:scale-95 transition-all cursor-pointer shadow-lg hover:shadow-xl bg-white dark:bg-slate-900 dark:border-slate-800"
                  style={{ borderBottomWidth: '6px', borderBottomColor: ch.color }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl shrink-0 mt-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800">{ch.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: ch.color, backgroundColor: ch.color + '22' }}>
                          {ch.grade} · {ch.subject}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-snug mb-1">{ch.title}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">{ch.description}</p>

                      {/* Stats row */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {ch.acts} Levels</span>
                          <span className="flex items-center gap-1.5 text-rose-500">💀 {ch.battles} Boss</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black" style={{ color: ch.color }}>
                          Start <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 p-5 opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl shrink-0 mt-1 grayscale p-3">{ch.emoji}</div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">{ch.grade} · {ch.subject}</span>
                    <h2 className="text-lg font-black text-slate-600 dark:text-slate-300 leading-snug mb-1">{ch.title}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-3">{ch.description}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                      <Lock className="w-3.5 h-3.5" /> Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 font-medium mt-10 px-8 z-10 w-full max-w-md">
        More extremely detailed chapters from Physics & Chemistry coming soon.
      </p>
    </div>
  );
}
