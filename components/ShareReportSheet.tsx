'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trophy, Target, Calendar, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ShareReportSheetProps {
    isOpen: boolean;
    onClose: () => void;
    report: {
        stats: { totalAttempts: number; accuracy: number; activeDays: number; score: number; correctAttempts: number; subjects: { name: string }[] };
        rating: { label: string; color: string; message: string };
    };
}

const RATING_GRADIENT: Record<string, { from: string; to: string; text: string }> = {
    purple:  { from: '#7c3aed', to: '#c026d3', text: '#f3e8ff' },
    green:   { from: '#059669', to: '#16a34a', text: '#d1fae5' },
    blue:    { from: '#4f46e5', to: '#2563eb', text: '#e0e7ff' },
    orange:  { from: '#ea580c', to: '#d97706', text: '#fff7ed' },
    red:     { from: '#dc2626', to: '#e11d48', text: '#fee2e2' },
    slate:   { from: '#475569', to: '#334155', text: '#f1f5f9' },
};

const EMOJI_MAP: Record<string, string> = {
    Excellent: '🔥', 'Very Good': '⚡', Good: '💪', 'Not Bad': '🚀', Poor: '💡',
};

export default function ShareReportSheet({ isOpen, onClose, report }: ShareReportSheetProps) {
    const { stats, rating } = report;
    const [caption, setCaption] = useState('');
    const [posting, setPosting] = useState(false);
    const [done, setDone] = useState(false);

    const colors = RATING_GRADIENT[rating.color] ?? RATING_GRADIENT.slate;
    const emoji = EMOJI_MAP[rating.label] ?? '📊';
    const topSubject = stats.subjects?.[0]?.name;

    // Build the rich text that goes into the post content
    const buildContent = () => {
        const lines = [
            `${emoji} My Weekly Dheeyudha Report Card`,
            ``,
            `📊 Rating: **${rating.label}** (${stats.score}/100)`,
            `🎯 Accuracy: **${stats.accuracy}%** — ${stats.correctAttempts}/${stats.totalAttempts} correct`,
            `📅 Active Days: **${stats.activeDays}** this week`,
            topSubject ? `📚 Favourite Subject: **${topSubject}**` : '',
            ``,
            caption.trim() ? caption.trim() : rating.message,
            ``,
            `#Dheeyudha #WeeklyReport #StudyGoals`,
        ].filter(l => l !== undefined).join('\n');
        return lines;
    };

    const handlePost = async () => {
        setPosting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: buildContent() }),
            });

            if (res.ok) {
                setDone(true);
                setTimeout(() => { setDone(false); onClose(); }, 2000);
            } else {
                const e = await res.json();
                alert(e.error || 'Failed to post');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to post');
        } finally {
            setPosting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet"
                        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-t-3xl px-5 pt-5 pb-10 border-t border-slate-100 dark:border-slate-800 shadow-2xl">
                            {/* Handle */}
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-black text-slate-900 dark:text-white text-base">Share to Community</h2>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            {/* ── Preview card (what the post will look like) ── */}
                            <div
                                className="rounded-2xl p-5 mb-4 relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                            >
                                {/* Decorative circles */}
                                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10" />

                                {/* Brand */}
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black text-white">D</div>
                                        <span className="text-xs font-black text-white/80 uppercase tracking-widest">Dheeyudha</span>
                                    </div>
                                    <span className="text-xs font-bold text-white/60">Weekly Report</span>
                                </div>

                                {/* Rating */}
                                <div className="relative z-10 mb-4">
                                    <p className="text-4xl font-black text-white mb-0.5">{emoji} {rating.label}</p>
                                    <p className="text-sm font-bold" style={{ color: colors.text }}>{rating.message}</p>
                                </div>

                                {/* Stats row */}
                                <div className="relative z-10 flex gap-3">
                                    {[
                                        { icon: Trophy, label: 'Score', val: `${stats.score}/100` },
                                        { icon: Target, label: 'Accuracy', val: `${stats.accuracy}%` },
                                        { icon: Calendar, label: 'Days Active', val: `${stats.activeDays}` },
                                    ].map(({ icon: Icon, label, val }) => (
                                        <div key={label} className="flex-1 bg-white/15 rounded-xl p-2.5 text-center">
                                            <Icon className="w-4 h-4 text-white/80 mx-auto mb-1" />
                                            <p className="text-sm font-black text-white">{val}</p>
                                            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wide">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {topSubject && (
                                    <div className="relative z-10 mt-3 flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-white/70" />
                                        <span className="text-xs text-white/80 font-bold">Favourite: {topSubject}</span>
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            <textarea
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                placeholder="Add a caption... (optional)"
                                rows={2}
                                maxLength={200}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                            />

                            {/* Post button */}
                            {done ? (
                                <div className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-black py-4 rounded-2xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Posted to Community!
                                </div>
                            ) : (
                                <button
                                    onClick={handlePost}
                                    disabled={posting}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-60"
                                >
                                    {posting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Share to Community</>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
