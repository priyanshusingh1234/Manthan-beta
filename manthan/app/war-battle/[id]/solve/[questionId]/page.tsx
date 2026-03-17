"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Clock, Target, Shield, CheckCircle2, XCircle, Loader2, Swords, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WarSolvePage() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;
    const questionId = params.questionId as string;

    const [question, setQuestion] = useState<any>(null);
    const [war, setWar] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ isCorrect: boolean; pointsChange: number; newTotal: number; correctOption: number } | null>(null);
    const [startedAt] = useState(() => new Date().toISOString());

    // Fetch question + war details
    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }

            try {
                // Fetch question from existing public questions API
                const qRes = await fetch(`/api/questions?id=${questionId}`, { cache: 'no-store' });
                const qJson = await qRes.json();
                const q = qJson.questions?.find((x: any) => x.id === questionId) || qJson.question;
                if (!q) { setError("Question not found."); setLoading(false); return; }
                setQuestion(q);
                setTimeLeft((q.time_limit || 5) * 60);

                // Fetch war details  
                const wRes = await fetch(`/api/war/battle?war_id=${warId}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    cache: 'no-store'
                });
                const wJson = await wRes.json();
                if (wJson.error) { setError(wJson.error); setLoading(false); return; }
                setWar(wJson.war);
            } catch (e: any) {
                setError("Failed to load question.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [warId, questionId, router]);

    // Countdown timer
    useEffect(() => {
        if (!question || result || isSubmitting || loading) return;
        if (timeLeft <= 0) { handleSubmit(selectedOption); return; }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, question, result, isSubmitting, loading]);

    const handleSubmit = useCallback(async (forcedOption?: number | null) => {
        if (isSubmitting || result || !question) return;
        setIsSubmitting(true);

        const optionToSend = forcedOption !== undefined ? forcedOption : selectedOption;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Submit through standard solve API - war points are separate
            const res = await fetch("/api/solve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    questionId: question.id,
                    selectedOption: optionToSend ?? null,
                    startedAt,
                    timeTaken: Math.max(0, (question.time_limit || 5) * 60 - timeLeft),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to submit answer");
                setIsSubmitting(false);
                return;
            }

            setResult(data);
        } catch (e: any) {
            setError("Network error: " + e.message);
            setIsSubmitting(false);
        }
    }, [isSubmitting, result, selectedOption, startedAt, question, timeLeft]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center text-white pb-20">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-bold text-red-400 animate-pulse">Engaging Target...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-400">Target Error</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => router.back()} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Return to Battlefield
                </button>
            </div>
        );
    }

    // Result screen
    if (result) {
        return (
            <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
                <div className={`pointer-events-none absolute inset-0 ${result.isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`} />

                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
                >
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-2xl ${result.isCorrect ? 'bg-green-500/20 shadow-green-500/30' : 'bg-red-500/20 shadow-red-500/30'}`}>
                        {result.isCorrect
                            ? <CheckCircle2 className="w-14 h-14 text-green-400" />
                            : <XCircle className="w-14 h-14 text-red-400" />
                        }
                    </div>

                    <h1 className={`text-5xl font-black mb-2 ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {result.isCorrect ? 'TARGET HIT!' : 'MISSED!'}
                    </h1>

                    <p className="text-slate-400 text-lg mb-8">
                        {result.isCorrect
                            ? `+${result.pointsChange} points scored for your school!`
                            : `${Math.abs(result.pointsChange)} points lost.`
                        }
                    </p>

                    {!result.isCorrect && question?.options && result.correctOption !== undefined && (
                        <div className="w-full bg-slate-900 p-4 rounded-2xl border border-green-500/30 mb-6 text-left">
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Correct Answer</div>
                            <div className="font-bold text-green-400">{question.options[result.correctOption]}</div>
                        </div>
                    )}

                    <div className="w-full bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-8">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Total Points</div>
                        <div className="text-4xl font-black text-indigo-400">{result.newTotal}</div>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => router.push(`/war-battle/${warId}`)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-all active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            <Swords className="w-5 h-5" /> Return to Battlefield
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Solve UI
    const publicUrl = question?.image_url || (question?.image_path
        ? supabase.storage.from("question-images").getPublicUrl(question.image_path).data.publicUrl
        : null);

    const isLowTime = timeLeft <= 30;

    return (
        <div className="min-h-[100dvh] bg-slate-950 text-white pb-32 relative overflow-hidden">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 20px, #ff0000 20px, #ff0000 40px)" }} />
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-red-500/10 blur-3xl" />

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Timer */}
                        <div className={`flex items-center gap-2 font-mono text-base font-bold px-4 py-1.5 rounded-full border transition-all ${isLowTime ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
                            <Clock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </div>

                        {/* Points badge */}
                        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full font-bold text-sm">
                            <Zap className="w-3.5 h-3.5" />
                            {question?.points || 0} pts
                        </div>
                    </div>
                </div>
            </div>

            {/* War context banner */}
            <div className="max-w-3xl mx-auto px-4 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-4 animate-pulse">
                    <Target className="w-3.5 h-3.5" /> ENGAGE TARGET — WAR IN PROGRESS
                </div>
            </div>

            {/* Question Card */}
            <main className="max-w-3xl mx-auto px-4 relative z-10">
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {question?.subject && (
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {question.subject}
                            </span>
                        )}
                        {question?.difficulty && (
                            <span className={`border px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${question.difficulty === 'easy' ? 'bg-green-900/30 border-green-700 text-green-400' : question.difficulty === 'hard' ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-amber-900/30 border-amber-700 text-amber-400'}`}>
                                {question.difficulty}
                            </span>
                        )}
                    </div>

                    {/* Question Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-relaxed">
                        {question?.title}
                    </h1>

                    {question?.body && (
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed whitespace-pre-wrap">
                            {question.body}
                        </p>
                    )}

                    {publicUrl && (
                        <div className="mb-8 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={publicUrl} alt="Question" className="max-h-80 object-contain rounded-xl" />
                        </div>
                    )}

                    {/* MCQ Options */}
                    {question?.options && question.options.length > 0 && (
                        <div className="grid gap-3 mt-6">
                            {question.options.map((opt: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(idx)}
                                        className={`relative p-5 text-left rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group
                                            ${isSelected
                                                ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                                                : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white hover:bg-slate-800/60'
                                            }`}
                                    >
                                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all
                                            ${isSelected ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 group-hover:border-slate-500'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="mt-10 pt-6 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={selectedOption === null || isSubmitting}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black text-lg px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-red-500/20"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Firing...</>
                            ) : (
                                <><Shield className="w-5 h-5" /> Fire Shot</>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
