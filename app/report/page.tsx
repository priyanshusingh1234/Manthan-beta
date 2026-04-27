'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
    Trophy, Target, TrendingUp, TrendingDown, Calendar,
    AlertTriangle, ArrowLeft, Share2, Minus, ChevronUp, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ── Small pure-CSS bar chart ─────────────────────────────────── */
function BarChart({ current, previous }: { current: { label: string; total: number; correct: number }[]; previous: { label: string; total: number; correct: number }[] }) {
    const maxVal = Math.max(1, ...current.map(d => d.total), ...previous.map(d => d.total));
    return (
        <div className="w-full">
            <div className="flex items-end justify-between gap-1">
                {current.map((day, i) => {
                    const prevDay = previous[i];
                    const currentH = Math.max(4, (day.total / maxVal) * 100);
                    const prevH = Math.max(4, (prevDay.total / maxVal) * 100);
                    return (
                        <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                            {/* Bar pair */}
                            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 100 }}>
                                {/* Previous week — grey */}
                                <div
                                    className="flex-1 rounded-t-md bg-slate-700/50"
                                    style={{ height: `${prevH}%`, transition: 'height 0.8s ease' }}
                                />
                                {/* This week — coloured */}
                                <div
                                    className="flex-1 rounded-t-md"
                                    style={{
                                        height: `${currentH}%`,
                                        background: day.total > 0
                                            ? (day.correct / day.total >= 0.7 ? '#10b981' : '#6366f1')
                                            : '#334155',
                                        transition: 'height 0.8s ease',
                                    }}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{day.label}</span>
                        </div>
                    );
                })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                    <span className="text-[10px] text-slate-400 font-bold">This Week</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-slate-700/70" />
                    <span className="text-[10px] text-slate-400 font-bold">Last Week</span>
                </div>
            </div>
        </div>
    );
}

