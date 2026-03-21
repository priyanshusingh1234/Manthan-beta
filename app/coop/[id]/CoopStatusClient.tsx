"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, CheckCircle2, XCircle, Clock, Loader2,
    Zap, ArrowRight, RefreshCw, Shield, Trophy
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type PlayerState = {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isCurrentUser: boolean;
    submission: {
        id: string;
        status: string;
        self_marked_correct: boolean;
        points_awarded: number;
        submission_url: string;
    } | null;
};

type CoopData = {
    challenge: { id: string; status: string; questionId: string; expiresAt: string };
    question: { id: string; title: string; points: number; subject?: string; class_grade?: string } | null;
    initiator: PlayerState;
    partner: PlayerState;
    currentUserId: string;
};

function statusLabel(status: string | undefined) {
    switch (status) {
        case "pending": return { label: "Uploaded — Pending Mark", color: "text-slate-600 bg-slate-100", icon: <Clock className="w-4 h-4" /> };
        case "pending_check": return { label: "In Checker Queue", color: "text-amber-700 bg-amber-100", icon: <Shield className="w-4 h-4" /> };
        case "points_given": return { label: "Points Awarded ✓", color: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4" /> };
        case "auto_approved": return { label: "Verified Correct ✓", color: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4" /> };
        case "ai_confirmed_correct": return { label: "AI Verified Correct ✓", color: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4" /> };
        case "ai_confirmed_wrong": return { label: "Confirmed Wrong ✗", color: "text-red-700 bg-red-100", icon: <XCircle className="w-4 h-4" /> };
        case "flagged_for_ai": return { label: "AI is checking...", color: "text-orange-700 bg-orange-100", icon: <Loader2 className="w-4 h-4 animate-spin" /> };
        default: return { label: "Not submitted yet", color: "text-slate-400 bg-slate-50", icon: <Clock className="w-4 h-4" /> };
    }
}

function PlayerCard({ player, splitPoints, challengeMeta }: { player: PlayerState; splitPoints: number; challengeMeta: CoopData }) {
    const initiator = challengeMeta.initiator;
    const isInitiator = player.id === initiator.id;
    const sub = player.submission;
    const challengeWon = challengeMeta.challenge.status === "won";
    
    // For MCQs, there are no 'written_submissions'. If the challenge is won, it's a win for both.
    const won = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(sub?.status || "");
    const lost = !won && challengeMeta.challenge.status === "lost";
    
    const info = won 
        ? { label: "Win ✓", color: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4" /> }
        : statusLabel(sub?.status);

    return (
        <div className={`relative bg-white rounded-[2rem] p-6 border-2 shadow-sm flex flex-col gap-4 transition-all ${won ? "border-emerald-300" : lost ? "border-red-200" : player.isCurrentUser ? "border-indigo-300" : "border-slate-200"
            }`}>
            {player.isCurrentUser && (
                <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">You</span>
            )}
            {won && (
                <span className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Won!
                </span>
            )}

            {/* Player info */}
            <div className="flex items-center gap-3">
                {player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center border-2 border-white shadow">
                        {player.name[0]?.toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="font-black text-slate-800">{player.name}</p>
                    <p className="text-xs text-slate-500">@{player.username}</p>
                </div>
            </div>

            {/* Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${info.color}`}>
                {info.icon}
                {info.label}
            </div>

            {/* Submitted answer thumbnail */}
            {sub?.submission_url && (
                <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={sub.submission_url}
                        alt="Submission"
                        className="w-full max-h-48 object-contain"
                    />
                </div>
            )}

            {/* Points */}
            {won && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <span className="text-sm font-semibold text-emerald-700">Points Earned</span>
                    <span className="text-xl font-black text-emerald-700">+{splitPoints}</span>
                </div>
            )}
        </div>
    );
}

export default function CoopStatusClient({ challengeId }: { challengeId: string }) {
    const router = useRouter();
    const [data, setData] = useState<CoopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const fetchStatus = useCallback(async (tok: string) => {
        try {
            const res = await fetch(`/api/coop/${challengeId}`, {
                headers: { Authorization: `Bearer ${tok}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } finally {
            setLoading(false);
        }
    }, [challengeId]);

    // Initial load + get token
    useEffect(() => {
        (async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) { router.push("/login"); return; }
            const { data: { session } } = await supabase.auth.getSession();
            const tok = session?.access_token ?? "";
            setToken(tok);
            await fetchStatus(tok);
        })();
    }, [fetchStatus, router]);

    // Auto-refresh every 8 seconds
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            fetchStatus(token);
            setLastRefresh(Date.now());
        }, 8000);
        return () => clearInterval(interval);
    }, [token, fetchStatus]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="font-medium animate-pulse">Loading co-op status...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p className="text-xl font-bold">Challenge not found</p>
                <button onClick={() => router.push("/")} className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const splitPoints = Math.ceil((data.question?.points || 0) / 2);
    const challengeWon = data.challenge.status === "won";
    const initiatorWon = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(data.initiator.submission?.status || "");
    const partnerWon = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(data.partner.submission?.status || "");
    const bothSubmitted = challengeWon || (!!data.initiator.submission && !!data.partner.submission);

    // Time remaining
    const expiresAt = new Date(data.challenge.expiresAt).getTime();
    const timeLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000 / 60));

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4">

            {/* Header banner */}
            <div className={`rounded-[2rem] p-6 text-white text-center shadow-lg relative overflow-hidden ${challengeWon
                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600"
                }`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
                <div className="flex items-center justify-center gap-2 mb-2">
                    {challengeWon ? <Trophy className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                    <h1 className="text-2xl font-black">
                        {challengeWon ? "Co-op Victory! 🎉" : "Co-op Challenge"}
                    </h1>
                </div>
                <p className="text-white/80 text-sm">
                    {challengeWon
                        ? `Both players earned +${splitPoints} points each!`
                        : `Each player earns +${splitPoints} pts if their answer is verified correct`
                    }
                </p>
                {data.question && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold">
                        <Zap className="w-4 h-4" />
                        {data.question.points} pts — {data.question.subject || "Question"}
                    </div>
                )}
            </div>

            {/* Question title */}
            {data.question && (
                <div className="bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">The Question</p>
                    <p className="font-bold text-slate-800">{data.question.title}</p>
                </div>
            )}

            {/* Progress indicator */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-700">Challenge Progress</span>
                    <button
                        onClick={() => token && fetchStatus(token)}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs ${initiatorWon ? "bg-emerald-100 text-emerald-700" : data.initiator.submission ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        <div className={`w-2 h-2 rounded-full ${initiatorWon ? "bg-emerald-500" : data.initiator.submission ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                        {data.initiator.name.split(" ")[0]}: {initiatorWon ? "Win ✓" : data.initiator.submission ? "Submitted" : "Not yet"}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs ${partnerWon ? "bg-emerald-100 text-emerald-700" : data.partner.submission ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        <div className={`w-2 h-2 rounded-full ${partnerWon ? "bg-emerald-500" : data.partner.submission ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                        {data.partner.name.split(" ")[0]}: {partnerWon ? "Win ✓" : data.partner.submission ? "Submitted" : "Not yet"}
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {timeLeft > 0 ? `${timeLeft} minutes left to solve` : "Challenge expired"}
                    <span className="ml-auto">Auto-refreshes every 8s</span>
                </div>
            </div>

            {/* Player cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PlayerCard player={data.initiator} splitPoints={splitPoints} challengeMeta={data} />
                <PlayerCard player={data.partner} splitPoints={splitPoints} challengeMeta={data} />
            </div>

            {/* CTA — solve your part */}
            {!bothSubmitted && data.challenge.status !== "won" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-indigo-800 text-sm">
                            {data.currentUserId === data.initiator.id && !data.initiator.submission
                                ? "You haven't submitted your answer yet!"
                                : data.currentUserId === data.partner.id && !data.partner.submission
                                    ? "Your partner is waiting — submit your answer!"
                                    : "Waiting for the other player to submit"}
                        </p>
                        <p className="text-indigo-600 text-xs mt-0.5">Head to the question and upload your solution</p>
                    </div>
                    <button
                        onClick={() => router.push(`/questions/${data.challenge.questionId}?challenge=${challengeId}`)}
                        className="shrink-0 bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition text-sm"
                    >
                        Solve Now →
                    </button>
                </div>
            )}

            {/* Back */}
            <button
                onClick={() => router.push("/")}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition"
            >
                Back to Dashboard
            </button>
        </div>
    );
}
