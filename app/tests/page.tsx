"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, Target, Clock, Zap, Crown, Shield, Play, Sparkles, Share2,
    Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getClientAppUrl } from '@/lib/appUrl';

// ── Admin email guard (client-side preview only, server enforces) ──
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

type Gauntlet = {
    id: string;
    slug: string;
    title: string;
    description: string;
    subject: string;
    class_grade: string | null;
    difficulty: string;
    question_count: number;
    time_minutes: number;
    color: string;
    reward: string;
};

const COLOR_PRESETS = [
    { label: 'Indigo (Default)', value: 'from-indigo-600 to-indigo-800' },
    { label: 'Emerald', value: 'from-emerald-600 to-teal-700' },
    { label: 'Rose / Fire', value: 'from-rose-600 to-red-800' },
    { label: 'Violet / Nightmare', value: 'from-violet-600 to-fuchsia-800' },
    { label: 'Amber / Gold', value: 'from-amber-500 to-orange-600' },
    { label: 'Sky / Ocean', value: 'from-sky-500 to-blue-700' },
];

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'nightmare'];

// ── Admin Gauntlet Forge Panel ──────────────────────────────────────────────
function GauntletForge({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: '',
        class_grade: '',
        difficulty: 'hard',
        question_count: '40',
        time_minutes: '60',
        color: 'from-indigo-600 to-indigo-800',
        reward: 'Sharpen your skills',
    });

    const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

    const handleCreate = async () => {
        if (!form.title || !form.subject) { setErr('Title and Subject are required.'); return; }
        setSaving(true); setErr(null);
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setErr('Not logged in.'); return; }
            const res = await fetch('/api/gauntlet/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.error || 'Failed to create.'); return; }
            setOpen(false);
            setForm({ title: '', description: '', subject: '', class_grade: '', difficulty: 'hard', question_count: '40', time_minutes: '60', color: 'from-indigo-600 to-indigo-800', reward: 'Sharpen your skills' });
            onCreated();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mb-8 bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-[2rem] overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-400">⚡ Gauntlet Forge</p>
                        <p className="text-[10px] text-slate-400 font-medium">Admin Panel · Create a new gauntlet challenge</p>
                    </div>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {open && (
                <div className="px-6 pb-6 space-y-4 border-t border-indigo-100 dark:border-indigo-900 pt-5">
                    {err && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Title *</label>
                            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Class 9 Science Gauntlet" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subject *</label>
                            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Science, English, Math" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Class Grade</label>
                            <input value={form.class_grade} onChange={e => set('class_grade', e.target.value)} placeholder="e.g. 9, 10 (optional)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Difficulty</label>
                            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500">
                                {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Questions Count</label>
                            <input type="number" value={form.question_count} onChange={e => set('question_count', e.target.value)} min="5" max="100" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Time (Minutes)</label>
                            <input type="number" value={form.time_minutes} onChange={e => set('time_minutes', e.target.value)} min="5" max="180" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Card Color</label>
                            <select value={form.color} onChange={e => set('color', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500">
                                {COLOR_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Reward Text</label>
                            <input value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="e.g. Master the subject" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Short description for this gauntlet..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>

                    {/* Preview card */}
                    <div className={`p-5 rounded-2xl bg-gradient-to-br ${form.color} text-white`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{form.difficulty} TEST</span>
                        </div>
                        <p className="font-black text-lg italic uppercase">{form.title || 'Gauntlet Title'}</p>
                        <p className="text-xs opacity-70 mt-1">{form.description || 'Description'}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs font-bold opacity-80">
                            <span>{form.question_count} Questions</span>
                            <span>{form.time_minutes} Mins</span>
                            <span>{form.subject || 'Subject'}</span>
                            {form.class_grade && <span>Class {form.class_grade}</span>}
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Zap className="w-4 h-4" /> Forge Gauntlet</>}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Arena Hub ──────────────────────────────────────────────────────────
export default function TestsHubPage() {
    const router = useRouter();
    const [gauntlets, setGauntlets] = useState<Gauntlet[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchGauntlets = async () => {
        try {
            const res = await fetch('/api/gauntlet/list');
            const data = await res.json();
            setGauntlets(data.gauntlets || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchGauntlets();
        // Check if user is admin
        (async () => {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                setIsAdmin(true);
            }
        })();
    }, []);

    const handleDelete = async (gauntlet: Gauntlet) => {
        if (!confirm(`Delete "${gauntlet.title}"? This cannot be undone.`)) return;
        setDeletingId(gauntlet.id);
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await fetch('/api/gauntlet/create', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: gauntlet.id }),
            });
            await fetchGauntlets();
        } finally {
            setDeletingId(null);
        }
    };

    const handleShare = async (gauntlet: Gauntlet) => {
        const text = `Think you have what it takes? Try the ${gauntlet.title} at Dheeyudha Academy! 🧠🔥\n${getClientAppUrl()}/arena/${gauntlet.slug}`;
        try {
            if (Capacitor.isNativePlatform()) {
                await CapShare.share({ title: gauntlet.title, text, dialogTitle: 'Share this Gauntlet' });
            } else if (navigator.share) {
                await navigator.share({ title: gauntlet.title, text });
            } else {
                await navigator.clipboard.writeText(text);
                alert('Copied link to clipboard!');
            }
        } catch (e) { console.log('Share error', e); }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 relative overflow-hidden">
            <title>The Arena - Dheeyudha Gauntlets</title>
            <meta name="description" content="Push your intellect to the limit. These curated gauntlets are designed to identify the top 1% of scholars." />

            {/* Mesh Gradients */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-fuchsia-500/5 blur-[120px] rounded-full pointer-events-none" />

            <main className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 pt-12 md:pt-20">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Exhibition Challenges</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">The Arena</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">
                        Push your intellect to the limit. These curated gauntlets are designed to identify the top 1% of scholars.
                    </p>
                </div>

                {/* Admin Forge Panel */}
                {isAdmin && (
                    <GauntletForge onCreated={fetchGauntlets} />
                )}

                {/* Gauntlet Cards */}
                {loadingList ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : gauntlets.length === 0 ? (
                    <div className="text-center py-20">
                        <Zap className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="font-black italic uppercase tracking-widest text-slate-400 text-sm">No Gauntlets Yet</p>
                        {isAdmin && <p className="text-xs text-slate-400 mt-2">Use the Gauntlet Forge above to create the first challenge.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gauntlets.map((gauntlet) => (
                            <div
                                key={gauntlet.id}
                                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                            >
                                {/* Card Glow */}
                                <div className={`absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl ${gauntlet.color} opacity-[0.04] dark:opacity-[0.08] group-hover:opacity-[0.10] transition-opacity`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gauntlet.color} flex items-center justify-center text-white shadow-lg`}>
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{gauntlet.difficulty} TEST</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => handleShare(gauntlet)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-indigo-600 transition-colors rounded-full">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(gauntlet)}
                                                    disabled={deletingId === gauntlet.id}
                                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-400 hover:text-red-500 transition-colors rounded-full"
                                                >
                                                    {deletingId === gauntlet.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold">{gauntlet.time_minutes} Mins</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {gauntlet.title}
                                    </h2>
                                    {gauntlet.class_grade && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Class {gauntlet.class_grade} · {gauntlet.subject}</span>
                                    )}
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                                        {gauntlet.description}
                                    </p>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Questions</span>
                                                <span className="font-bold text-sm">{gauntlet.question_count} MCQs</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Potential</span>
                                                <span className="font-bold text-sm">+{gauntlet.question_count * 3} Points</span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-yellow-500" />
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{gauntlet.reward}</span>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => router.push(`/arena/${gauntlet.slug}`)}
                                                className={`flex-[3] py-4 bg-gradient-to-r ${gauntlet.color} text-white font-black italic uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl`}
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                Enter Gauntlet
                                            </button>
                                            <button
                                                onClick={() => router.push(`/arena/${gauntlet.slug}?view=records`)}
                                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors rounded-2xl flex items-center justify-center"
                                                title="View Hall of Fame"
                                            >
                                                <Trophy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
