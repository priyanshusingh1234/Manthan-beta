'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trophy, Target, Calendar, TrendingUp, Loader2, CheckCircle2, ImageIcon } from 'lucide-react';
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

const RATING_GRADIENT: Record<string, { from: string; to: string; sub: string }> = {
    purple: { from: '#7c3aed', to: '#c026d3', sub: '#e9d5ff' },
    green:  { from: '#059669', to: '#16a34a', sub: '#a7f3d0' },
    blue:   { from: '#4f46e5', to: '#2563eb', sub: '#c7d2fe' },
    orange: { from: '#ea580c', to: '#d97706', sub: '#fed7aa' },
    red:    { from: '#dc2626', to: '#e11d48', sub: '#fecaca' },
    slate:  { from: '#475569', to: '#334155', sub: '#cbd5e1' },
};

const EMOJI_MAP: Record<string, string> = {
    Excellent: '🔥', 'Very Good': '⚡', Good: '💪', 'Not Bad': '🚀', Poor: '💡',
};

export default function ShareReportSheet({ isOpen, onClose, report }: ShareReportSheetProps) {
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);
    const { stats, rating } = report;
    const [caption, setCaption] = useState('');
    const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'posting' | 'done'>('idle');

    const c = RATING_GRADIENT[rating.color] ?? RATING_GRADIENT.blue;
    const emoji = EMOJI_MAP[rating.label] ?? '📊';
    const topSubject = stats.subjects?.[0]?.name || '';

    const buildContent = () => [
        `${emoji} My Weekly Report Card — ${rating.label} (${stats.score}/100)`,
        '',
        caption.trim() || rating.message,
        '',
        '#Dheeyudha #WeeklyReport #StudyGoals',
    ].join('\n');

    const handlePost = async () => {
        if (!cardRef.current) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) { alert('Please log in first'); return; }

            // ── Step 1: Capture the card as a PNG ──────────────────────────
            setStatus('capturing');
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                skipAutoScale: false,
            });

            // Convert data URL → Blob → File
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `report-${Date.now()}.png`, { type: 'image/png' });

            // ── Step 2: Upload to Supabase via existing upload route ────────
            setStatus('uploading');
            const form = new FormData();
            form.append('file', file);
            const uploadRes = await fetch('/api/posts/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!uploadRes.ok) throw new Error('Image upload failed');
            const { url: imageUrl } = await uploadRes.json();

            // ── Step 3: Create the post ────────────────────────────────────
            setStatus('posting');
            const postRes = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: buildContent(), imageUrl }),
            });
            if (!postRes.ok) { const e = await postRes.json(); throw new Error(e.error || 'Post failed'); }
            const post = await postRes.json();

            setStatus('done');
            setTimeout(() => { onClose(); router.push(`/posts/${post.id}`); }, 1200);
        } catch (err: any) {
            alert(err.message || 'Something went wrong');
            setStatus('idle');
        }
    };

    const busy = status !== 'idle' && status !== 'done';
    const statusLabel: Record<string, string> = {
        capturing: 'Capturing card…',
        uploading: 'Uploading image…',
        posting: 'Creating post…',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="bd"
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        key="sheet"
                        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] pt-3 pb-10 shadow-2xl">
                            {/* Handle */}
                            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 mb-5">
                                <div>
                                    <h2 className="font-black text-slate-900 dark:text-white text-base">Post to Community</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Your card will appear as a beautiful image ✨</p>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            {/* ── The card that gets captured ── */}
                            <div className="px-5 mb-4">
                                <div
                                    ref={cardRef}
                                    className="rounded-2xl p-5 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                                >
                                    {/* Decorative circles */}
                                    <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                                    <div style={{ position:'absolute', bottom:-32, left:-32, width:120, height:120, borderRadius:'50%', background:'rgba(0,0,0,0.08)' }} />

                                    {/* Brand */}
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14 }}>D</div>
                                            <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>Dheeyudha</span>
                                        </div>
                                        <span style={{ color:'rgba(255,255,255,0.45)', fontSize:10, fontWeight:600 }}>Weekly Report</span>
                                    </div>

                                    {/* Rating */}
                                    <div style={{ position:'relative', marginBottom:16 }}>
                                        <p style={{ fontSize:32, fontWeight:900, color:'#fff', margin:0, lineHeight:1.1 }}>{emoji} {rating.label}</p>
                                        <p style={{ fontSize:13, color: c.sub, marginTop:6, fontWeight:600 }}>{rating.message}</p>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display:'flex', gap:8, position:'relative' }}>
                                        {[
                                            { label:'Score',    val:`${stats.score}/100` },
                                            { label:'Accuracy', val:`${stats.accuracy}%` },
                                            { label:'Active',   val:`${stats.activeDays}d` },
                                        ].map(({ label, val }) => (
                                            <div key={label} style={{ flex:1, background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
                                                <p style={{ fontSize:15, fontWeight:900, color:'#fff', margin:0 }}>{val}</p>
                                                <p style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.55)', margin:'3px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {topSubject && (
                                        <p style={{ position:'relative', marginTop:10, fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:700 }}>
                                            📚 Favourite: {topSubject}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.15)', marginTop:14, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>#Dheeyudha  #WeeklyReport</span>
                                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>dheeyudha.app</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 mt-2">
                                    <ImageIcon className="w-3 h-3 text-slate-400" />
                                    <p className="text-[10px] text-slate-400">This exact card will be shared as an image</p>
                                </div>
                            </div>

                            {/* Caption */}
                            <div className="px-5 mb-4">
                                <textarea
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    placeholder={`Add a caption… (optional)`}
                                    rows={2}
                                    maxLength={200}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Button */}
                            <div className="px-5">
                                {status === 'done' ? (
                                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-black py-4 rounded-2xl">
                                        <CheckCircle2 className="w-5 h-5" /> Posted! Taking you there…
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={handlePost}
                                        disabled={busy}
                                        className="w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-70"
                                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                                    >
                                        {busy ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" />{statusLabel[status]}</>
                                        ) : (
                                            <><Send className="w-5 h-5" />Share to Community</>
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
