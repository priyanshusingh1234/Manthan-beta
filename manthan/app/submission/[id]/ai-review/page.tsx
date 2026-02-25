"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";

type AIReviewData = {
    verdict: "correct" | "wrong";
    breakdown: string;
    raw: string;
    timestamp: string;
};

export default function AIReviewPage() {
    const params = useParams();
    const router = useRouter();
    const submissionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState<AIReviewData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!submissionId) return;

        const fetchReview = async () => {
            try {
                const res = await fetch(`https://ivkrupsksxibaibmiibk.supabase.co/storage/v1/object/public/written-answers/ai-reviews/${submissionId}.json`);
                if (!res.ok) {
                    throw new Error("AI Review not found or still processing.");
                }
                const data = await res.json();
                setReviewData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReview();
    }, [submissionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                <p className="font-medium animate-pulse">Loading AI analysis...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Submission
                </button>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50 
                        ${reviewData?.verdict === "correct" ? "bg-emerald-500/10" : "bg-red-500/10"}`}
                    />

                    <div className="p-8 sm:p-10 relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shrink-0 border border-violet-200">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">AI Analysis Report</h1>
                                <p className="text-slate-500 text-sm font-medium">Independent Gemini Verification</p>
                            </div>
                        </div>

                        {error ? (
                            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex flex-col items-center text-center gap-3">
                                <XCircle className="w-8 h-8 opacity-70" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        ) : reviewData ? (
                            <div className="space-y-6">
                                {/* Verdict Pill */}
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold tracking-wide
                                    ${reviewData.verdict === "correct"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"}`}
                                >
                                    {reviewData.verdict === "correct" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    FINAL VERDICT: {reviewData.verdict.toUpperCase()}
                                </div>

                                {/* Auto-Delete Storage Notice for Wrong Answers */}
                                {reviewData.verdict === "wrong" && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                        <p className="text-sm font-medium text-amber-800">
                                            <span className="font-bold text-amber-900 block mb-0.5">⚠️ Space Saving Policy</span>
                                            Because your answer was marked wrong, this submission and its review will be <strong>automatically deleted in 2 days</strong> to keep our servers fast and clean.
                                        </p>
                                    </div>
                                )}

                                {/* Breakdown */}
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <Sparkles className="w-4 h-4" /> The Breakdown
                                    </h3>
                                    <p className="text-slate-700 leading-relaxed text-lg">
                                        {reviewData.breakdown}
                                    </p>
                                </div>

                                {/* Raw Details */}
                                <details className="group cursor-pointer">
                                    <summary className="text-xs text-slate-400 font-semibold hover:text-slate-600 transition-colors uppercase tracking-wider mb-2 select-none">
                                        View Raw Diagnostics
                                    </summary>
                                    <pre className="mt-2 p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-x-auto border border-slate-700 font-mono shadow-inner whitespace-pre-wrap">
                                        {JSON.stringify(reviewData, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
