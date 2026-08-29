"use client";

import {
    CheckCircle2, XCircle, Loader2, Zap,
    ThumbsUp, Users, Search
} from "lucide-react";
import type { Submission } from "./types";

interface SelfMarkSectionProps {
    submission: Submission;
    questionPoints: number;
    selfMarked: boolean;
    selfMarkResult: { pointsAwarded: number; newTotal: number; breakdown?: string } | null;
    selfMarkError: string | null;
    submitting: boolean;
    deleting: boolean;
    challengeId: string | null;
    onSelfMark: () => void;
    onChallengeFriend: () => void;
    onDelete: () => void;
    onBackToDashboard: () => void;
}

export default function SelfMarkSection({
    submission,
    questionPoints,
    selfMarked,
    selfMarkResult,
    selfMarkError,
    submitting,
    deleting,
    challengeId,
    onSelfMark,
    onChallengeFriend,
    onDelete,
    onBackToDashboard,
}: SelfMarkSectionProps) {
    const currentStatus = submission.status;

    return (
        <>
            {/* Self-mark form — only show when pending and not yet marked */}
            {currentStatus === "pending" && !selfMarked && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Grade My Answer</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
                        Ready to see how you did? Our AI Tutor will evaluate your work step-by-step just like a real examiner.
                        Get <strong className="text-violet-700 dark:text-violet-400">{questionPoints} points</strong> for a perfect answer, or partial credit for correct steps!
                    </p>

                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl mb-5 flex gap-3">
                        <Search className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                            <strong>Note:</strong> Grading may take 5-10 seconds. Do not upload screenshots or typed text, as they will be detected and penalized.
                        </p>
                    </div>

                    {selfMarkError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-700 dark:text-red-400">
                            {selfMarkError}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onSelfMark}
                            disabled={submitting || deleting}
                            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-violet-600/20 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>AI Tutor is grading...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 fill-current" />
                                    <span>Live AI Grade My Answer</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={onDelete}
                            disabled={submitting || deleting}
                            className="mt-2 text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors underline underline-offset-4 decoration-slate-200 dark:decoration-slate-700 hover:decoration-red-200 dark:hover:decoration-red-900 mx-auto"
                        >
                            Discard answer and try again
                        </button>
                    </div>
                </div>
            )}

            {/* AI Confirmed Correct (Full Points) */}
            {currentStatus === "ai_confirmed_correct" && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 mt-5 shadow-sm">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-center text-emerald-700 dark:text-emerald-300">Perfect Answer! ✓</h3>
                    <p className="text-emerald-600 dark:text-emerald-400 mt-2 text-center text-sm font-bold mb-6">
                        +{selfMarkResult?.pointsAwarded ?? questionPoints} points added to your score.
                    </p>

                    {(selfMarkResult?.breakdown || submission.id) && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/50 mb-6 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-emerald-500" /> AI Feedback
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {selfMarkResult?.breakdown || "Your answer was verified by our AI tutor. Great job!"}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onBackToDashboard}
                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-slate-100/20"
                    >
                        Back to Dashboard
                    </button>
                </div>
            )}

            {/* AI Confirmed Partial (Half Points) */}
            {currentStatus === "ai_confirmed_partial" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] border border-amber-200 dark:border-amber-800/50 p-6 sm:p-8 mt-5 shadow-sm">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                            <ThumbsUp className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-center text-amber-700 dark:text-amber-300">Partially Correct</h3>
                    <p className="text-amber-600 dark:text-amber-400 mt-2 text-center text-sm font-bold mb-6">
                        +{selfMarkResult?.pointsAwarded ?? Math.ceil(questionPoints / 2)} points added for effort.
                    </p>

                    {(selfMarkResult?.breakdown || submission.id) && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-amber-100 dark:border-amber-800/50 mb-6 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-amber-500" /> AI Feedback
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {selfMarkResult?.breakdown || "Your approach was mostly right, but had some errors. Review the correct steps!"}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onBackToDashboard}
                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-slate-100/20"
                    >
                        Back to Dashboard
                    </button>
                </div>
            )}

            {/* AI Confirmed Wrong (Penalty) */}
            {currentStatus === "ai_confirmed_wrong" && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-[2rem] border border-red-200 dark:border-red-800/50 p-6 sm:p-8 mt-5 shadow-sm">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-center text-red-700 dark:text-red-300">Incorrect</h3>
                    <p className="text-red-600 dark:text-red-400 mt-2 text-center text-sm font-bold mb-6">
                        Standard penalty applied ({selfMarkResult?.pointsAwarded ?? `-${Math.floor(questionPoints / 5)}`} pts).
                    </p>

                    {(selfMarkResult?.breakdown || submission.id) && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-red-100 dark:border-red-800/50 mb-6 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-red-500" /> AI Correction
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {selfMarkResult?.breakdown || "Your answer did not match the required logic. Check the teacher's model answer to understand the mistake."}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {!challengeId && (
                            <button
                                onClick={onChallengeFriend}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                            >
                                <Users className="w-5 h-5" />
                                Tag a Friend to Co-op Retry!
                            </button>
                        )}
                        <button
                            onClick={onBackToDashboard}
                            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-slate-100/20"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
