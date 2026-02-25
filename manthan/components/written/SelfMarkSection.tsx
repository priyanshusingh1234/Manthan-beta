"use client";

import {
    CheckCircle2, XCircle, Loader2, AlertTriangle,
    ThumbsUp, Users, Shield, Search
} from "lucide-react";
import type { Submission } from "./types";

interface SelfMarkSectionProps {
    submission: Submission;
    questionPoints: number;
    selfMarked: boolean;
    selfMarkResult: { pointsAwarded: number; newTotal: number; checkerDeadline: string } | null;
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
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Did you get it right?</h2>
                    <p className="text-slate-500 text-sm mb-5">
                        Compare honestly with the model answer above. Claim your{" "}
                        <strong className="text-violet-700">{questionPoints} points</strong> if you&apos;re correct.
                    </p>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            <strong>Warning:</strong> The community will review your claim. If 2 peers flag it as
                            wrong, an independent AI Verifier will check it. If the AI confirms it&apos;s false,
                            you lose {questionPoints} pts + <strong>3 extra penalty points</strong>.
                        </p>
                    </div>

                    {selfMarkError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {selfMarkError}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onSelfMark}
                            disabled={submitting || deleting}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                            I Got It Right — Claim {questionPoints} Points
                        </button>

                        <button
                            onClick={onChallengeFriend}
                            disabled={submitting || deleting}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <Users className="w-5 h-5" />
                            I Got It Wrong — Tag a Friend to Recover Points!
                        </button>

                        <button
                            onClick={onDelete}
                            disabled={submitting || deleting}
                            className="mt-2 text-sm text-slate-400 hover:text-red-500 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-red-200 mx-auto"
                        >
                            Or discard answer and try again alone
                        </button>
                    </div>
                </div>
            )}

            {/* Points awarded confirmation */}
            {(selfMarked || (submission.self_marked_correct && ["pending_check"].includes(currentStatus))) && (
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Points Awarded!</h2>
                            <p className="text-slate-500 text-sm">
                                +{selfMarkResult?.pointsAwarded ?? submission.points_awarded} points added provisionally
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Shield className="w-4 h-4 text-violet-500" /> Community Verification Active
                        </div>
                        <p>Your peers are verifying your answer right now.</p>
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            Checkers are competing to verify or flag this answer
                        </div>
                    </div>

                    {selfMarkResult && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between mb-4">
                            <span className="text-sm text-emerald-700 font-semibold">Your total points</span>
                            <span className="text-2xl font-black text-emerald-700">{selfMarkResult.newTotal}</span>
                        </div>
                    )}

                    <button
                        onClick={onBackToDashboard}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                        Back to Dashboard
                    </button>
                </div>
            )}

            {/* AI confirmed wrong */}
            {currentStatus === "ai_confirmed_wrong" && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center mt-5">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-xl font-black text-red-700">Answer Confirmed Incorrect</h3>
                    <p className="text-red-600 mt-2 text-sm mb-4">
                        Points + {questionPoints >= 15 ? "3-point penalty" : "penalty"} have been deducted.
                    </p>
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                        {!challengeId && (
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl mb-1 text-sm text-indigo-800 text-left">
                                <span className="font-bold flex items-center gap-1.5 mb-1">
                                    <Users className="w-4 h-4" /> Co-op Recovery Available!
                                </span>
                                You can&apos;t retry this alone, but if you tag a friend and they solve it correctly, you&apos;ll both split the points!
                            </div>
                        )}
                        <a
                            href={`/submission/${submission.id}/ai-review`}
                            className="w-full inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white border border-red-200 rounded-xl text-red-700 font-bold text-sm hover:bg-red-100 transition-colors shadow-sm"
                        >
                            <Search className="w-4 h-4" /> Read AI Breakdown
                        </a>
                        {!challengeId && (
                            <button
                                onClick={onChallengeFriend}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                            >
                                <Users className="w-5 h-5" />
                                Tag a Friend to Retry!
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Auto approved / AI confirmed correct */}
            {(currentStatus === "auto_approved" || currentStatus === "ai_confirmed_correct") && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center mt-5">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-xl font-black text-emerald-700">
                        {currentStatus === "auto_approved" ? "Auto-Approved! ✓" : "Verified by AI! ✓"}
                    </h3>
                    <p className="text-emerald-600 mt-2 text-sm mb-4">
                        {currentStatus === "auto_approved"
                            ? "Two peers marked your answer correct. Points permanently secured!"
                            : "AI verified your answer is absolutely correct. Well done!"}
                    </p>
                    {currentStatus === "ai_confirmed_correct" && (
                        <a
                            href={`/submission/${submission.id}/ai-review`}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors shadow-sm"
                        >
                            <Search className="w-4 h-4" /> Read AI Feedback
                        </a>
                    )}
                </div>
            )}
        </>
    );
}
