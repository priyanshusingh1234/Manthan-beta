import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
    Swords, XCircle, Clock, Loader2,
    Zap, Trophy, ArrowRight, Users, CheckCircle, X
} from "lucide-react-native";
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
        // If href matches `/questions/123?challenge=abc` or `/solve/123?challenge=abc`
        if (href.includes("challenge=")) {
            const parts = href.split("challenge=");
            return parts[1]?.split("&")[0] || null;
        }
        return null;
    } catch {
        return null;
    }
}

const SUCCESS_STATUSES = ["pending_check", "points_given", "auto_approved", "ai_confirmed_correct"];

function PlayerAvatar({ player, isYou, size }: { player: PlayerState; isYou: boolean; size: "sm" | "md" }) {
    const dim = size === "sm" ? 32 : 48;
    const rounded = dim / 2;
    return (
        <View className="items-center gap-0.5">
            {player.avatar ? (
                <Image
                    source={{ uri: player.avatar }}
                    style={{ width: dim, height: dim, borderRadius: rounded }}
                    className="border-2 border-white dark:border-slate-800 shadow"
                />
            ) : (
                <View 
                    style={{ width: dim, height: dim, borderRadius: rounded }} 
                    className="bg-indigo-100 dark:bg-indigo-950 items-center justify-center border-2 border-white dark:border-slate-800 shadow"
                >
                    <Text className="text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                        {player.name[0]?.toUpperCase() || "?"}
                    </Text>
                </View>
            )}
            <Text className={`font-bold text-slate-700 dark:text-slate-300 ${size === "sm" ? "text-[9px]" : "text-xs"}`} numberOfLines={1}>
                {player.name.split(" ")[0]}
            </Text>
            {isYou && (
                <View className="bg-indigo-100 dark:bg-indigo-900/40 px-1 py-0.5 rounded-full mt-0.5">
                    <Text className={`font-black text-indigo-700 dark:text-indigo-300 ${size === "sm" ? "text-[7px]" : "text-[8px]"}`}>
                        YOU
                    </Text>
                </View>
            )}
        </View>
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
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            const res = await fetch(`${API_URL}/api/coop/${challengeId}`, {
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
        } catch (err) {
            console.error("CoopNotifCard fetchState error:", err);
        } finally {
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
        
        // Translate /questions/[id]?challenge=... to /solve/[id]?challenge=...
        let targetHref = href;
        if (href.startsWith("/questions/")) {
            targetHref = href.replace("/questions/", "/solve/");
        }
        router.push(targetHref as any);
    };

    const handleAction = async (action: 'accept' | 'reject') => {
        if (!state || actionLoading) return;
        setActionLoading(action);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            const res = await fetch(`${API_URL}/api/coop/${challengeId}`, {
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
        } catch (err: any) {
            alert('Network error — please try again');
        } finally {
            setActionLoading(null);
        }
    };

    // Derived states
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
    const canSolve = !won && !lost && !rejected && !isExpired && !iHaveSubmitted && isPartner && challengeStatus !== 'pending';
    const showAcceptReject = isPartner && (challengeStatus === 'pending') && !localStatus;

    // ─────────────────────────────────────────────────────────────
    // COMPACT (Dropdown / Simplified view)
    // ─────────────────────────────────────────────────────────────
    if (compact) {
        return (
            <View className={`p-4 rounded-3xl border border-indigo-200 dark:border-indigo-800 ${!notif.read ? "bg-indigo-50/40 dark:bg-indigo-950/10" : "bg-white dark:bg-slate-900"}`}>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-slate-800 dark:text-white font-black text-xs uppercase tracking-wider">
                        {won ? "🏆 HELP SUCCESS!" : lost ? "HELP FAILED" : "⚔️ HELP REQUEST"}
                    </Text>
                    {!won && !lost && timeLeft !== "" && (
                        <View className="flex-row items-center gap-1">
                            <Clock size={10} color="#6366f1" />
                            <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">{timeLeft}</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color="#4f46e5" />
                ) : !state ? (
                    <Text className="text-slate-500 text-xs">{notif.body}</Text>
                ) : (
                    <View className="gap-2">
                        {/* Player info summary */}
                        <View className="flex-row items-center justify-between px-1">
                            <PlayerAvatar player={state.initiator} isYou={state.currentUserId === state.initiator.id} size="sm" />
                            <View className="items-center">
                                <Users size={16} className="text-slate-400 dark:text-slate-600 mb-0.5" />
                                <Text className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">+{splitPoints} pts</Text>
                            </View>
                            <PlayerAvatar player={state.partner} isYou={state.currentUserId === state.partner.id} size="sm" />
                        </View>

                        {/* CTA / Actions */}
                        {showAcceptReject && (
                            <View className="flex-row gap-2 mt-2">
                                <TouchableOpacity
                                    onPress={() => handleAction('reject')}
                                    disabled={!!actionLoading}
                                    className="flex-1 bg-red-50 dark:bg-red-950/30 border border-red-200 py-2 rounded-xl items-center justify-center"
                                >
                                    <Text className="text-red-600 font-extrabold text-xs">Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleAction('accept')}
                                    disabled={!!actionLoading}
                                    className="flex-1 bg-indigo-600 py-2 rounded-xl items-center justify-center"
                                >
                                    <Text className="text-white font-extrabold text-xs">Accept</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {canSolve && (
                            <TouchableOpacity
                                onPress={() => navigate(notif.href!)}
                                className="w-full bg-indigo-600 py-2.5 rounded-xl items-center justify-center mt-1"
                            >
                                <Text className="text-white font-black text-xs uppercase tracking-wide">Solve Now!</Text>
                            </TouchableOpacity>
                        )}

                        {(won || iWon) && (
                            <TouchableOpacity
                                onPress={() => router.push(`/coop/${challengeId}` as any)}
                                className="w-full bg-emerald-600 py-2 rounded-xl items-center justify-center mt-1"
                            >
                                <Text className="text-white font-bold text-xs">View Result 🏆</Text>
                            </TouchableOpacity>
                        )}

                        {isInitiator && !won && !lost && (
                            <TouchableOpacity
                                onPress={() => router.push(`/coop/${challengeId}` as any)}
                                className="w-full bg-indigo-50 dark:bg-indigo-900/30 py-2 rounded-xl items-center justify-center mt-1"
                            >
                                <Text className="text-indigo-700 dark:text-indigo-300 font-bold text-xs">View Status</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // FULL (Main notifications page version)
    // ─────────────────────────────────────────────────────────────
    return (
        <View className={`w-full bg-white dark:bg-slate-900 rounded-3xl border-2 overflow-hidden shadow-sm ${
            won ? "border-emerald-300 dark:border-emerald-800/40" 
            : lost ? "border-slate-200 dark:border-slate-800" 
            : !notif.read ? "border-indigo-300 dark:border-indigo-800" 
            : "border-indigo-200/60 dark:border-indigo-900/40"
        }`}>
            {/* Banner top */}
            <View className={`px-4 py-3 flex-row justify-between items-center ${
                won ? "bg-emerald-500" 
                : lost ? "bg-slate-600" 
                : "bg-indigo-600"
            }`}>
                <View className="flex-row items-center gap-2">
                    {won ? <Trophy size={14} color="white" /> : <Users size={14} color="white" />}
                    <Text className="text-white font-black text-xs uppercase tracking-wider">
                        {won ? "HELP SUCCESS!" : lost ? "HELP FAILED" : "HELP REQUEST — LIVE"}
                    </Text>
                </View>
                {!won && !lost && timeLeft !== "" && (
                    <View className="flex-row items-center gap-1">
                        <Clock size={12} color="white" />
                        <Text className="text-white/90 text-[11px] font-bold">{timeLeft}</Text>
                    </View>
                )}
            </View>

            <View className="p-4">
                {loading ? (
                    <View className="flex-row items-center gap-2 py-4">
                        <Loader2 size={16} className="text-indigo-500 animate-spin" />
                        <Text className="text-slate-400 text-xs">Fetching help status...</Text>
                    </View>
                ) : !state ? (
                    <View>
                        <Text className="font-bold text-slate-800 dark:text-slate-200 text-sm">{notif.title}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">{notif.body}</Text>
                        {notif.href && (
                            <TouchableOpacity onPress={() => navigate(notif.href!)} className="mt-2">
                                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">Go to question →</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View>
                        {/* Players layout */}
                        <View className="flex-row items-center justify-between mb-4">
                            <PlayerAvatar player={state.initiator} isYou={state.currentUserId === state.initiator.id} size="md" />
                            
                            <View className="items-center flex-1 px-2">
                                <Users size={18} className="text-slate-300 dark:text-slate-700 mb-1" />
                                <Text className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Reward</Text>
                                <View className="flex-row items-center gap-0.5">
                                    <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                                    <Text className="text-indigo-700 dark:text-indigo-400 font-black text-base">+{splitPoints}</Text>
                                    <Text className="text-[10px] text-slate-400 font-semibold ml-0.5">pts</Text>
                                </View>
                            </View>

                            <PlayerAvatar player={state.partner} isYou={state.currentUserId === state.partner.id} size="md" />
                        </View>

                        {/* Custom message if provided */}
                        {state.message && (
                            <View className="mb-3 p-3 bg-indigo-50/50 dark:bg-slate-800/40 rounded-2xl border-l-4 border-l-indigo-400 border border-slate-100 dark:border-slate-800">
                                <Text className="italic text-xs text-slate-600 dark:text-slate-300">&ldquo;{state.message}&rdquo;</Text>
                            </View>
                        )}

                        {/* Live status label */}
                        <View className={`flex-row items-center gap-2 p-3 rounded-2xl border mb-3 ${
                            won ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                            : lost ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
                            : iHaveSubmitted ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                            : isExpired ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                            : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30"
                        }`}>
                            {won ? <Trophy size={14} color="#10b981" /> :
                             lost ? <XCircle size={14} color="#f43f5e" /> :
                             iHaveSubmitted ? <Clock size={14} color="#f59e0b" /> :
                             isExpired ? <Clock size={14} color="#94a3b8" /> :
                             isInitiator ? <ActivityIndicator size="small" color="#4f46e5" /> :
                             <Users size={14} color="#4f46e5" />}
                            <Text className="text-[11px] font-semibold flex-1 leading-normal">
                                {won ? `Help Success! Both players earned +${splitPoints} points.`
                                    : lost ? "The help request wasn't completed in time."
                                    : iHaveSubmitted ? "Your answer is being verified by the community."
                                    : isExpired ? "This help request has expired."
                                    : isInitiator ? "Waiting for your partner to help with the question..."
                                    : `You've been asked for help! Solve to earn +${splitPoints} pts together.`}
                            </Text>
                        </View>

                        {/* CTA / Action row */}
                        <View className="gap-2">
                            {showAcceptReject && (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => handleAction('reject')}
                                        disabled={!!actionLoading}
                                        className="flex-1 bg-red-100 dark:bg-red-900/30 py-3 rounded-2xl items-center justify-center"
                                    >
                                        <Text className="text-red-700 dark:text-red-400 font-bold text-xs">Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleAction('accept')}
                                        disabled={!!actionLoading}
                                        className="flex-1 bg-indigo-600 py-3 rounded-2xl items-center justify-center shadow shadow-indigo-600/10"
                                    >
                                        <Text className="text-white font-bold text-xs">Accept & Solve!</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {rejected && (
                                <View className="bg-slate-100 dark:bg-slate-800 py-3 rounded-2xl items-center justify-center">
                                    <Text className="text-slate-500 dark:text-slate-400 font-semibold text-xs">Declined Request</Text>
                                </View>
                            )}

                            {canSolve && (
                                <TouchableOpacity
                                    onPress={() => navigate(notif.href!)}
                                    className="w-full bg-indigo-600 py-3 rounded-2xl items-center justify-center flex-row gap-1"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-wide">Help Now!</Text>
                                    <ArrowRight size={12} color="white" />
                                </TouchableOpacity>
                            )}

                            {isInitiator && !won && !lost && (
                                <TouchableOpacity
                                    onPress={() => navigate(notif.href!)}
                                    className="w-full bg-indigo-600 py-3 rounded-2xl items-center justify-center flex-row gap-1"
                                >
                                    <Text className="text-white font-black text-xs uppercase tracking-wide">Watch Live</Text>
                                    <ArrowRight size={12} color="white" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={() => router.push(`/coop/${challengeId}` as any)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2.5 rounded-2xl items-center justify-center mt-1"
                            >
                                <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs">View Full Status Details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
