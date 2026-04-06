"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, Target, Clock, Zap, Crown, Shield, Play, Sparkles, Share2,
    Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, X, Check
} from 'lucide-react';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getClientAppUrl } from '@/lib/appUrl';

// ── Admin email guard ──
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

type CustomQuestion = {
    id: string;
    title: string;
    options: string[];
    correct_option: number;
    subject: string;
};

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
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    
    // Form for a single question
    const [qForm, setQForm] = useState({
        title: '',
        options: ['', '', '', ''],
        correct_option: 0
    });

    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: '',
        class_grade: '',
        difficulty: 'hard',
        question_count: '15',
        time_minutes: '30',
        color: 'from-indigo-600 to-indigo-800',
        reward: 'Sharpen your skills',
        reward_points: '20',
        reward_threshold_percent: '50',
    });

    const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

    const addQuestion = () => {
        if (!qForm.title || qForm.options.some(o => !o)) {
            alert("Please fill all question details.");
            return;
        }
        const newQ: CustomQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            title: qForm.title,
            options: [...qForm.options],
            correct_option: qForm.correct_option,
            subject: form.subject || 'general'
        };
        setCustomQuestions([...customQuestions, newQ]);
        setQForm({ title: '', options: ['', '', '', ''], correct_option: 0 });
    };

    const removeQuestion = (id: string) => {
        setCustomQuestions(customQuestions.filter(q => q.id !== id));
    };

    const handleCreate = async () => {
        if (!form.title || !form.subject) { setErr('Title and Subject are required.'); return; }
        if (customQuestions.length === 0) { setErr('Add at least one custom question.'); return; }
        
        setSaving(true); setErr(null);
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setErr('Not logged in.'); return; }

            const res = await fetch('/api/gauntlet/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    question_count: customQuestions.length,
                    custom_questions: customQuestions
                }),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.error || 'Failed to create.'); return; }
            
            setOpen(false);
            setCustomQuestions([]);
            setForm({ title: '', description: '', subject: '', class_grade: '', difficulty: 'hard', question_count: '15', time_minutes: '30', color: 'from-indigo-600 to-indigo-800', reward: 'Sharpen your skills', reward_points: '20', reward_threshold_percent: '50' });
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
                        <p className="font-black text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-400">⚡ Custom Gauntlet Forge</p>
                        <p className="text-[10px] text-slate-400 font-medium">Create a challenge with your own questions</p>
                    </div>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {open && (
                <div className="px-6 pb-6 space-y-6 border-t border-indigo-100 dark:border-indigo-900 pt-5">
                    {err && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">1. Basic Info</h3>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Title *</label>
                                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. English Voice Gauntlet" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subject</label>
                                <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. English" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Time (Mins)</label>
                                    <input type="number" value={form.time_minutes} onChange={e => set('time_minutes', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Difficulty</label>
                                    <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500">
                                        {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">2. Rewards</h3>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Bonus Points</label>
                                <input type="number" value={form.reward_points} onChange={e => set('reward_points', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Pass Threshold (%)</label>
                                <input type="number" value={form.reward_threshold_percent} onChange={e => set('reward_threshold_percent', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Color Theme</label>
                                <select value={form.color} onChange={e => set('color', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500">
                                    {COLOR_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Question Builder */}
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                             <Plus className="w-4 h-4" /> Add Custom Questions ({customQuestions.length})
                        </h3>
                        <div className="space-y-4">
                            <input 
                                value={qForm.title} 
                                onChange={e => setQForm({...qForm, title: e.target.value})}
                                placeholder="Enter Question title..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {qForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <button 
                                            onClick={() => setQForm({...qForm, correct_option: i})}
                                            className={`w-10 shrink-0 rounded-lg flex items-center justify-center font-black text-xs ${qForm.correct_option === i ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                        >
                                            {String.fromCharCode(65+i)}
                                        </button>
                                        <input 
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...qForm.options];
                                                newOpts[i] = e.target.value;
                                                setQForm({...qForm, options: newOpts});
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65+i)}`}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={addQuestion}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em]"
                            >
                                Add to List
                            </button>
                        </div>

                        {/* Question List Preview */}
                        <div className="mt-6 space-y-2 max-h-60 overflow-y-auto pr-2">
                            {customQuestions.map((q, i) => (
                                <div key={q.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                    <span className="font-bold truncate max-w-[80%]">{i+1}. {q.title}</span>
                                    <button onClick={() => removeQuestion(q.id)} className="text-red-400 p-1"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={saving || customQuestions.length === 0}
                        className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Forge Custom Gauntlet
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Arena Hub (unchanged except for props/component) ─────────────────────
export default function TestsHubPage() {
    const router = useRouter();
    const [gauntlets, setGauntlets] = useState<Gauntlet[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const forgeRef = useRef<HTMLDivElement>(null);

    const scrollToForge = () => {
        forgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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
        (async () => {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                setIsAdmin(true);
            }
        })();
    }, []);

    const handleDelete = async (gauntlet: Gauntlet) => {
        if (!confirm(`Delete "${gauntlet.title}"?`)) return;
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
        const text = `${gauntlet.title} at Dheeyudha Academy! 🧠🔥\n${getClientAppUrl()}/arena/${gauntlet.slug}`;
        if (Capacitor.isNativePlatform()) {
            await CapShare.share({ title: gauntlet.title, text });
        } else if (navigator.share) {
            await navigator.share({ title: gauntlet.title, text });
        } else {
            await navigator.clipboard.writeText(text);
            alert('Copied link!');
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 relative overflow-hidden">
            <title>The Arena - Dheeyudha</title>
            <main className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 pt-12 md:pt-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">The Arena</h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm">Custom challenges for top scholars.</p>
                </div>

                {isAdmin && <div ref={forgeRef}><GauntletForge onCreated={fetchGauntlets} /></div>}

                {loadingList ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gauntlets.map((g) => (
                            <div key={g.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 overflow-hidden hover:shadow-2xl transition-all">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${g.color} opacity-10 blur-3xl`} />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{g.difficulty} · {g.subject}</span>
                                        {isAdmin && <button onClick={() => handleDelete(g)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                    <h2 className="text-2xl font-black italic uppercase mb-2">{g.title}</h2>
                                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{g.description}</p>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-slate-400">Questions</span>
                                            <span className="font-bold text-xs">{g.question_count} MCQs</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-slate-400">Time</span>
                                            <span className="font-bold text-xs">{g.time_minutes} Mins</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => router.push(`/arena/${g.slug}`)}
                                        className={`w-full py-4 bg-gradient-to-r ${g.color} text-white font-black uppercase text-xs rounded-2xl shadow-xl active:scale-95 transition-all`}
                                    >
                                        Enter Gauntlet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
