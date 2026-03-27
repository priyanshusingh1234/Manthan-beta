"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Swords, XCircle, Clock, Loader2,
    Zap, Trophy, ArrowRight, Users, CheckCircle, X
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type PlayerState = {
    id: string;
    name: string;
    avatar: string | null;
    submission: { status: string } | null;
};

type ChallengeState = {
    initiator: PlayerState;
    partner: PlayerState;
    challengeStatus: string;
    expiresAt: string;
    questionPoints: number;
    currentUserId: string;
    message?: string | null;
};

function parseChallengeId(href: string | null): string | null {
    if (!href) return null;
    try {
        const url = new URL(href, "http://localhost");
        return url.searchParams.get("challenge");
    } catch {
        return null;
    }
}

const SUCCESS_STATUSES = ["pending_check", "points_given", "auto_approved", "ai_confirmed_correct"];

function PlayerAvatar({ player, isYou, size }: { player: PlayerState; isYou: boolean; size: "sm" | "md" }) {
    const dim = size === "sm" ? "w-8 h-8 text-sm" : "w-12 h-12 text-lg";
    return (
        <div className="flex flex-col items-center gap-0.5 text-center">
            {player.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={player.avatar}
                    alt={player.name}
                    className={`${dim} rounded-full object-cover border-2 border-white shadow-md`}
                />
            ) : (
                <div className={`${dim} rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center border-2 border-white shadow-md`}>
                    {player.name[0]?.toUpperCase()}
                </div>
            )}
            <span className={`font-bold text-slate-700 dark:text-slate-300 ${size === "sm" ? "text-[9px]" : "text-xs"}`}>
                {player.name.split(" ")[0]}
            </span>
            {isYou && (
                <span className={`bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black ${size === "sm" ? "text-[8px]" : "text-[10px]"}`}>
                    YOU
                </span>
            )}
        </div>
    );
}

