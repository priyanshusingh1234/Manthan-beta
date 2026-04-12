"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, Target, Clock, Zap, Crown, Shield, Play, Sparkles, Share2,
    Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, X, Check,
    Users, BarChart3, Medal, Heart
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
    reward_points?: number;
    reward_threshold_percent?: number;
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
        <div className="mb-12 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.99] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-8 py-6 hover:bg-white dark:hover:bg-slate-800 transition-all group"
            >
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-1">⚡ Forge New Gauntlet</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Admin Panel • Create Custom Challenges</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="px-8 pb-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-100 dark:via-indigo-900/30 to-transparent" />
                    
                    {err && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 rounded-2xl text-red-600 text-xs font-black uppercase tracking-widest">
                            <AlertCircle className="w-5 h-5" /> {err}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 pb-2 border-b border-indigo-50 dark:border-indigo-900/30">1. Core Configuration</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Test Title</label>
                                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Ancient Rome Advanced" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Subject</label>
                                    <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. History" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 ring-indigo-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Difficulty</label>
                                    <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 ring-indigo-500/10 transition-all">
                                        {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Timer (Mins)</label>
                                    <input type="number" value={form.time_minutes} onChange={e => set('time_minutes', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Award Points</label>
                                    <input type="number" value={form.reward_points} onChange={e => set('reward_points', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 pb-2 border-b border-indigo-50 dark:border-indigo-900/30">2. Aesthetic & Reward</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Visual Theme</label>
                                    <select value={form.color} onChange={e => set('color', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none transition-all">
                                        {COLOR_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Reward Message</label>
                                    <input value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="e.g. Centurion Badge Unlocked" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Pass Requirement (%)</label>
                                    <input type="number" value={form.reward_threshold_percent} onChange={e => set('reward_threshold_percent', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 dark:from-indigo-500/10 dark:to-fuchsia-500/10 rounded-[2rem] border border-indigo-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6 flex items-center justify-between">
                             <span>3. Custom Questions ({customQuestions.length})</span>
                             {customQuestions.length > 0 && <button onClick={() => setCustomQuestions([])} className="text-[9px] text-red-400 hover:text-red-500 transition-colors">CLEAR ALL</button>}
                        </h3>
                        <div className="space-y-6">
                            <textarea 
                                value={qForm.title} 
                                onChange={e => setQForm({...qForm, title: e.target.value})}
                                placeholder="Write the question here..."
                                rows={2}
                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none shadow-sm resize-none"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {qForm.options.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <button 
                                            onClick={() => setQForm({...qForm, correct_option: i})}
                                            className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${qForm.correct_option === i ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
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
                                            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={addQuestion}
                                className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-500 hover:text-white transition-all active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4 inline-block mr-2" /> Append Question
                            </button>
                        </div>

                        {customQuestions.length > 0 && (
                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {customQuestions.map((q, i) => (
                                    <div key={q.id} className="flex items-start gap-4 p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                                        <span className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600">{i+1}</span>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold leading-relaxed pr-8">{q.title}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {q.options.map((opt, oi) => (
                                                    <span key={oi} className={`px-2.5 py-1 rounded-md text-[9px] font-bold ${oi === q.correct_option ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => removeQuestion(q.id)} className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={saving || customQuestions.length === 0}
                        className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.4em] text-xs rounded-3xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        Publish To Arena
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
    const forgeRef = useRef<HTMLDivElement>(null);

    const scrollToForge = () => {
        forgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const fetchGauntlets = async () => {
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data, error } = await supabase
                .from('gauntlets')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGauntlets(data || []);
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
        if (!confirm(`Permanently remove "${gauntlet.title}"? This cannot be undone.`)) return;
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
        const text = `Challenge Alert: ${gauntlet.title} at Dheeyudha Academy! 🧠🔥\n${getClientAppUrl()}/arena/${gauntlet.slug}`;
        if (Capacitor.isNativePlatform()) {
            await CapShare.share({ title: gauntlet.title, text });
        } else if (navigator.share) {
            await navigator.share({ title: gauntlet.title, text });
        } else {
            await navigator.clipboard.writeText(text);
            alert('Competition link copied!');
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-32 relative overflow-hidden">
            <title>Arena • Dheeyudha Academy</title>
            
            {/* Mesh background effects */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            <main 
                className="max-w-[1400px] px-6 mx-auto relative z-10 pt-16 md:pt-24"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Global Competition Center</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none">The Arena</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-lg text-sm md:text-base leading-relaxed">
                            Competitive gauntlets designed to isolate the top 1% of scholars. Enter if you dare.
                        </p>
                    </div>
                </div>

                {isAdmin && <div ref={forgeRef} className="mb-16"><GauntletForge onCreated={fetchGauntlets} /></div>}

                {loadingList ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-slate-900 rounded-[3rem] animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {gauntlets.map((g) => (
                            <div key={g.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                                {/* Theme Glow */}
                                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${g.color} opacity-0 group-hover:opacity-[0.08] blur-3xl transition-opacity duration-700`} />
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${g.color} animate-pulse`} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">{g.difficulty} CHALLENGE</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{g.subject} • CLASS {g.class_grade || 'ANY'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleShare(g)} className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-indigo-500">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(g)} disabled={deletingId === g.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                                                    {deletingId === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h2 className="text-3xl font-black italic uppercase tracking-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-500 leading-[0.9]">
                                        {g.title}
                                    </h2>
                                    
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8 line-clamp-3">
                                        {g.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Structure</span>
                                            </div>
                                            <p className="font-black text-xs">{g.question_count} Questions</p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration</span>
                                            </div>
                                            <p className="font-black text-xs">{g.time_minutes} Minutes</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        {/* Status / Reward Banner */}
                                        <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-r from-indigo-500/5 to-fuchsia-500/5 dark:from-indigo-500/10 dark:to-fuchsia-500/10 border border-indigo-50 dark:border-white/5 group-hover:scale-[1.02] transition-transform duration-500">
                                            <div className="w-10 h-10 shrink-0 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Arena Reward</p>
                                                <p className="text-xs font-black italic">{g.reward_points ? `+${g.reward_points} PTS • ` : ''}{g.reward}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => router.push(`/arena/${g.slug}`)}
                                                className={`flex-[3] py-4 md:py-5 bg-gradient-to-r ${g.color} text-white font-black italic uppercase tracking-[0.2em] text-xs rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-2 active:scale-95 hover:brightness-110 transition-all`}
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                Initiate
                                            </button>
                                            <button 
                                                onClick={() => router.push(`/arena/${g.slug}?view=records`)}
                                                className="flex-1 py-4 md:py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold rounded-[1.5rem] flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                                                title="Open Hall of Fame"
                                            >
                                                <Medal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Admin Quick Action Button */}
            {isAdmin && (
                <button
                    onClick={scrollToForge}
                    className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-indigo-600 text-white flex items-center justify-center rounded-3xl shadow-2xl shadow-indigo-500/50 hover:scale-110 hover:bg-indigo-700 active:scale-90 transition-all group"
                >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>
            )}
        </div>
    );
}
