"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, CheckCircle2, XCircle, Clock, Loader2,
    Zap, Trophy, Swords, ArrowRight, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type PlayerInfo = {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    submission: {
        status: string;
        points_awarded: number;
        submission_url?: string;
    } | null;
};

type CoopData = {
    challenge: { id: string; status: string; expiresAt: string };
    question: { id: string; title: string; points: number } | null;
    initiator: PlayerInfo;
    partner: PlayerInfo;
    currentUserId: string;
};

// Statuses the partner has that count as "submitted and in review"
const SUBMITTED_STATUSES = ["pending", "pending_check", "points_given", "auto_approved", "ai_confirmed_correct", "flagged_for_ai", "flagged"];
const SUCCESS_STATUSES = ["pending_check", "points_given", "auto_approved", "ai_confirmed_correct"];
const WRONG_STATUSES = ["ai_confirmed_wrong"];

export default function CoopSpectatorScreen({
    challengeId,
    questionPoints,
    currentUserId,
}: {
    challengeId: string;
    questionPoints: number;
    currentUserId: string;
}) {
    const router = useRouter();
    const [data, setData] = useState<CoopData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [lastRefreshed, setLastRefreshed] = useState(Date.now());
    const splitPoints = Math.ceil(questionPoints / 2);

    const fetchStatus = useCallback(async (tok: string) => {
        try {
            const res = await fetch(`/api/coop/${challengeId}`, {
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setLastRefreshed(Date.now());
            }
        } catch { /* ignore */ }
    }, [challengeId]);

    // Initial load
    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setToken(session.access_token);
            await fetchStatus(session.access_token);
        })();
    }, [fetchStatus]);

    // Poll every 5s
    useEffect(() => {
        if (!token) return;
        const iv = setInterval(() => fetchStatus(token), 5000);
        return () => clearInterval(iv);
    }, [token, fetchStatus]);

    // Countdown timer
    useEffect(() => {
        if (!data?.challenge.expiresAt) return;
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(data.challenge.expiresAt).getTime() - Date.now()) / 1000));
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            if (diff === 0) { setTimeLeft("Expired"); return; }
            if (h > 0) setTimeLeft(`${h}h ${m}m left`);
            else if (m > 0) setTimeLeft(`${m}m ${String(s).padStart(2, "0")}s left`);
            else setTimeLeft(`${s}s left`);
        };
        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, [data?.challenge.expiresAt]);

    // Loading gate
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="font-medium animate-pulse">Loading help status...</p>
            </div>
        );
    }

    const initiator = data.initiator;
    const partner = data.partner;
    const isInitiator = initiator.id === currentUserId;
    const otherPlayer = isInitiator ? partner : initiator;

    const partnerSub = partner.submission;
    const partnerStatus = partnerSub?.status ?? null;

    const challengeWon = data.challenge.status === "won";
    const challengeLost = data.challenge.status === "lost";
    const partnerSubmitted = !!partnerSub && SUBMITTED_STATUSES.includes(partnerStatus!);
    const partnerCorrect = challengeWon || SUCCESS_STATUSES.includes(partnerStatus ?? "");
    const partnerWrong = challengeLost || WRONG_STATUSES.includes(partnerStatus ?? "");

    function OtherPlayerAvatar() {
        if (otherPlayer.avatar) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={otherPlayer.avatar} alt={otherPlayer.name} className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg" />;
        }
        return (
            <div className="w-16 h-16 rounded-full bg-white/25 text-white font-black text-2xl flex items-center justify-center border-2 border-white/40 shadow-lg">
                {otherPlayer.name[0]?.toUpperCase()}
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-5 pb-16">

            {/* ── Hero Banner ────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-[2rem] p-6 text-white shadow-xl transition-all duration-700 ${challengeWon
                ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
                : partnerWrong
                    ? "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
                    : "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700"
                }`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_60%)]" />

                {/* Floating particles */}
                <div className="absolute top-5 right-14 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />

                <div className="relative z-10">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black border border-white/20">
                            <span className="relative flex h-2 w-2">
                                {!challengeWon && !partnerWrong && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${challengeWon ? "bg-emerald-300" : partnerWrong ? "bg-slate-400" : "bg-red-500"}`} />
                            </span>
                            {challengeWon ? "HELP SUCCESS" : partnerWrong ? "HELP FAILED" : "HELP REQUEST LIVE"}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {timeLeft || "..."}
                        </div>
                    </div>

                    {/* Partner avatar */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="relative">
                            <OtherPlayerAvatar />
                            {/* Live pulse ring — only when waiting */}
                            {!partnerSubmitted && !challengeWon && !partnerWrong && isInitiator && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white items-center justify-center">
                                        <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                                    </span>
                                </span>
                            )}
                            {(challengeWon || partnerCorrect) && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </span>
                                </span>
                            )}
                            {partnerWrong && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white items-center justify-center">
                                        <XCircle className="w-3 h-3 text-white" />
                                    </span>
                                </span>
                            )}
                        </div>

                        <div>
                            <p className="text-white font-black text-lg leading-tight">{otherPlayer.name}</p>
                            <p className="text-white/60 text-xs">@{otherPlayer.username}</p>
                        </div>

                        {/* Status headline */}
                        <div className="mt-1">
                            {challengeWon || partnerCorrect ? (
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                    <Trophy className="w-4 h-4 text-yellow-300" />
                                    <span className="font-black text-sm">Solved it! You both earn +{splitPoints} pts</span>
                                </div>
                            ) : partnerWrong ? (
                                <p className="text-white/80 text-sm font-semibold">Partner couldn&apos;t solve it either.</p>
                            ) : partnerSubmitted ? (
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                    <Clock className="w-4 h-4 text-amber-300" />
                                    <span className="font-bold text-sm">Submitted — awaiting verification</span>
                                </div>
                            ) : (
                                <p className="text-white/70 text-sm">{isInitiator ? "Solving right now... give them a moment!" : "You are currently solving this!"}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── You vs Partner card ─────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Help Request Breakdown</p>

                <div className="flex items-center gap-3">
                    {/* Initiator */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-500 mb-1">{isInitiator ? "You (Initiator)" : "Initiator"}</p>
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                            <XCircle className="w-3 h-3" /> Got it wrong
                        </div>
                    </div>

                    <Swords className="w-5 h-5 text-slate-300 shrink-0" />

                    {/* Partner */}
                    <div className={`flex-1 rounded-2xl p-3 text-center border transition-all ${challengeWon || partnerCorrect
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                        : partnerWrong
                             ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                             : partnerSubmitted
                                 ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                                 : "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                        }`}>
                        <p className="text-xs font-bold text-slate-500 mb-1">{!isInitiator ? "You (Partner)" : "Partner"}</p>
                        {challengeWon || partnerCorrect ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Correct ✓
                            </div>
                        ) : partnerWrong ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[11px] font-bold">
                                <XCircle className="w-3 h-3" /> Wrong ✗
                            </div>
                        ) : partnerSubmitted ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                <Clock className="w-3 h-3" /> In Review
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-200 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
                                <Loader2 className="w-3 h-3 animate-spin" /> Solving...
                            </div>
                        )}
                    </div>
                </div>

                {/* If won — points summary */}
                {(challengeWon || partnerCorrect) && (
                    <div className="mt-4 flex flex-col gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                                Total Reward (50/50 Split)
                            </span>
                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">+{splitPoints * 2 + (questionPoints % 2 !== 0 ? -1 : 0)} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-500 font-medium px-1 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2">
                            <span>Initiator: <span className="font-bold">+{splitPoints}</span></span>
                            <span>Partner: <span className="font-bold">+{splitPoints}</span></span>
                        </div>
                    </div>
                )}

                {/* Auto-refresh notice */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 justify-center">
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-refreshes every 5 seconds</span>
                </div>
            </div>

            {/* ── Actions ─────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => router.push(`/coop/${challengeId}`)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-indigo-600/20"
                >
                    <Users className="w-5 h-5" />
                    View Full Status
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => router.push("/")}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
