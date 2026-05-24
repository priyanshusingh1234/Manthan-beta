"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Capacitor } from "@capacitor/core";
import { Clock, Target, Shield, CheckCircle2, XCircle, Loader2, Swords, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCorrectSound } from "@/hooks/useCorrectSound";

async function nativeHaptic(kind: "light" | "medium" = "light") {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
        await Haptics.impact({ style: kind === "light" ? ImpactStyle.Light : ImpactStyle.Medium });
    } catch {
        // ignore haptics failures
    }
}

export default function WarSolvePage() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;
    const questionId = params.questionId as string;

    const [question, setQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ isCorrect: boolean; pointsChange: number; newTotal: number; correctOption: number } | null>(null);
    const [startedAt] = useState(() => new Date().toISOString());
    const playCorrect = useCorrectSound();

    // Fetch question + war details together
    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }
            try {
                // Fetch via the battle API which already includes all question data
                const res = await fetch(`/api/war/battle?war_id=${warId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    cache: 'no-store'
                });
                const json = await res.json();
                if (json.error) { setError(json.error); setLoading(false); return; }

                // Search in BOTH myQuestions and opponentQuestions
                const allQ = [...(json.myQuestions || []), ...(json.opponentQuestions || [])];
                const q = allQ.find((x: any) => x.id === questionId);
                if (!q) { setError("Question not found in this war."); setLoading(false); return; }
                setQuestion(q);
                setTimeLeft((q.time_limit || 5) * 60);
            } catch {
                setError("Failed to load question.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [questionId, warId, router]);

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
            const res = await fetch("/api/solve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({
                    questionId: question.id,
                    selectedOption: optionToSend ?? null,
                    startedAt,
                    timeTaken: Math.max(0, (question.time_limit || 5) * 60 - timeLeft),
                    warId,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to submit."); setIsSubmitting(false); return; }
            setResult(data);
            if (data?.isCorrect) {
                playCorrect();
            }
            nativeHaptic(data?.isCorrect ? "medium" : "light");
        } catch (e: any) {
            setError("Network error: " + e.message);
            setIsSubmitting(false);
        }
    }, [isSubmitting, result, selectedOption, startedAt, question, timeLeft]);

    const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    const isLowTime = timeLeft > 0 && timeLeft <= 30;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3 text-red-500" />
                <p className="font-bold animate-pulse">Loading target data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto px-3 sm:px-4 py-14 sm:py-16 text-center native-page-shell">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-400">Error</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <button onClick={() => router.back()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 mx-auto native-card">
                    <ArrowLeft className="w-4 h-4" /> Return to Battlefield
                </button>
            </div>
        );
    }

    // Result screen
    if (result) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-3 sm:px-4 py-12 native-page-shell">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="w-full max-w-sm text-center"
                >
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl ${result.isCorrect ? 'bg-green-100 dark:bg-green-900/30 shadow-green-500/20' : 'bg-red-100 dark:bg-red-900/30 shadow-red-500/20'}`}>
                        {result.isCorrect
                            ? <CheckCircle2 className="w-12 h-12 text-green-500" />
                            : <XCircle className="w-12 h-12 text-red-500" />
                        }
                    </div>

                    <h1 className={`text-4xl font-black mb-2 ${result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.isCorrect ? 'TARGET HIT!' : 'SHOT MISSED!'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {result.isCorrect
                            ? `+${result.pointsChange} points earned for your school!`
                            : `No penalty for a miss in war mode.`}
                    </p>

                    {!result.isCorrect && question?.options && result.correctOption !== undefined && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-2xl p-4 text-left mb-4">
                            <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Correct Answer</div>
                            <div className="font-bold text-slate-800 dark:text-white">{question.options[result.correctOption]}</div>
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Total Points</div>
                        <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{result.newTotal}</div>
                    </div>

                    <button
                        onClick={() => {
                            nativeHaptic("light");
                            router.push(`/war-battle/${warId}`);
                        }}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-base transition-all active:scale-95 shadow-lg shadow-red-500/20 native-card"
                    >
                        <Swords className="w-5 h-5" /> Return to Battlefield
                    </button>
                </motion.div>
            </div>
        );
    }

    // Solve UI
    const publicUrl = question?.image_url
        || (question?.image_path ? supabase.storage.from("question-images").getPublicUrl(question.image_path).data.publicUrl : null);

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-6 pb-[calc(112px+env(safe-area-inset-bottom))] native-page-shell native-scroll">
            {/* Back + War context bar */}
            <div className="flex items-center justify-between mb-5">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Battlefield
                </button>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-500 animate-pulse">
                    <Target className="w-3.5 h-3.5" /> WAR TARGET
                </div>
            </div>

            {/* Timer + Points sticky bar */}
            <div className={`sticky top-[64px] z-30 flex items-center justify-between mb-5 sm:mb-6 px-4 py-2.5 rounded-2xl border backdrop-blur-sm shadow-sm transition-all native-card ${isLowTime ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-500/50' : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'}`}>
                <div className={`flex items-center gap-2 font-mono text-lg sm:text-xl font-black ${isLowTime ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
                    <Clock className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:block">
                        No penalty if wrong
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-full font-black text-sm">
                        <Zap className="w-3.5 h-3.5" /> {question?.points || 0} pts
                    </div>
                </div>
            </div>

            {/* Main Question Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-sm native-card">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {question?.subject && (
                        <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                            {question.subject}
                        </span>
                    )}
                    {question?.difficulty && (
                        <span className={`border px-3 py-1 rounded-full text-xs font-bold ${question.difficulty === 'easy' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400' : question.difficulty === 'hard' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400'}`}>
                            {question.difficulty}
                        </span>
                    )}
                    <span className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Swords className="w-3 h-3" /> War Question
                    </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-relaxed">
                    {question?.title}
                </h1>

                {question?.body && (
                    <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed whitespace-pre-wrap">
                        {question.body}
                    </p>
                )}

                {publicUrl && (
                    <div className="mb-8 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={publicUrl} alt="Question" className="max-h-72 object-contain rounded-xl" />
                    </div>
                )}

                {/* MCQ Options */}
                {question?.options && question.options.length > 0 && (
                    <div className="grid gap-3 mt-4">
                        {question.options.map((opt: string, idx: number) => {
                            const isSelected = selectedOption === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedOption(idx);
                                        nativeHaptic("light");
                                    }}
                                    className={`p-4 text-left rounded-2xl border-2 transition-all duration-150 flex items-center gap-3 group native-card
                                        ${isSelected
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                                >
                                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all
                                        ${isSelected ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={`text-sm sm:text-base font-medium ${isSelected ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Submit */}
                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={() => handleSubmit()}
                        disabled={selectedOption === null || isSubmitting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-base px-8 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/10 native-card"
                    >
                        {isSubmitting
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Firing...</>
                            : <><Shield className="w-5 h-5" /> Fire Shot</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
