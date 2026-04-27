'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trophy, Target, Calendar, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface ShareReportSheetProps {
    isOpen: boolean;
    onClose: () => void;
    report: {
        stats: {
            totalAttempts: number;
            accuracy: number;
            activeDays: number;
            score: number;
            correctAttempts: number;
            subjects: { name: string }[];
        };
        rating: { label: string; color: string; message: string };
    };
}

const RATING_GRADIENT: Record<string, { from: string; to: string; text: string; sub: string }> = {
    purple: { from: '#7c3aed', to: '#c026d3', text: '#f3e8ff', sub: '#e9d5ff' },
    green:  { from: '#059669', to: '#16a34a', text: '#d1fae5', sub: '#a7f3d0' },
    blue:   { from: '#4f46e5', to: '#2563eb', text: '#e0e7ff', sub: '#c7d2fe' },
    orange: { from: '#ea580c', to: '#d97706', text: '#fff7ed', sub: '#fed7aa' },
    red:    { from: '#dc2626', to: '#e11d48', text: '#fee2e2', sub: '#fecaca' },
    slate:  { from: '#475569', to: '#334155', text: '#f1f5f9', sub: '#cbd5e1' },
};

const EMOJI_MAP: Record<string, string> = {
    Excellent: '🔥', 'Very Good': '⚡', Good: '💪', 'Not Bad': '🚀', Poor: '💡',
};

export default function ShareReportSheet({ isOpen, onClose, report }: ShareReportSheetProps) {
    const router = useRouter();
    const { stats, rating } = report;
    const [caption, setCaption] = useState('');
    const [posting, setPosting] = useState(false);
    const [done, setDone] = useState(false);

    const c = RATING_GRADIENT[rating.color] ?? RATING_GRADIENT.blue;
    const emoji = EMOJI_MAP[rating.label] ?? '📊';
    const topSubject = stats.subjects?.[0]?.name || '';

    // Build the OG image URL with the report data as query params
    const buildOgImageUrl = () => {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams({
            rating: rating.label,
            score: String(stats.score),
            accuracy: String(stats.accuracy),
            days: String(stats.activeDays),
            correct: String(stats.correctAttempts),
            total: String(stats.totalAttempts),
            color: rating.color,
            ...(topSubject ? { subject: topSubject } : {}),
        });
        return `${base}/api/report/og-image?${params.toString()}`;
    };

    // Clean post content (no markdown)
    const buildContent = () => {
        return [
            `${emoji} My Weekly Report Card`,
            ``,
            `Rating: ${rating.label} (${stats.score}/100)`,
            `Accuracy: ${stats.accuracy}% — ${stats.correctAttempts}/${stats.totalAttempts} correct`,
            `Active: ${stats.activeDays} days this week`,
            topSubject ? `Favourite: ${topSubject}` : '',
            ``,
            caption.trim() || rating.message,
            ``,
            `#Dheeyudha #WeeklyReport #StudyGoals`,
        ].filter(l => l !== undefined).join('\n');
    };

    const handlePost = async () => {
        setPosting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) { alert('Please log in first'); setPosting(false); return; }

            const imageUrl = buildOgImageUrl();

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: buildContent(), imageUrl }),
            });

            if (res.ok) {
                const post = await res.json();
                setDone(true);
                setTimeout(() => {
                    onClose();
                    // Redirect to the created post
                    router.push(`/posts/${post.id}`);
                }, 1200);
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
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        key="sheet"
                        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] pt-3 pb-10 border-t border-slate-100 dark:border-slate-800 shadow-2xl">

                            {/* Handle */}
                            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 mb-5">
                                <div>
                                    <h2 className="font-black text-slate-900 dark:text-white text-base">Post to Community</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Share your achievement with everyone</p>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            {/* ── Beautiful Preview Card ── */}
                            <div className="px-5 mb-4">
                                <div
                                    className="rounded-2xl p-5 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                                >
                                    {/* Decorative blobs */}
                                    <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
                                    <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/10 pointer-events-none" />

                                    {/* Brand + date */}
                                    <div className="relative z-10 flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black text-white">D</div>
                                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Dheeyudha</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white/50">Weekly Report</span>
                                    </div>

                                    {/* Rating headline */}
                                    <div className="relative z-10 mb-4">
                                        <p className="text-3xl font-black text-white leading-tight">{emoji} {rating.label}</p>
                                        <p className="text-sm mt-1 font-semibold" style={{ color: c.sub }}>{rating.message}</p>
                                    </div>

                                    {/* Stats row */}
                                    <div className="relative z-10 grid grid-cols-3 gap-2">
                                        {[
                                            { icon: Trophy, label: 'Score', val: `${stats.score}/100` },
                                            { icon: Target, label: 'Accuracy', val: `${stats.accuracy}%` },
                                            { icon: Calendar, label: 'Active', val: `${stats.activeDays}d` },
                                        ].map(({ icon: Icon, label, val }) => (
                                            <div key={label} className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                                                <Icon className="w-3.5 h-3.5 text-white/70 mx-auto mb-1" />
                                                <p className="text-sm font-black text-white leading-none">{val}</p>
                                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-wide mt-0.5">{label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {topSubject && (
                                        <div className="relative z-10 mt-3 flex items-center gap-1.5">
                                            <TrendingUp className="w-3 h-3 text-white/60" />
                                            <span className="text-xs font-bold text-white/70">Top Subject: {topSubject}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Subtle note */}
                                <p className="text-[10px] text-slate-400 mt-2 text-center">
                                    This card will appear as a beautiful image in the feed ✨
                                </p>
                            </div>

                            {/* Caption textarea */}
                            <div className="px-5 mb-4">
                                <textarea
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    placeholder={`Add a caption... (optional, e.g. "Grinding for finals 💪")`}
                                    rows={2}
                                    maxLength={200}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 text-right">{caption.length}/200</p>
                            </div>

                            {/* Post button */}
                            <div className="px-5">
                                {done ? (
                                    <motion.div
                                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-black py-4 rounded-2xl"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Posted! Taking you there…
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={handlePost}
                                        disabled={posting}
                                        className="w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-60"
                                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                                    >
                                        {posting ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Posting…</>
                                        ) : (
                                            <><Send className="w-5 h-5" /> Share to Community</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
