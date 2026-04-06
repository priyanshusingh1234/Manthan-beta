"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
    Clock, ShieldAlert, CheckCircle2, XCircle, Trophy,
    BarChart3, Share2, ChevronDown, ChevronUp, Minus
} from 'lucide-react';
import { getClientAppUrl } from '@/lib/appUrl';
import TestLeaderboard from '@/components/TestLeaderboard';

type Question = {
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

type AttemptSnapshot = {
    questionId: string;
    title: string;
    options: string[];
    correct_option: number;
    isCorrect: boolean;
    selectedOption: number | null;
};

// ── Question breakdown card ──────────────────────────────────────────────────
function QuestionBreakdown({ snapshot }: { snapshot: AttemptSnapshot[] }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    if (!snapshot.length) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h2 className="font-black uppercase tracking-widest text-sm text-slate-700 dark:text-slate-200">Full Question Breakdown</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.map((q, idx) => {
                    const hasAnswer = q.selectedOption !== null && q.selectedOption !== undefined;
                    const isOpen = expanded === idx;
                    const statusColor = q.isCorrect ? 'bg-emerald-500' : !hasAnswer ? 'bg-slate-300 dark:bg-slate-600' : 'bg-red-500';
                    const statusIcon = q.isCorrect
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : !hasAnswer
                            ? <Minus className="w-3.5 h-3.5 text-slate-400" />
                            : <XCircle className="w-3.5 h-3.5 text-red-500" />;

                    return (
                        <div key={idx}>
                            <button
                                onClick={() => setExpanded(isOpen ? null : idx)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                {/* Status dot */}
                                <div className={`shrink-0 w-2 h-2 rounded-full ${statusColor}`} />
                                {/* Q number */}
                                <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500">
                                    {idx + 1}
                                </span>
                                {/* Question text */}
                                <span className="flex-1 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300 text-left line-clamp-2">
                                    {q.title}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                    {statusIcon}
                                    {isOpen
                                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="px-5 pb-5 space-y-2">
                                    {(q.options || []).map((opt, oIdx) => {
                                        const isCorrectOpt = oIdx === q.correct_option;
                                        const isSelectedOpt = oIdx === q.selectedOption;
                                        const isWrong = isSelectedOpt && !isCorrectOpt;

                                        let cls = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500';
                                        if (isCorrectOpt) cls = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold';
                                        if (isWrong) cls = 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 font-semibold';

                                        return (
                                            <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${cls}`}>
                                                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${isCorrectOpt ? 'bg-emerald-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                <span className="flex-1 leading-snug">{opt}</span>
                                                {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                {isWrong && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                            </div>
                                        );
                                    })}
                                    {!hasAnswer && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">— Not attempted</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main Arena Page ──────────────────────────────────────────────────────────
function ArenaPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const viewOnly = searchParams.get('view') === 'records';

    const [gauntlet, setGauntlet] = useState<Gauntlet | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [snapshot, setSnapshot] = useState<AttemptSnapshot[]>([]);
    const [bonusMessage, setBonusMessage] = useState<string | null>(null);
    // For view-only: fetch from DB
    const [dbResult, setDbResult] = useState<any>(null);

    useEffect(() => {
        async function init() {
            try {
                const listRes = await fetch('/api/gauntlet/list');
                const listData = await listRes.json();
                const found = (listData.gauntlets || []).find((g: Gauntlet) => g.slug === params.id);
                if (!found) throw new Error('Gauntlet not found.');
                setGauntlet(found);
                setTimeLeft(found.time_minutes * 60);

                const { supabase } = await import('@/lib/supabaseClient');
                const { data: { session } } = await supabase.auth.getSession();

                if (viewOnly) {
                    // Fetch their stored result for breakdown
                    if (session) {
                        const res = await fetch(`/api/test/results?testId=${found.slug}`, {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        });
                        const d = await res.json();
                        if (d.hasSubmission && d.summary) {
                            setDbResult(d.summary);
                            const snap = d.summary.metadata?.answers_snapshot || [];
                            setSnapshot(snap);
                        }
                    }
                    setIsSubmitted(true);
                    setLoading(false);
                    return;
                }

                // If gauntlet has custom questions, use them directly
                if (found.custom_questions && Array.isArray(found.custom_questions) && found.custom_questions.length > 0) {
                    setQuestions(found.custom_questions);
                    setLoading(false);
                    return;
                }

                // Check for existing submission
                if (session) {
                    const res = await fetch(`/api/test/results?testId=${found.slug}`, {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    });
                    const d = await res.json();
                    if (d.hasSubmission) {
                        if (d.summary) {
                            setDbResult(d.summary);
                            setSnapshot(d.summary.metadata?.answers_snapshot || []);
                            const snap: AttemptSnapshot[] = d.summary.metadata?.answers_snapshot || [];
                            setCorrectCount(snap.filter(s => s.isCorrect).length);
                            setTimeTaken(d.summary.time_taken || 0);
                        }
                        setIsSubmitted(true);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch questions for fresh attempt
                const qParams = new URLSearchParams({ difficulty: found.difficulty, limit: String(found.question_count) });
                if (found.class_grade) qParams.set('classGrade', found.class_grade);
                if (found.subject) qParams.set('subject', found.subject);
                const qRes = await fetch(`/api/test/generate?${qParams.toString()}`);
                const qData = await qRes.json();
                if (qData.error) throw new Error(qData.error);
                if (!qData.test?.length) throw new Error('Not enough questions found for this gauntlet. Please add more questions to the question bank first.');
                setQuestions(qData.test);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [params.id, viewOnly]);

    // Timer
    useEffect(() => {
        if (loading || isSubmitted || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => {
            if (p <= 1) { clearInterval(t); handleSubmit(); return 0; }
            return p - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [loading, isSubmitted]);

    const handleSelectOption = (optIndex: number) =>
        setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));

    const handleSubmit = async () => {
        if (!gauntlet || !questions.length) return;
        const elapsed = (gauntlet.time_minutes * 60) - timeLeft;
        setTimeTaken(elapsed);
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { alert('Session expired. Please log in again.'); return; }

            let correct = 0;
            const attempts: AttemptSnapshot[] = questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.correct_option;
                if (isCorrect) correct++;
                return {
                    questionId: q.id,
                    title: q.title,
                    options: q.options,
                    correct_option: q.correct_option,  // ← store so breakdown can highlight
                    isCorrect,
                    selectedOption: answers[idx] ?? null
                };
            });
            setCorrectCount(correct);
            setSnapshot(attempts);

            const submitRes = await fetch('/api/test/submit', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: gauntlet.slug,
                    answers: attempts,
                    score: correct * 3,
                    maxScore: questions.length * 3,
                    timeTaken: elapsed,
                    accuracy: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
                })
            });
            const submitData = await submitRes.json();
            if (!submitRes.ok) {
                alert(`⚠️ Score sync failed: ${submitData?.error || 'Unknown error'}\n\nPlease screenshot your score.`);
                return;
            }
            if (submitData.bonusMessage) setBonusMessage(submitData.bonusMessage);
            setIsSubmitted(true);
        } catch (e: any) {
            alert(`⚠️ Network error: ${e.message}`);
        }
    };

    const handleShare = async () => {
        if (!gauntlet) return;
        const score = correctCount * 3;
        const maxQ = snapshot.length || questions.length;
        const max = maxQ * 3;
        const text = `I scored ${score}/${max} on the "${gauntlet.title}" at Dheeyudha Academy! 🧠🔥\n${getClientAppUrl()}/arena/${gauntlet.slug}`;
        try {
            if (Capacitor.isNativePlatform()) {
                await CapShare.share({ title: gauntlet.title, text, dialogTitle: 'Share your Gauntlet Results' });
            } else if (navigator.share) {
                await navigator.share({ title: gauntlet.title, text });
            } else {
                await navigator.clipboard.writeText(text);
                alert('Result copied to clipboard!');
            }
        } catch (e) { console.log('Share failed', e); }
    };

    // ── LOADING ──
    if (loading) return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-indigo-600 dark:text-indigo-400 animate-pulse tracking-widest uppercase text-sm">Initializing Gauntlet...</p>
        </div>
    );

    // ── ERROR ──
    if (error || !gauntlet) return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-black mb-2 text-red-600 dark:text-red-400">Gauntlet Unavailable</h2>
                <p className="text-slate-500 text-sm mb-6">{error || 'Not found'}</p>
                <button onClick={() => router.push('/tests')} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl">Return to Arena</button>
            </div>
        </div>
    );

    // ── RESULTS + ANALYTICS + LEADERBOARD ──
    if (isSubmitted) {
        // Determine data source: live snapshot (just submitted) or DB result (returning user / viewOnly)
        const resultSnap = snapshot.length > 0 ? snapshot : (dbResult?.metadata?.answers_snapshot || []);
        const resultCorrect = resultSnap.length > 0 ? resultSnap.filter((s: AttemptSnapshot) => s.isCorrect).length : correctCount;
        const totalQ = resultSnap.length || gauntlet.question_count;
        const maxScore = totalQ * 3;
        const totalScore = resultCorrect * 3;
        const acc = totalQ > 0 ? Math.round((resultCorrect / totalQ) * 100) : 0;
        const displayTime = timeTaken || dbResult?.time_taken || 0;
        const tMins = Math.floor(displayTime / 60);
        const tSecs = displayTime % 60;

        const incorrectCount = resultSnap.filter((s: AttemptSnapshot) => !s.isCorrect && s.selectedOption !== null && s.selectedOption !== undefined).length;
        const skippedCount = resultSnap.filter((s: AttemptSnapshot) => s.selectedOption === null || s.selectedOption === undefined).length;

        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-32">
                {/* ── Sticky header bar ── */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                        <button onClick={() => router.push('/tests')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-500 transition-colors">← Arena</button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{gauntlet.title}</span>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            <Share2 className="w-3 h-3" /> Share
                        </button>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto p-4 space-y-6 pt-6">
                    {/* ── Hero Score Card ── */}
                    <div className={`relative bg-gradient-to-br ${gauntlet.color} rounded-[2.5rem] p-6 sm:p-8 overflow-hidden shadow-2xl`}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 75% 20%, white 0%, transparent 60%)' }} />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-5">
                                <Trophy className="w-5 h-5 text-yellow-300" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Gauntlet Complete</span>
                            </div>
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-7xl font-black italic tracking-tighter text-white leading-none">{totalScore}</span>
                                <div className="pb-2">
                                    <span className="text-xl font-bold text-white/50">/ {maxScore}</span>
                                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Total Score</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: 'Correct', value: resultCorrect, color: 'text-emerald-300' },
                                    { label: 'Wrong', value: incorrectCount, color: 'text-red-300' },
                                    { label: 'Skipped', value: skippedCount, color: 'text-amber-300' },
                                    { label: 'Accuracy', value: `${acc}%`, color: 'text-white' },
                                ].map(stat => (
                                    <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                                        <p className="text-[8px] text-white/60 font-black uppercase tracking-widest mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Accuracy bar */}
                            <div className="mt-5">
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${acc}%` }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] text-white/50 font-bold">0%</span>
                                    <span className="text-[9px] text-white/70 font-bold">{tMins}m {tSecs}s time taken</span>
                                    <span className="text-[9px] text-white/50 font-bold">100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Bonus Points Banner ── */}
                    {bonusMessage && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-emerald-700 dark:text-emerald-400">{bonusMessage}</p>
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60 font-bold mt-0.5">Bonus points added to your profile instantly</p>
                            </div>
                        </div>
                    )}

                    {/* ── Question Breakdown ── */}
                    {resultSnap.length > 0 ? (
                        <QuestionBreakdown snapshot={resultSnap} />
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Detailed breakdown not available for this attempt</p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Only newer submissions include per-question data</p>
                        </div>
                    )}

                    {/* ── Leaderboard ── */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <h2 className="font-black uppercase tracking-widest text-sm text-slate-700 dark:text-slate-200">Hall of Fame</h2>
                            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">{gauntlet.title}</span>
                        </div>
                        <div className="p-4 sm:p-6">
                            <TestLeaderboard testId={gauntlet.slug} />
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="flex gap-3 pb-8">
                        <button
                            onClick={() => router.push('/tests')}
                            className={`flex-1 py-4 bg-gradient-to-r ${gauntlet.color} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all`}
                        >
                            Back to Arena
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── ACTIVE TEST ──
    if (!questions.length) return null;
    const currentQ = questions[currentIndex];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Timer */}
                    <div className={`px-3 py-2 rounded-xl font-black text-sm flex items-center gap-2 tabular-nums ${timeLeft < 300 ? 'bg-red-100 dark:bg-red-500/10 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
                        <Clock className="w-4 h-4" />
                        <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
                    </div>
                    {/* Progress */}
                    <div className="flex-1 hidden sm:flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{gauntlet.title}</span>
                        <div className="w-full max-w-xs h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${gauntlet.color} rounded-full transition-all`}
                                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>
                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        className={`px-5 py-2.5 bg-gradient-to-r ${gauntlet.color} text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all`}
                    >
                        Submit ({answeredCount}/{questions.length})
                    </button>
                </div>
            </header>

            {/* Question */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col pb-24">
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Q {currentIndex + 1} / {questions.length}</p>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{currentQ.subject}</span>
                        </div>
                        <h2 className="text-base md:text-lg font-semibold leading-relaxed">{currentQ.title}</h2>
                        <div className="mt-6 space-y-2.5">
                            {currentQ.options.map((opt, oIdx) => (
                                <button
                                    key={oIdx}
                                    onClick={() => handleSelectOption(oIdx)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-3 transition-all active:scale-[0.99] ${answers[currentIndex] === oIdx
                                        ? `bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500`
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${answers[currentIndex] === oIdx ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                        {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span className="font-medium text-sm leading-snug">{opt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                        <button
                            onClick={() => setCurrentIndex(c => c - 1)}
                            disabled={currentIndex === 0}
                            className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all"
                        >← Prev</button>
                        <button
                            onClick={() => setCurrentIndex(c => c + 1)}
                            disabled={currentIndex === questions.length - 1}
                            className={`flex-1 py-4 bg-gradient-to-r ${gauntlet.color} text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all`}
                        >Next →</button>
                    </div>
                </div>
            </main>

            {/* Question Palette */}
            <footer className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-2 overflow-x-auto">
                <div className="flex gap-1.5 min-w-max px-1">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-[11px] transition-all ${idx === currentIndex
                                ? 'bg-indigo-600 text-white scale-110'
                                : answers[idx] !== undefined
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
}

export default function ArenaDynamicPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            </div>
        }>
            <ArenaPage params={params} />
        </Suspense>
    );
}
