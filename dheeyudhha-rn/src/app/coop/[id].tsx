import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import {
    Users, CheckCircle2, XCircle, Clock, Loader2,
    Zap, ArrowRight, RefreshCw, Shield, Trophy, ChevronLeft
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        case "pending": return { label: "Uploaded — Pending Mark", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", icon: <Clock size={14} color="#64748b" /> };
        case "pending_check": return { label: "In Checker Queue", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", icon: <Shield size={14} color="#d97706" /> };
        case "points_given": return { label: "Points Awarded ✓", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={14} color="#10b981" /> };
        case "auto_approved": return { label: "Verified Correct ✓", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={14} color="#10b981" /> };
        case "ai_confirmed_correct": return { label: "AI Verified Correct ✓", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={14} color="#10b981" /> };
        case "ai_confirmed_wrong": return { label: "Confirmed Wrong ✗", bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", icon: <XCircle size={14} color="#ef4444" /> };
        case "flagged_for_ai": return { label: "AI is checking...", bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", icon: <ActivityIndicator size="small" color="#f97316" /> };
        default: return { label: "Not submitted yet", bg: "bg-slate-50 dark:bg-slate-900/50", text: "text-slate-500 dark:text-slate-400", icon: <Clock size={14} color="#94a3b8" /> };
    }
}

function PlayerCard({ player, splitPoints, challengeMeta }: { player: PlayerState; splitPoints: number; challengeMeta: CoopData }) {
    const initiator = challengeMeta.initiator;
    const sub = player.submission;
    const challengeWon = challengeMeta.challenge.status === "won";
    
    const won = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(sub?.status || "");
    const lost = !won && challengeMeta.challenge.status === "lost";
    const expiresAt = new Date(challengeMeta.challenge.expiresAt).getTime();
    const isExpired = Date.now() > expiresAt;
    
    const info = won 
        ? { label: "Win ✓", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={14} color="#10b981" /> }
        : isExpired && !sub
            ? { label: "Expired ✗", bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", icon: <XCircle size={14} color="#ef4444" /> }
            : statusLabel(sub?.status);

    return (
        <View className={`relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 border-2 shadow-sm gap-3 mt-4 ${
            won ? "border-emerald-300 dark:border-emerald-800" 
            : lost ? "border-red-200 dark:border-red-950" 
            : player.isCurrentUser ? "border-indigo-300 dark:border-indigo-800" 
            : "border-slate-100 dark:border-slate-800"
        }`}>
            {player.isCurrentUser && (
                <View className="absolute -top-3 left-6 bg-indigo-600 px-3 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-black uppercase">You</Text>
                </View>
            )}
            {won && (
                <View className="absolute -top-3 right-6 bg-emerald-500 px-3 py-0.5 rounded-full flex-row items-center gap-1">
                    <Trophy size={10} color="white" />
                    <Text className="text-white text-[10px] font-black uppercase">Won!</Text>
                </View>
            )}

            {/* Player info */}
            <View className="flex-row items-center gap-3">
                {player.avatar ? (
                    <Image source={{ uri: player.avatar }} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                ) : (
                    <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-lg items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                        <Text className="text-indigo-700 dark:text-indigo-300 font-black text-lg">
                            {player.name[0]?.toUpperCase() || 'P'}
                        </Text>
                    </View>
                )}
                <View className="flex-1 min-w-0">
                    <Text className="font-extrabold text-slate-800 dark:text-slate-100 text-sm" numberOfLines={1}>{player.name}</Text>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400">@{player.username}</Text>
                </View>
            </View>

            {/* Status pill */}
            <View className={`flex-row items-center gap-2 px-3 py-2.5 rounded-xl border border-transparent ${info.bg}`}>
                {info.icon}
                <Text className={`text-xs font-bold ${info.text}`}>{info.label}</Text>
            </View>

            {/* Submission preview if image is attached */}
            {sub?.submission_url && (
                <View className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1">
                    <Image
                        source={{ uri: sub.submission_url }}
                        className="w-full h-32"
                        resizeMode="contain"
                    />
                </View>
            )}

            {/* Points earned */}
            {won && (
                <View className="flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-4 py-2 mt-1">
                    <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Points Earned</Text>
                    <Text className="text-base font-black text-emerald-700 dark:text-emerald-400">+{splitPoints}</Text>
                </View>
            )}
        </View>
    );
}

export default function CoopStatusScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [data, setData] = useState<CoopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [timeLeftStr, setTimeLeftStr] = useState("");

    const fetchStatus = useCallback(async (tok: string, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            const res = await fetch(`${API_URL}/api/coop/${id}`, {
                headers: { Authorization: `Bearer ${tok}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error("CoopStatusScreen fetchStatus error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        let active = true;
        (async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) { router.replace("/login"); return; }
            const { data: { session } } = await supabase.auth.getSession();
            const tok = session?.access_token ?? "";
            if (active) {
                setToken(tok);
                fetchStatus(tok);
            }
        })();
        return () => { active = false; };
    }, [fetchStatus, router]);

    // Live countdown timer and auto refresh
    useEffect(() => {
        if (!data?.challenge?.expiresAt) return;
        const updateTimer = () => {
            const expiresAt = new Date(data.challenge.expiresAt).getTime();
            const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            if (diff === 0) {
                setTimeLeftStr("Expired");
                return;
            }
            const mins = Math.floor(diff / 60);
            const hours = Math.floor(mins / 60);
            if (hours > 0) setTimeLeftStr(`${hours}h ${mins % 60}m`);
            else setTimeLeftStr(`${mins}m`);
        };

        updateTimer();
        const iv = setInterval(updateTimer, 10000);
        return () => clearInterval(iv);
    }, [data?.challenge?.expiresAt]);

    // Auto-refresh data every 10 seconds
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            fetchStatus(token, true);
        }, 10000);
        return () => clearInterval(interval);
    }, [token, fetchStatus]);

    const onRefresh = () => {
        if (token) {
            setRefreshing(true);
            fetchStatus(token);
        }
    };

    const handleWithdraw = async () => {
        if (!data || !token) return;
        
        Alert.alert(
            "Withdraw Request",
            "Are you sure you want to withdraw? You will lose the standard 20% point penalty for this question, but you will avoid the AI Spam penalty. The challenge will permanently fail.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Withdraw",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
                            const res = await fetch(`${API_URL}/api/coop/${id}`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify({ action: "withdraw" })
                            });
                            const result = await res.json();
                            if (!res.ok) {
                                Alert.alert("Error", result.error || "Failed to withdraw");
                                return;
                            }
                            Alert.alert("Success", `Withdrawn successfully. ${result.message || ''}`);
                            fetchStatus(token);
                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
                <Loader2 size={32} color="#6366f1" className="animate-spin" />
                <Text className="text-slate-400 text-xs font-bold uppercase mt-4 tracking-widest">Loading help status...</Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6" style={{ paddingTop: insets.top }}>
                <Text className="font-bold text-slate-800 dark:text-slate-200 text-base mb-4">Help request not found</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)" as any)}
                    className="bg-slate-900 dark:bg-slate-100 px-6 py-3 rounded-xl shadow-sm"
                >
                    <Text className="text-white dark:text-slate-950 font-bold text-sm">Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const splitPoints = Math.ceil((data.question?.points || 0) / 2);
    const challengeWon = data.challenge.status === "won";
    const initiatorWon = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(data.initiator.submission?.status || "");
    const partnerWon = challengeWon || ["auto_approved", "ai_confirmed_correct", "points_given"].includes(data.partner.submission?.status || "");
    const bothSubmitted = challengeWon || (!!data.initiator.submission && !!data.partner.submission);

    // Determine the current user's player state and whether they've already submitted
    const isInitiator = data.currentUserId === data.initiator.id;
    const isPartner = data.currentUserId === data.partner.id;
    const currentPlayerSubmission = isInitiator ? data.initiator.submission : isPartner ? data.partner.submission : null;
    const currentUserAlreadySubmitted = !!currentPlayerSubmission;

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header bar */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                    <ChevronLeft size={20} color={isDark ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
                <View className="items-center flex-1">
                    <Text className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Co-op Room
                    </Text>
                    <Text className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        Dynamic Status
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => token && fetchStatus(token)}
                    className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                    <RefreshCw size={16} color={isDark ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
            >
                {/* Header Banner */}
                <View className={`rounded-[2rem] p-6 shadow-sm relative overflow-hidden items-center ${
                    challengeWon ? "bg-emerald-500" : "bg-indigo-600"
                }`}>
                    <View className="flex-row items-center gap-2 mb-2">
                        {challengeWon ? <Trophy size={24} color="white" /> : <Users size={24} color="white" />}
                        <Text className="text-white font-black text-xl">
                            {challengeWon ? "Help Success! 🎉" : "Help Request"}
                        </Text>
                    </View>
                    <Text className="text-white/80 text-xs text-center leading-normal max-w-[85%]">
                        {challengeWon
                            ? `Both players earned +${splitPoints} points each!`
                            : `Each player earns +${splitPoints} pts if their answer is verified correct`
                        }
                    </Text>
                    {data.question && (
                        <View className="mt-4 bg-white/20 rounded-xl px-4 py-2 flex-row items-center gap-1.5">
                            <Zap size={14} color="white" fill="white" />
                            <Text className="text-white text-xs font-black uppercase">
                                +{splitPoints} PTS EACH — {data.question.subject || "Question"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Question title */}
                {data.question && (
                    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mt-4">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                            The Question
                        </Text>
                        <Text className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            {data.question.title}
                        </Text>
                    </View>
                )}

                {/* Progress Indicators */}
                <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mt-4">
                    <Text className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mb-3 uppercase tracking-wider">
                        Request Progress
                    </Text>
                    
                    <View className="flex-row items-center gap-2">
                        <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
                            initiatorWon ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700" 
                            : data.initiator.submission ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                            <View className={`w-2 h-2 rounded-full ${
                                initiatorWon ? "bg-emerald-500" 
                                : data.initiator.submission ? "bg-amber-400" 
                                : "bg-slate-300 dark:bg-slate-600"
                            }`} />
                            <Text className={`text-[10px] font-black uppercase ${
                                initiatorWon ? "text-emerald-700 dark:text-emerald-400" 
                                : data.initiator.submission ? "text-amber-700 dark:text-amber-400" 
                                : "text-slate-500 dark:text-slate-400"
                            }`}>
                                {data.initiator.name.split(" ")[0]}: {initiatorWon ? "Win" : data.initiator.submission ? "Submitted" : "Not yet"}
                            </Text>
                        </View>
                        
                        <ArrowRight size={14} color={isDark ? '#475569' : '#cbd5e1'} />

                        <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
                            partnerWon ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700" 
                            : data.partner.submission ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                            <View className={`w-2 h-2 rounded-full ${
                                partnerWon ? "bg-emerald-500" 
                                : data.partner.submission ? "bg-amber-400" 
                                : "bg-slate-300 dark:bg-slate-600"
                            }`} />
                            <Text className={`text-[10px] font-black uppercase ${
                                partnerWon ? "text-emerald-700 dark:text-emerald-400" 
                                : data.partner.submission ? "text-amber-700 dark:text-amber-400" 
                                : "text-slate-500 dark:text-slate-400"
                            }`}>
                                {data.partner.name.split(" ")[0]}: {partnerWon ? "Win" : data.partner.submission ? "Submitted" : "Not yet"}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
                        {challengeWon ? (
                            <View className="flex-row items-center gap-1.5">
                                <CheckCircle2 size={14} color="#10b981" />
                                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase">
                                    Challenge Completed
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-1.5">
                                <Clock size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                                    {timeLeftStr !== "" ? `${timeLeftStr} left to solve` : "Challenge Expired"}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <Text className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                Live
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Player Status Cards */}
                <View className="flex-col gap-2 mt-2">
                    <PlayerCard player={data.initiator} splitPoints={splitPoints} challengeMeta={data} />
                    <PlayerCard player={data.partner} splitPoints={splitPoints} challengeMeta={data} />
                </View>

                {/* CTAs: only show if challenge is still open AND current user hasn't submitted yet */}
                {!bothSubmitted && !currentUserAlreadySubmitted && data.challenge.status !== "won" && data.challenge.status !== "lost" && (
                    <View className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-5 mt-6 gap-3">
                        <View>
                            <Text className="font-extrabold text-indigo-800 dark:text-indigo-400 text-sm">
                                {isInitiator
                                    ? "Waiting for your partner to submit!"
                                    : isPartner && !data.partner.submission
                                        ? "Your partner is waiting — solve your part!"
                                        : "Waiting for the checker to review"}
                            </Text>
                            <Text className="text-indigo-600 dark:text-indigo-500 text-xs mt-0.5">
                                {isInitiator
                                    ? "They must solve it correctly to save your points."
                                    : isPartner && !data.partner.submission
                                        ? "Head to the solve arena and provide help."
                                        : "Hold tight! The submission is under review."}
                            </Text>
                        </View>
                        {isPartner && !data.partner.submission && (
                            <View className="flex-row items-center gap-2 justify-end mt-2">
                                <TouchableOpacity
                                    onPress={handleWithdraw}
                                    className="px-4 py-2.5 rounded-xl"
                                >
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold underline">
                                        Withdraw (-{Math.floor((data.question?.points || 0) / 5)} pts)
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push(`/solve/${data.challenge.questionId}?challenge=${id}` as any)}
                                    className="bg-indigo-600 px-5 py-2.5 rounded-xl shadow-sm"
                                >
                                    <Text className="text-white font-bold text-xs">Solve Now →</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Show waiting state if current user submitted but challenge not resolved yet */}
                {currentUserAlreadySubmitted && !challengeWon && data.challenge.status !== "lost" && (
                    <View className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-5 mt-6 gap-2">
                        <View className="flex-row items-center gap-2">
                            <ActivityIndicator size="small" color="#d97706" />
                            <Text className="font-extrabold text-amber-800 dark:text-amber-400 text-sm">Submission Under Review</Text>
                        </View>
                        <Text className="text-amber-600 dark:text-amber-500 text-xs">Your answer has been submitted. Hold tight while it's being verified!</Text>
                    </View>
                )}

                {/* Back to dashboard button */}
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)" as any)}
                    className="w-full bg-slate-900 dark:bg-slate-100 py-4 rounded-2xl mt-6 shadow-sm active:scale-95 items-center"
                >
                    <Text className="text-white dark:text-slate-950 font-black text-sm uppercase tracking-wide">
                        Back to Dashboard
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
