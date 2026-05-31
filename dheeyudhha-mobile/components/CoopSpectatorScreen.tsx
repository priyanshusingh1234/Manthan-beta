import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from '@/lib/next-navigation';
import {
    Users, CheckCircle2, XCircle, Clock, Loader2,
    Zap, Trophy, Swords, ArrowRight, RefreshCw
} from 'lucide-react-native';
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
            <View className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <Text className="font-medium animate-pulse">Loading help status...</Text>
            </View>
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
            return <Image src={otherPlayer.avatar} alt={otherPlayer.name} className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg" />;
        }
        return (
            <View className="w-16 h-16 rounded-full bg-white/25 text-white font-black text-2xl flex items-center justify-center border-2 border-white/40 shadow-lg flex-row">
                {otherPlayer.name[0]?.toUpperCase()}
            </View>
        );
    }

    return (
        <View className="max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-5 pb-16">

            {/* ── Hero Banner ────────────────────────────────────── */}
            <View className={`relative overflow-hidden rounded-[2rem] p-6 text-white shadow-xl transition-all duration-700 ${challengeWon
                ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
                : partnerWrong
                    ? "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
                    : "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700"
                }`}>
                <View className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_60%)]" />

                {/* Floating particles */}
                <View className="absolute top-5 right-14 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <View className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />

                <View className="relative z-10">
                    {/* Top row */}
                    <View className="flex items-center justify-between mb-5 flex-row">
                        <View className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black border border-white/20 flex-row">
                            <Text className="relative flex h-2 w-2 flex-row">
                                {!challengeWon && !partnerWrong && (
                                    <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 flex-row" />
                                )}
                                <Text className={`relative inline-flex rounded-full h-2 w-2 ${challengeWon ? "bg-emerald-300" : partnerWrong ? "bg-slate-400" : "bg-red-500"}`} />
                            </Text>
                            {challengeWon ? "HELP SUCCESS" : partnerWrong ? "HELP FAILED" : "HELP REQUEST LIVE"}
                        </View>
                        <View className="flex items-center gap-1.5 text-white/70 text-xs font-semibold flex-row">
                            <Clock className="w-3.5 h-3.5" />
                            {timeLeft || "..."}
                        </View>
                    </View>

                    {/* Partner avatar */}
                    <View className="flex flex-col items-center text-center gap-3">
                        <View className="relative">
                            <OtherPlayerAvatar />
                            {/* Live pulse ring — only when waiting */}
                            {!partnerSubmitted && !challengeWon && !partnerWrong && isInitiator && (
                                <Text className="absolute -top-1 -right-1 flex h-5 w-5 flex-row">
                                    <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 flex-row" />
                                    <Text className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white items-center justify-center flex-row">
                                        <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                                    </Text>
                                </Text>
                            )}
                            {(challengeWon || partnerCorrect) && (
                                <Text className="absolute -top-1 -right-1 flex h-5 w-5 flex-row">
                                    <Text className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center flex-row">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </Text>
                                </Text>
                            )}
                            {partnerWrong && (
                                <Text className="absolute -top-1 -right-1 flex h-5 w-5 flex-row">
                                    <Text className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white items-center justify-center flex-row">
                                        <XCircle className="w-3 h-3 text-white" />
                                    </Text>
                                </Text>
                            )}
                        </View>

                        <View>
                            <Text className="text-white font-black text-lg leading-tight">{otherPlayer.name}</Text>
                            <Text className="text-white/60 text-xs">@{otherPlayer.username}</Text>
                        </View>

                        {/* Status headline */}
                        <View className="mt-1">
                            {challengeWon || partnerCorrect ? (
                                <View className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full flex-row">
                                    <Trophy className="w-4 h-4 text-yellow-300" />
                                    <Text className="font-black text-sm">Solved it! You both earn +{splitPoints} pts</Text>
                                </View>
                            ) : partnerWrong ? (
                                <Text className="text-white/80 text-sm font-semibold">Partner couldn&apos;t solve it either.</Text>
                            ) : partnerSubmitted ? (
                                <View className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full flex-row">
                                    <Clock className="w-4 h-4 text-amber-300" />
                                    <Text className="font-bold text-sm">Submitted — awaiting verification</Text>
                                </View>
                            ) : (
                                <Text className="text-white/70 text-sm">{isInitiator ? "Solving right now... give them a moment!" : "You are currently solving this!"}</Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* ── You vs Partner card ─────────────────────────── */}
            <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Help Request Breakdown</Text>

                <View className="flex items-center gap-3 flex-row">
                    {/* Initiator */}
                    <View className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800 flex-row">
                        <Text className="text-xs font-bold text-slate-500 mb-1">{isInitiator ? "You (Initiator)" : "Initiator"}</Text>
                        <View className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold flex-row">
                            <XCircle className="w-3 h-3" /> Got it wrong
                        </View>
                    </View>

                    <Swords className="w-5 h-5 text-slate-300 shrink-0" />

                    {/* Partner */}
                    <View className={`flex-1 rounded-2xl p-3 text-center border transition-all ${challengeWon || partnerCorrect
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                        : partnerWrong
                             ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                             : partnerSubmitted
                                 ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                                 : "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                        }`}>
                        <Text className="text-xs font-bold text-slate-500 mb-1">{!isInitiator ? "You (Partner)" : "Partner"}</Text>
                        {challengeWon || partnerCorrect ? (
                            <View className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex-row">
                                <CheckCircle2 className="w-3 h-3" /> Correct ✓
                            </View>
                        ) : partnerWrong ? (
                            <View className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[11px] font-bold flex-row">
                                <XCircle className="w-3 h-3" /> Wrong ✗
                            </View>
                        ) : partnerSubmitted ? (
                            <View className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex-row">
                                <Clock className="w-3 h-3" /> In Review
                            </View>
                        ) : (
                            <View className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-200 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold flex-row">
                                <Loader2 className="w-3 h-3 animate-spin" /> Solving...
                            </View>
                        )}
                    </View>
                </View>

                {/* If won — points summary */}
                {(challengeWon || partnerCorrect) && (
                    <View className="mt-4 flex flex-col gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 shadow-sm">
                        <View className="flex items-center justify-between flex-row">
                            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 flex-row">
                                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                                Total Reward (50/50 Split)
                            </Text>
                            <Text className="text-2xl font-black text-emerald-700 dark:text-emerald-400">+{splitPoints * 2 + (questionPoints % 2 !== 0 ? -1 : 0)} pts</Text>
                        </View>
                        <View className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-500 font-medium px-1 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2 flex-row">
                            <Text>Initiator: <Text className="font-bold">+{splitPoints}</Text></Text>
                            <Text>Partner: <Text className="font-bold">+{splitPoints}</Text></Text>
                        </View>
                    </View>
                )}

                {/* Auto-refresh notice */}
                <View className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 justify-center flex-row">
                    <RefreshCw className="w-3 h-3" />
                    <Text>Auto-refreshes every 5 seconds</Text>
                </View>
            </View>

            {/* ── Actions ─────────────────────────────────────── */}
            <View className="flex flex-col gap-3">
                <View
                    onPress={() => router.push(`/coop/${challengeId}`)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-indigo-600/20 flex-row"
                >
                    <Users className="w-5 h-5" />
                    View Full Status
                    <ArrowRight className="w-4 h-4" />
                </View>
                <View
                    onPress={() => router.push("/")}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                    Back to Dashboard
                </View>
            </View>
        </View>
    );
}
