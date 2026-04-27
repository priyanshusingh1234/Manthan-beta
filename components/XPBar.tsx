'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

import { XP_PER_LEVEL, getLevel } from '@/lib/xp';

const LEVEL_COLORS = [
    { from: '#94a3b8', to: '#64748b', label: 'Rookie' },     // L1
    { from: '#22d3ee', to: '#0891b2', label: 'Scholar' },    // L2
    { from: '#34d399', to: '#059669', label: 'Expert' },     // L3
    { from: '#818cf8', to: '#4f46e5', label: 'Master' },     // L4
    { from: '#fb923c', to: '#ea580c', label: 'Champion' },   // L5
    { from: '#f472b6', to: '#db2777', label: 'Legend' },     // L6
    { from: '#fbbf24', to: '#d97706', label: 'Mythic' },     // L7+
];

function getLevelColor(level: number) {
    return LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)];
}

interface XPBarProps {
    xp: number;
    compact?: boolean; // slim version for feed/cards
}

export default function XPBar({ xp = 0, compact = false }: XPBarProps) {
    const { level, xpInLevel, progressPct } = getLevel(xp);
    const color = getLevelColor(level);

    if (compact) {
        return (
            <div className="flex items-center gap-2 w-full">
                {/* Level badge */}
                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                >
                    <Zap className="w-2.5 h-2.5" />
                    <span className="text-[10px] font-black">Lv.{level}</span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>

                <span className="text-[10px] text-slate-400 font-bold shrink-0">{xpInLevel}/{XP_PER_LEVEL}</span>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                    >
                        <Zap className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white leading-none">
                            Level {level}
                            <span
                                className="ml-2 text-xs font-black px-2 py-0.5 rounded-full text-white"
                                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                            >
                                {color.label}
                            </span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{xp} XP total</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{xpInLevel} / {XP_PER_LEVEL}</p>
                    <p className="text-[10px] text-slate-400">to Lv.{level + 1}</p>
                </div>
            </div>

            {/* Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <motion.div
                    className="h-full rounded-full relative"
                    style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                </motion.div>
            </div>

            {/* Milestone ticks */}
            <div className="flex justify-between mt-1 px-0.5">
                {[0, 25, 50].map(tick => (
                    <span key={tick} className="text-[9px] text-slate-300 dark:text-slate-600 font-bold">
                        {tick}
                    </span>
                ))}
            </div>
        </div>
    );
}