/* ── Circular Score Ring ──────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
    const r = 56;
    const circ = 2 * Math.PI * r;
    const offset = circ - (circ * Math.min(score, 100)) / 100;
    const strokeColor =
        color.includes('purple') ? '#a855f7' :
        color.includes('green') ? '#22c55e' :
        color.includes('blue') ? '#6366f1' :
        color.includes('orange') ? '#f97316' : '#ef4444';

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                    cx="64" cy="64" r={r} fill="none"
                    stroke={strokeColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{score}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score</span>
            </div>
        </div>
    );
}

/* ── Delta chip (▲ / ▼ / —) ─────────────────────────────────── */
function Delta({ current, previous, unit = '' }: { current: number; previous: number; unit?: string }) {
    const diff = current - previous;
    if (diff === 0 || previous === 0) return <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5"><Minus className="w-3 h-3" /> Same</span>;
    const positive = diff > 0;
    return (
        <span className={`text-[10px] font-black flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {positive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(diff)}{unit}
        </span>
    );
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, unit, deltaVal, deltaPrev }: any) {
    return (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-white">{value}{unit}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <Delta current={deltaVal} previous={deltaPrev} unit={unit} />
        </div>
    );
}

const BADGE_COLORS: Record<string, string> = {
    'Excellent': 'from-purple-500 to-fuchsia-600',
    'Very Good': 'from-emerald-400 to-green-600',
    'Good': 'from-indigo-400 to-blue-600',
    'Not Bad': 'from-orange-400 to-amber-600',
    'Poor': 'from-red-500 to-rose-600',
    'Not Rated': 'from-slate-400 to-slate-600',
};

export default function WeeklyReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { if (mounted) setLoading(false); return; }
            fetch('/api/report', { headers: { 'Authorization': `Bearer ${session.access_token}` } })
                .then(r => r.json())
                .then(data => { if (mounted) { setReport(data); setLoading(false); } });
        });
        return () => { mounted = false; };
    }, []);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    /* ── No data ── */
    if (!report?.rating || report.rating.label === 'Not Rated') {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-slate-600 mb-6" />
                <h1 className="text-2xl font-black text-white mb-2">No Data Yet</h1>
                <p className="text-slate-400 max-w-sm mb-8">Solve some questions this week to unlock your Dheeyudha Report Card.</p>
                <button onClick={() => router.push('/feed')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                    Start Solving
                </button>
            </div>
        );
    }

    const { stats, prevStats, rating } = report;
    const badgeGradient = BADGE_COLORS[rating.label] || BADGE_COLORS['Not Rated'];

    const handleShare = async () => {
        const text = `My Dheeyudha Weekly Report: ${rating.label}! Score: ${stats.score}/100 | Accuracy: ${stats.accuracy}% | ${stats.correctAttempts} correct answers. Can you beat me? 🔥`;
        try {
            if (navigator.share) { await navigator.share({ title: 'My Dheeyudha Report Card', text }); return; }
            await navigator.clipboard.writeText(text);
        } catch { /* user cancelled */ }
    };

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pb-12 overflow-x-hidden">

            {/* ── Top App Bar (Material You style) ── */}
            <div
                className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
                style={{ background: 'rgba(10,10,18,0.92)', backdropFilter: 'blur(20px)' }}
            >
                <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="font-black text-lg text-white flex-1">Weekly Report Card</h1>
                <button onClick={handleShare} className="w-9 h-9 rounded-full bg-indigo-600/80 border border-indigo-500/40 flex items-center justify-center active:scale-90 transition-transform">
                    <Share2 className="w-4 h-4 text-white" />
                </button>
            </div>

            <div className="px-4 space-y-4 pt-2 max-w-lg mx-auto">

                {/* ── Hero Rating Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl overflow-hidden p-6 border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #12121e 0%, #1a1a2e 100%)' }}
                >
                    {/* Glow blob */}
                    <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${badgeGradient} opacity-20 blur-3xl pointer-events-none`} />

                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Rating</p>
                            <h2 className={`text-4xl font-black bg-gradient-to-r ${badgeGradient} bg-clip-text text-transparent mb-2`}>
                                {rating.label}
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed">{rating.message}</p>
                        </div>
                        <ScoreRing score={stats.score} color={rating.color} />
                    </div>

                    {/* Week-over-week score delta */}
                    {prevStats.score > 0 && (
                        <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${stats.score >= prevStats.score ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stats.score >= prevStats.score
                                ? <><TrendingUp className="w-4 h-4" /> +{stats.score - prevStats.score} pts vs last week</>
                                : <><TrendingDown className="w-4 h-4" /> {stats.score - prevStats.score} pts vs last week</>
                            }
                        </div>
                    )}
                </motion.div>

                {/* ── Stats Grid ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <StatCard
                        icon={Target} iconColor="bg-blue-500/20 text-blue-400"
                        label="Attempted" value={stats.totalAttempts} unit=""
                        deltaVal={stats.totalAttempts} deltaPrev={prevStats.totalAttempts}
                    />
                    <StatCard
                        icon={Trophy} iconColor="bg-emerald-500/20 text-emerald-400"
                        label="Accuracy" value={stats.accuracy} unit="%"
                        deltaVal={stats.accuracy} deltaPrev={prevStats.accuracy}
                    />
                    <StatCard
                        icon={Calendar} iconColor="bg-amber-500/20 text-amber-400"
                        label="Active Days" value={stats.activeDays} unit=""
                        deltaVal={stats.activeDays} deltaPrev={prevStats.activeDays}
                    />
                </motion.div>

                {/* ── Daily Bar Chart Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-3xl p-5 border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #12121e 0%, #1a1a2e 100%)' }}
                >
                    <p className="text-sm font-black text-white mb-1">Questions Per Day</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">This week vs last week</p>
                    <BarChart current={stats.daily} previous={prevStats.daily} />
                </motion.div>

                {/* ── Accuracy Comparison bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="rounded-3xl p-5 border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #12121e 0%, #1a1a2e 100%)' }}
                >
                    <p className="text-sm font-black text-white mb-4">Accuracy Comparison</p>
                    {[
                        { label: 'This Week', value: stats.accuracy, color: '#6366f1' },
                        { label: 'Last Week', value: prevStats.accuracy, color: '#334155' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-[11px] text-slate-400 font-bold">{label}</span>
                                <span className="text-[11px] text-white font-black">{value}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                                    className="h-full rounded-full"
                                    style={{ background: color }}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* ── Correct vs Incorrect ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="rounded-3xl p-5 border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #12121e 0%, #1a1a2e 100%)' }}
                >
                    <p className="text-sm font-black text-white mb-4">Answer Breakdown</p>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-black text-emerald-400">{stats.correctAttempts}</p>
                            <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider mt-1">Correct</p>
                            <Delta current={stats.correctAttempts} previous={prevStats.correctAttempts} />
                        </div>
                        <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-black text-rose-400">{stats.totalAttempts - stats.correctAttempts}</p>
                            <p className="text-[10px] text-rose-500/70 font-bold uppercase tracking-wider mt-1">Wrong</p>
                            <Delta
                                current={stats.totalAttempts - stats.correctAttempts}
                                previous={prevStats.totalAttempts - prevStats.correctAttempts}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* ── CTA ── */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => router.push('/feed')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                >
                    Keep Solving →
                </motion.button>

            </div>
        </div>
    );
}
