import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from '@/lib/next-navigation';
import {
    Users, CheckCircle2, XCircle, Clock, Loader2,
    Zap, ArrowRight, RefreshCw, Shield, Trophy
} from 'lucide-react-native';
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
    const expiresAt = new Date(challengeMeta.challenge.expiresAt).getTime();
    const isExpired = Date.now() > expiresAt;
    
    const info = won 
        ? { label: "Win ✓", color: "text-emerald-700 bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4" /> }
        : isExpired && !sub
            ? { label: "Expired ✗", color: "text-red-700 bg-red-100", icon: <XCircle className="w-4 h-4" /> }
            : statusLabel(sub?.status);

    return (
        <View className={`relative bg-white rounded-[2rem] p-6 border-2 shadow-sm flex flex-col gap-4 transition-all ${won ? "border-emerald-300" : lost ? "border-red-200" : player.isCurrentUser ? "border-indigo-300" : "border-slate-200"
            }`}>
            {player.isCurrentUser && (
                <Text className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">You</Text>
            )}
            {won && (
                <Text className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 flex-row">
                    <Trophy className="w-3 h-3" /> Won!
                </Text>
            )}

            {/* Player info */}
            <View className="flex items-center gap-3 flex-row">
                {player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                ) : (
                    <View className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center border-2 border-white shadow flex-row">
                        {player.name[0]?.toUpperCase()}
                    </View>
                )}
                <View>
                    <Text className="font-black text-slate-800">{player.name}</Text>
                    <Text className="text-xs text-slate-500">@{player.username}</Text>
                </View>
            </View>

            {/* Status */}
            <View className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${info.color}`}>
                {info.icon}
                {info.label}
            </View>

            {/* Submitted answer thumbnail */}
            {sub?.submission_url && (
                <View className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                        src={sub.submission_url}
                        alt="Submission"
                        className="w-full max-h-48 object-contain"
                    />
                </View>
            )}

            {/* Points */}
            {won && (
                <View className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex-row">
                    <Text className="text-sm font-semibold text-emerald-700">Points Earned</Text>
                    <Text className="text-xl font-black text-emerald-700">+{splitPoints}</Text>
                </View>
            )}
        </View>
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
            <View className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <Text className="font-medium animate-pulse">Loading help status...</Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View className="text-center py-20 text-slate-500">
                <Text className="text-xl font-bold">Help request not found</Text>
                <View onPress={() => router.push("/")} className="mt-4 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl">
                    Back to Dashboard
                </View>
            </View>
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
    const hoursLeft = Math.floor(timeLeft / 60);
    const displayTime = timeLeft > 60 ? `${hoursLeft}h ${timeLeft % 60}m` : `${timeLeft}m`;

    const handleWithdraw = async () => {
        if (!confirm("Are you sure you want to withdraw? You will lose the standard 20% point penalty for this question, but you will avoid the AI Spam penalty. The challenge will permanently fail.")) return;
        
        try {
            const res = await fetch(`/api/coop/${challengeId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ action: "withdraw" })
            });
            const result = await res.json();
            if (!res.ok) {
                alert(result.error || "Failed to withdraw");
                return;
            }
            alert(`Withdrawn successfully. ${result.message || ''}`);
            if (token) fetchStatus(token);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    return (
        <View className="max-w-2xl mx-auto space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4">

            {/* Header banner */}
            <View className={`rounded-[2rem] p-6 text-white text-center shadow-lg relative overflow-hidden ${challengeWon
                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600"
                }`}>
                <View className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
                <View className="flex items-center justify-center gap-2 mb-2 flex-row">
                    {challengeWon ? <Trophy className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                    <Text className="text-2xl font-black">
                        {challengeWon ? "Help Success! 🎉" : "Help Request"}
                    </Text>
                </View>
                <Text className="text-white/80 text-sm">
                    {challengeWon
                        ? `Both players earned +${splitPoints} points each!`
                        : `Each player earns +${splitPoints} pts if their answer is verified correct`
                    }
                </Text>
                {data.question && (
                    <View className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold flex-row">
                        <Zap className="w-4 h-4" />
                        {data.question.points} pts — {data.question.subject || "Question"}
                    </View>
                )}
            </View>

            {/* Question title */}
            {data.question && (
                <View className="bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">The Question</Text>
                    <Text className="font-bold text-slate-800">{data.question.title}</Text>
                </View>
            )}

            {/* Progress indicator */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-6 py-4">
                <View className="flex items-center justify-between mb-3 flex-row">
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Request Progress</Text>
                    <View
                        onPress={() => token && fetchStatus(token)}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex-row"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </View>
                </View>
                <View className="flex items-center gap-3 text-sm text-slate-500 flex-row">
                    <View className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs ${initiatorWon ? "bg-emerald-100 text-emerald-700" : data.initiator.submission ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        <View className={`w-2 h-2 rounded-full ${initiatorWon ? "bg-emerald-500" : data.initiator.submission ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                        {data.initiator.name.split(" ")[0]}: {initiatorWon ? "Win ✓" : data.initiator.submission ? "Submitted" : "Not yet"}
                    </View>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <View className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs ${partnerWon ? "bg-emerald-100 text-emerald-700" : data.partner.submission ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        <View className={`w-2 h-2 rounded-full ${partnerWon ? "bg-emerald-500" : data.partner.submission ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                        {data.partner.name.split(" ")[0]}: {partnerWon ? "Win ✓" : data.partner.submission ? "Submitted" : "Not yet"}
                    </View>
                </View>
                <View className="mt-3 text-xs flex items-center gap-1.5 overflow-hidden flex-row">
                    {challengeWon ? (
                        <View className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold flex-row">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Help Successfully Completed
                        </View>
                    ) : (
                        <>
                            <Clock className={`w-3.5 h-3.5 ${timeLeft > 0 && timeLeft < 15 ? "animate-pulse text-amber-500" : timeLeft <= 0 ? "text-red-500" : "text-slate-400"}`} />
                            {timeLeft > 0 ? (
                                <Text className="text-slate-500 font-medium">
                                    {displayTime} left to solve
                                </Text>
                            ) : (
                                <Text className="text-red-600 font-black uppercase tracking-tighter">
                                    Challenge Expired ✗
                                </Text>
                            )}
                        </>
                    )}
                    <View className="ml-auto flex items-center gap-1 text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm flex-row">
                        <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Live
                    </View>
                </View>
            </View>

            {/* Player cards */}
            <View className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PlayerCard player={data.initiator} splitPoints={splitPoints} challengeMeta={data} />
                <PlayerCard player={data.partner} splitPoints={splitPoints} challengeMeta={data} />
            </View>

            {/* CTA — solve your part */}
            {!bothSubmitted && data.challenge.status !== "won" && data.challenge.status !== "lost" && (
                <View className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-row">
                    <View>
                        <Text className="font-bold text-indigo-800 text-sm">
                            {data.currentUserId === data.initiator.id
                                ? "Waiting for your partner to submit!"
                                : data.currentUserId === data.partner.id && !data.partner.submission
                                    ? "Your partner is waiting — solve your part!"
                                    : "Waiting for the checker to review"}
                        </Text>
                        <Text className="text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">
                            {data.currentUserId === data.initiator.id
                                ? "They must solve it correctly to save your points."
                                : data.currentUserId === data.partner.id && !data.partner.submission
                                    ? "Head to the arena and provide help."
                                    : "Hold tight! The submission is under review."}
                        </Text>
                    </View>
                    {data.currentUserId === data.partner.id && !data.partner.submission && (
                        <View className="flex items-center gap-3 shrink-0 flex-row">
                            <View
                                onPress={handleWithdraw}
                                className="text-slate-500 hover:text-red-500 font-semibold px-4 py-2.5 rounded-xl transition text-sm underline decoration-slate-300 hover:decoration-red-300 underline-offset-4"
                            >
                                Withdraw (-{Math.floor((data.question?.points || 0) / 5)} pts)
                            </View>
                            <View
                                onPress={() => router.push(`/questions/${data.challenge.questionId}?challenge=${challengeId}`)}
                                className="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition text-sm shadow-sm"
                            >
                                Solve Now →
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Back */}
            <View
                onPress={() => router.push("/")}
                className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-lg"
            >
                Back to Dashboard
            </View>
        </View>
    );
}