export default function CoopNotifCard({
    notif,
    compact = false,
    onNavigate,
}: {
    notif: {
        title: string;
        body: string;
        href: string | null;
        read: boolean;
        actor_name?: string | null;
        actor_avatar?: string | null;
    };
    compact?: boolean;
    onNavigate?: () => void;
}) {
    const router = useRouter();
    const challengeId = parseChallengeId(notif.href);
    const [state, setState] = useState<ChallengeState | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState("");
    const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
    const [localStatus, setLocalStatus] = useState<string | null>(null);

    const fetchState = useCallback(async () => {
        if (!challengeId) { setLoading(false); return; }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`/api/coop/${challengeId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) { setLoading(false); return; }
            const data = await res.json();
            setState({
                initiator: { id: data.initiator.id, name: data.initiator.name, avatar: data.initiator.avatar, submission: data.initiator.submission },
                partner: { id: data.partner.id, name: data.partner.name, avatar: data.partner.avatar, submission: data.partner.submission },
                challengeStatus: data.challenge.status,
                expiresAt: data.challenge.expiresAt,
                questionPoints: data.question?.points || 0,
                currentUserId: data.currentUserId,
                message: data.challenge.message,
            });
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => { fetchState(); }, [fetchState]);

    // Live countdown timer
    useEffect(() => {
        if (!state?.expiresAt) return;
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(state.expiresAt).getTime() - Date.now()) / 1000));
            if (diff === 0) { setTimeLeft("Expired"); return; }
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            if (h > 0) setTimeLeft(`${h}h ${m}m left`);
            else if (m > 0) setTimeLeft(`${m}m ${String(s).padStart(2, "0")}s left`);
            else setTimeLeft(`${s}s left`);
        };
        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, [state?.expiresAt]);

    if (!challengeId) return null;

    const navigate = (href: string) => {
        onNavigate?.();
        router.push(href);
    };

    // Derived state
    const challengeStatus = localStatus ?? state?.challengeStatus ?? '';
    const splitPoints = state ? Math.ceil(state.questionPoints / 2) : 0;
    const won = challengeStatus === "won";
    const lost = challengeStatus === "lost";
    const rejected = challengeStatus === "rejected";
    const isInitiator = state?.currentUserId === state?.initiator.id;
    const isPartner = state?.currentUserId === state?.partner.id;
    const mySubmission = isInitiator ? state?.initiator.submission : state?.partner.submission;
    const iHaveSubmitted = !!mySubmission;
    const iWon = SUCCESS_STATUSES.includes(mySubmission?.status ?? "");
    const isExpired = state?.expiresAt ? new Date(state.expiresAt).getTime() < Date.now() : false;
    // Partner can solve only after accepting (status becomes 'active') or if already active
    const canSolve = !won && !lost && !rejected && !isExpired && !iHaveSubmitted && isPartner && challengeStatus !== 'pending';
    // Show accept/reject only to the partner when challenge is still pending
    const showAcceptReject = isPartner && (challengeStatus === 'pending') && !localStatus;

    const handleAction = async (action: 'accept' | 'reject') => {
        if (!state || actionLoading) return;
        setActionLoading(action);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`/api/coop/${challengeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                setLocalStatus(data.status);
                if (action === 'accept') {
                    // Navigate to solve page immediately
                    navigate(notif.href!);
                }
            } else {
                alert(data.error || 'Something went wrong');
            }
        } catch {
            alert('Network error — please try again');
        } finally {
            setActionLoading(null);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // COMPACT  (bell dropdown)
    // ─────────────────────────────────────────────────────────────
    if (compact) {
        return (
            <div className={`px-3 pt-2 pb-3 ${!notif.read ? "bg-indigo-50/40 dark:bg-indigo-900/10" : "bg-white dark:bg-slate-900"}`}>
                <div className={`rounded-2xl overflow-hidden border ${won ? "border-emerald-200 dark:border-emerald-900/50" : lost ? "border-slate-300 dark:border-slate-700" : "border-indigo-200 dark:border-indigo-800"
                    }`}>
                    {/* Coloured top strip */}
                    <div className={`px-3 py-2 flex items-center justify-between ${won ? "bg-gradient-to-r from-emerald-500 to-green-600"
                        : lost ? "bg-gradient-to-r from-slate-600 to-slate-700"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600"
                        }`}>
                        <span className="text-white font-black text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                            {won ? <Trophy className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                            {won ? "HELP SUCCESS!" : lost ? "HELP FAILED" : "HELP REQUEST"}
                        </span>
                        {!won && !lost && timeLeft && (
                            <span className="text-white/80 text-[10px] flex items-center gap-1 font-bold">
                                <Clock className="w-3 h-3" />{timeLeft}
                            </span>
                        )}
                    </div>

                    <div className={`p-3 ${won ? "bg-emerald-50 dark:bg-emerald-900/10" : lost ? "bg-slate-50 dark:bg-slate-900/50" : "bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-slate-900 dark:to-slate-800"}`}>
                        {loading ? (
                            <div className="flex items-center gap-2 py-1 text-slate-400 text-xs">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading live status...
                            </div>
                        ) : !state ? (
                            <p className="text-xs text-slate-500">{notif.body}</p>
                        ) : (
                            <>
                                {/* Players */}
                                <div className="flex items-center gap-2 mb-2.5">
                                    <PlayerAvatar player={state.initiator} isYou={state.currentUserId === state.initiator.id} size="sm" />
                                    <div className="flex-1 flex flex-col items-center">
                                        <Users className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mb-0.5" />
                                        <div className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                            <Zap className="w-2.5 h-2.5 text-amber-500" />+{splitPoints} pts each
                                        </div>
                                    </div>
                                    <PlayerAvatar player={state.partner} isYou={state.currentUserId === state.partner.id} size="sm" />
                                </div>

                                {/* Custom Message */}
                                {state.message && (
                                    <div className="mb-2.5 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-indigo-100 dark:border-slate-700 italic text-[11px] text-slate-600 dark:text-slate-300 border-l-4 border-l-indigo-400">
                                        &ldquo;{state.message}&rdquo;
                                    </div>
                                )}

                                {/* Status pill */}
                                <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl mb-2.5 ${won ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                    : lost ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                        : iHaveSubmitted ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                            : isExpired ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                                : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                    }`}>
                                    {won ? <><Trophy className="w-3 h-3" />Both solved! +{splitPoints} pts earned</> :
                                        lost ? <><XCircle className="w-3 h-3" />Help failed</> :
                                            iHaveSubmitted ? <><Clock className="w-3 h-3" />Submitted — verifying...</> :
                                                isExpired ? <><Clock className="w-3 h-3" />Request expired</> :
                                                    isInitiator ? <><Loader2 className="w-3 h-3 animate-spin" />Waiting for partner...</> :
                                                        <><Users className="w-3 h-3" />Help requested!</>}
                                </div>

                                {/* Accept / Reject (compact) */}
                                {showAcceptReject && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('reject')}
                                            disabled={!!actionLoading}
                                            className="flex-1 flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-black py-2 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction('accept')}
                                            disabled={!!actionLoading}
                                            className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black py-2 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                            Accept
                                        </button>
                                    </div>
                                )}
                                {rejected && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        <XCircle className="w-3 h-3" /> Request declined
                                    </div>
                                )}
                                {canSolve && (
                                    <button
                                        onClick={() => navigate(notif.href!)}
                                        className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black py-2 rounded-xl transition-colors"
                                    >
                                        Solve Now! <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                                {(won || iWon) && (
                                    <button
                                        onClick={() => navigate(`/coop/${challengeId}`)}
                                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-2 rounded-xl transition-colors"
                                    >
                                        <Trophy className="w-3 h-3" /> View Result
                                    </button>
                                )}
                                {isInitiator && !won && !lost && (
                                    <button
                                        onClick={() => navigate(`/coop/${challengeId}`)}
                                        className="w-full flex items-center justify-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-black py-2 rounded-xl transition-colors"
                                    >
                                        Watch Live <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // FULL  (/notifications page)
    // ─────────────────────────────────────────────────────────────
    return (
        <div className={`w-full bg-white dark:bg-slate-900 rounded-3xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${won ? "border-emerald-300 dark:border-emerald-800/50" : lost ? "border-slate-200 dark:border-slate-800" : !notif.read ? "border-indigo-300 dark:border-indigo-800" : "border-indigo-200 dark:border-indigo-900/50"
            }`}>
            {/* Banner */}
            <div className={`px-5 py-3 flex items-center justify-between ${won ? "bg-gradient-to-r from-emerald-500 to-green-600"
                : lost ? "bg-gradient-to-r from-slate-600 to-slate-700"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600"
                }`}>
                <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                    {won ? <Trophy className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    {won ? "HELP SUCCESS!" : lost ? "HELP FAILED" : "HELP REQUEST — LIVE"}
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />}
                </div>
                {!won && !lost && timeLeft && (
                    <div className="flex items-center gap-1 text-white/70 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />{timeLeft}
                    </div>
                )}
            </div>

            <div className="p-5">
                {loading ? (
                    <div className="flex items-center gap-3 py-4 text-slate-400 dark:text-slate-500 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        Fetching live help status...
                    </div>
                ) : !state ? (
                    <div className="py-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{notif.body}</p>
                        {notif.href && (
                            <button onClick={() => navigate(notif.href!)} className="mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                Go to question →
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Players row */}
                        <div className="flex items-center gap-4 mb-4">
                            <PlayerAvatar player={state.initiator} isYou={state.currentUserId === state.initiator.id} size="md" />

                            <div className="flex-1 flex flex-col items-center gap-1 text-center font-mono">
                                <Users className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Split Reward</div>
                                <div className="flex items-center gap-1 font-black text-indigo-700 dark:text-indigo-400 text-xl">
                                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                                    +{splitPoints}
                                    <span className="text-xs font-semibold text-slate-400">pts</span>
                                </div>
                                <div className="text-[9px] text-slate-400">if verified correct</div>
                            </div>

                            <PlayerAvatar player={state.partner} isYou={state.currentUserId === state.partner.id} size="md" />
                        </div>

                        {/* Custom Message (Full View) */}
                        {state.message && (
                            <div className="mb-4 px-4 py-3 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-slate-800 italic text-sm text-slate-600 dark:text-slate-300 border-l-4 border-l-indigo-400">
                                &ldquo;{state.message}&rdquo;
                            </div>
                        )}

                        {/* Live status */}
                        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold mb-4 ${won ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                            : lost ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                                : iHaveSubmitted ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                                    : isExpired ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50"
                            }`}>
                            {won ? <Trophy className="w-4 h-4 shrink-0" /> :
                                lost ? <XCircle className="w-4 h-4 shrink-0" /> :
                                    iHaveSubmitted ? <Clock className="w-4 h-4 shrink-0" /> :
                                        isExpired ? <Clock className="w-4 h-4 shrink-0" /> :
                                            isInitiator ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> :
                                                <Users className="w-4 h-4 shrink-0" />}
                            <span>
                                {won ? `Help Success! Both players earned +${splitPoints} points.`
                                    : lost ? "The help request wasn't completed in time."
                                        : iHaveSubmitted ? "Your answer is being verified by the community."
                                            : isExpired ? "This help request has expired."
                                                : isInitiator ? "Waiting for your partner to help with the question..."
                                                    : `You've been asked for help! Solve to earn +${splitPoints} pts together.`}
                            </span>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col gap-2">
                            {/* Accept / Reject (full view) */}
                            {showAcceptReject && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAction('reject')}
                                        disabled={!!actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-bold py-3 rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        {actionLoading === 'reject'
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <X className="w-4 h-4" />}
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleAction('accept')}
                                        disabled={!!actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                        {actionLoading === 'accept'
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <CheckCircle className="w-4 h-4" />}
                                        Accept & Solve!
                                    </button>
                                </div>
                            )}
                            {rejected && (
                                <div className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 font-semibold text-sm">
                                    <XCircle className="w-4 h-4" /> You declined this request
                                </div>
                            )}
                            {canSolve && (
                                <button
                                    onClick={() => navigate(notif.href!)}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-all shadow-md shadow-indigo-600/20"
                                >
                                    <Users className="w-4 h-4" /> Help Now!
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                            {isInitiator && !won && !lost && (
                                <button
                                    onClick={() => navigate(notif.href!)}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-all shadow-md shadow-indigo-600/20"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" /> Watch Partner Live
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/coop/${challengeId}`)}
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-2xl transition-all text-sm shadow-sm"
                            >
                                <Users className="w-4 h-4" /> View Full Help Status
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
