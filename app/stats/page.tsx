"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Target, CheckCircle2, XCircle, Clock, BarChart3, ArrowLeft, AlertTriangle } from 'lucide-react';

function StatsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId') || 'class-9-hard';

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                if (!session) { router.push('/login'); return; }

                const res = await fetch(`/api/test/results?testId=${testId}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                if (!data.hasSubmission) { setResult(null); } 
                else { setResult(data.summary); }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, [router, testId]);

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 animate-pulse">Loading records...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-red-200 rounded-3xl p-8 text-center shadow-lg">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h2 className="font-black text-red-600 mb-2">Failed to load stats</h2>
                    <p className="text-xs text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
                    <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h2 className="font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-sm">No Attempts Yet</h2>
                    <p className="text-xs text-slate-400 mb-6">Complete the Gauntlet to see your full breakdown here.</p>
                    <button onClick={() => router.push(`/tests/${testId}`)} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        Enter the Gauntlet
                    </button>
                </div>
            </div>
        );
    }

    const snapshot: any[] = result.metadata?.answers_snapshot || [];
    const correctCount = snapshot.filter(s => s.isCorrect).length;
    const incorrectCount = snapshot.filter(s => !s.isCorrect).length;
    const unattempted = snapshot.filter(s => s.selectedOption === undefined || s.selectedOption === null).length;
    const mins = Math.floor(result.time_taken / 60);
    const secs = result.time_taken % 60;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-black uppercase tracking-tight">Arena Analytics</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gauntlet Challenge</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
                {/* Score Summary Card */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-[2.5rem] p-6 overflow-hidden shadow-2xl shadow-indigo-500/30">
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 70% 20%, white 0%, transparent 60%)"}} />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Your Gauntlet Record</span>
                        </div>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-6xl font-black italic tracking-tighter leading-none">{result.score}</span>
                            <span className="text-lg font-bold opacity-50 pb-2">/ {result.max_score}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                                <p className="text-xl font-black">{correctCount}</p>
                                <p className="text-[8px] opacity-60 uppercase font-black tracking-widest">Correct</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                                <XCircle className="w-4 h-4 text-red-400 mb-1" />
                                <p className="text-xl font-black">{incorrectCount}</p>
                                <p className="text-[8px] opacity-60 uppercase font-black tracking-widest">Wrong</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                                <Clock className="w-4 h-4 text-amber-400 mb-1" />
                                <p className="text-xl font-black">{mins}m</p>
                                <p className="text-[8px] opacity-60 uppercase font-black tracking-widest">{secs}s</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width: `${result.accuracy}%`}} />
                            </div>
                            <span className="ml-3 text-sm font-black text-emerald-400">{result.accuracy}%</span>
                        </div>
                        <p className="text-[9px] opacity-50 mt-1 uppercase font-bold tracking-widest">Accuracy</p>
                    </div>
                </div>

                {/* Question Breakdown */}
                {snapshot.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-base font-black italic uppercase tracking-widest px-1">Full Question Breakdown</h2>
                        {snapshot.map((q: any, idx: number) => {
                            const isCorrect = q.isCorrect;
                            const hasAnswer = q.selectedOption !== undefined && q.selectedOption !== null;
                            return (
                                <div 
                                    key={idx}
                                    className={`p-5 rounded-3xl border-2 transition-all ${
                                        isCorrect 
                                            ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5' 
                                            : !hasAnswer 
                                                ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                                : 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                            isCorrect ? 'bg-emerald-500 text-white' : !hasAnswer ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-red-500 text-white'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{q.title || `Question ${idx + 1}`}</p>
                                    </div>

                                    {q.options && q.options.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.options.map((opt: string, optIdx: number) => {
                                                const isSelected = q.selectedOption === optIdx;
                                                const isCorrectOpt = optIdx === 0; // correct_option is always 0 in snapshot
                                                return (
                                                    <div 
                                                        key={optIdx}
                                                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                                            isCorrectOpt 
                                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold'
                                                                : isSelected 
                                                                    ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 font-bold'
                                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500'
                                                        }`}
                                                    >
                                                        <span className="leading-snug">{opt}</span>
                                                        {isCorrectOpt && <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />}
                                                        {isSelected && !isCorrectOpt && <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl inline-block ${
                                            isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isCorrect ? '✓ Answered Correctly' : !hasAnswer ? 'Not Attempted' : '✗ Answered Incorrectly'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Detailed breakdown not available for this attempt</p>
                        <p className="text-[10px] text-slate-300 mt-1">Only newer submissions include full question data</p>
                    </div>
                )}

                <button
                    onClick={() => router.push(`/arena/${testId}?view=records`)}
                    className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-indigo-500/30 transition-all"
                >
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    View Hall of Fame
                </button>
            </div>
        </div>
    );
}

export default function StatsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <StatsContent />
        </Suspense>
    );
}
