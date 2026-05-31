import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from '@/lib/next-navigation';
import { supabase } from "@/lib/supabaseClient";
import { Platform } from 'react-native';
import {
    Shield, Target, AlertCircle, Search, Zap, Swords, Crown,
    AlertTriangle, Clock, Star, CheckCircle2, XCircle, User, Flame
} from 'lucide-react-native';
async function nativeHaptic(kind: "light" | "medium" = "light") {
    if (!(Platform.OS !== 'web')) return;
    try {
        
        // await removed
    } catch {
        // ignore haptics failures
    }
}

/* ── Live countdown ─────────────────────────────── */
function useWarTimer(endsAt: string | null) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!endsAt) return;
        const tick = () => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("00:00"); setIsUrgent(true); return; }
            const totalSecs = Math.floor(diff / 1000);
            setIsUrgent(totalSecs < 120);
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endsAt]);

    return { timeLeft, isUrgent };
}

/* ── Avatar ─────────────────────────────────────── */
function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
    const sz = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    if (avatar) return <Image src={avatar} alt={name} className={`${sz} rounded-full object-cover border-2 border-white/20 shadow-md`} />;
    return (
        <View className={`${sz} rounded-full flex items-center justify-center font-black shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-white/20`}>
            {name?.[0]?.toUpperCase() || "?"}
        </View>
    );
}

/* ── Question Card ──────────────────────────────── */
function QuestionCard({ q, isMine, sub, warStatus, warId, router }: any) {
    const correct = sub?.find((s: any) => s.question_id === q.id && s.status === "correct");
    const attempts = sub?.filter((s: any) => s.question_id === q.id).length || 0;
    const secured = !!correct;

    return (
        <View
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300
                ${secured
                    ? "border-green-400/50 bg-green-50/80 dark:bg-green-900/20"
                    : isMine
                        ? "border-indigo-300/60 dark:border-indigo-500/40 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60"
                }`}
        >
            {secured && (
                <View className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                </View>
            )}

            {/* Difficulty stripe */}
            <View className={`h-1 w-full ${q.difficulty === "hard" ? "bg-red-500" : q.difficulty === "medium" || q.difficulty === "moderate" ? "bg-amber-400" : "bg-green-400"}`} />

            <View className="p-4">
                <View className="flex items-start justify-between gap-2 mb-3 flex-row">
                    <Text className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {q.subject || "General"}
                    </Text>
                    <Text className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0 flex-row">
                        <Zap className="w-3 h-3" />{q.points || 0}
                    </Text>
                </View>

                <Text className={`text-sm font-bold leading-snug mb-4 line-clamp-2 ${secured ? "line-through text-green-700 dark:text-green-400 opacity-70" : "text-slate-800 dark:text-white"}`}>
                    {q.title}
                </Text>

                {secured ? (
                    <View className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1 flex-row">
                        <Shield className="w-3.5 h-3.5" /> Secured! +{correct.points_awarded || q.points} pts
                    </View>
                ) : isMine && warStatus === "active" ? (
                    <View className="flex items-center justify-between flex-row">
                        <Text className="text-xs text-slate-400 font-medium">{attempts} attempt{attempts !== 1 ? "s" : ""}</Text>
                        <View
                            onPress={() => {
                                nativeHaptic("light");
                                router.push(`/war-battle/${warId}/solve/${q.id}`);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/30 flex items-center gap-1.5 flex-row"
                        >
                            <Target className="w-3.5 h-3.5" /> Attack
                        </View>
                    </View>
                ) : (
                    <View className="flex items-center gap-1.5 text-xs text-slate-400 font-medium flex-row">
                        {isMine ? (
                            warStatus !== "active" ? <><Shield className="w-3 h-3" /> Locked</> : null
                        ) : (
                            <><Target className="w-3 h-3 text-red-400" /> Enemy target</>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

/* ── Member Row ─────────────────────────────────── */
function MemberRow({ member, submissions, schoolId }: { member: any; submissions: any[]; schoolId: string }) {
    const correct = submissions.filter(s => s.student_id === member.id && s.school_id === schoolId && s.status === "correct").length;
    const total = submissions.filter(s => s.student_id === member.id && s.school_id === schoolId).length;
    return (
        <View className="flex items-center gap-2 py-1.5 flex-row">
            <Avatar name={member.name} avatar={member.avatar} size="sm" />
            <View className="flex-1 min-w-0 flex-row">
                <View className="text-xs font-bold text-slate-800 dark:text-white truncate">{member.name}</View>
                <View className="text-xs text-slate-400">{member.points.toLocaleString()} pts</View>
            </View>
            {total > 0 && (
                <View className="flex items-center gap-1 text-xs font-black flex-row">
                    <Text className="text-green-500">{correct}✓</Text>
                    {total - correct > 0 && <Text className="text-red-400">{total - correct}✗</Text>}
                </View>
            )}
        </View>
    );
}

/* ── Main Page ──────────────────────────────────── */
export default function WarBattleDashboard() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;

    const [war, setWar] = useState<any>(null);
    const [myQuestions, setMyQuestions] = useState<any[]>([]);
    const [opponentQuestions, setOpponentQuestions] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [mySchoolId, setMySchoolId] = useState("");
    const [opponentSchoolId, setOpponentSchoolId] = useState("");
    const [mySchoolName, setMySchoolName] = useState("Your School");
    const [opponentSchoolName, setOpponentSchoolName] = useState("Opponent");
    const [myMembers, setMyMembers] = useState<any[]>([]);
    const [opponentMembers, setOpponentMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waitingOnOpponent, setWaitingOnOpponent] = useState(false);

    const { timeLeft, isUrgent } = useWarTimer(war?.ends_at ?? null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        try {
            const res = await fetch(`/api/war/battle?war_id=${warId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
                cache: "no-store",
            });
            const data = await res.json();

            if (data.error === "MISSING_TABLE") { setError("Run the war SQL setup script first."); setLoading(false); return; }
            if (data.error) { setError(data.error); setLoading(false); return; }

            setWar(data.war);
            setMyQuestions(data.myQuestions || []);
            setOpponentQuestions(data.opponentQuestions || []);
            setSubmissions(data.submissions || []);
            setMySchoolId(data.mySchoolId);
            setOpponentSchoolId(data.opponentSchoolId);
            setMySchoolName(data.mySchoolName || "Your School");
            setOpponentSchoolName(data.opponentSchoolName || "Opponent");
            setMyMembers(data.challengerMembers || []);
            setOpponentMembers(data.defenderMembers || []);
            setWaitingOnOpponent(data.waitingOnOpponent);
        } catch {
            setError("Failed to load battlefield.");
        } finally {
            setLoading(false);
        }
    }, [warId, router]);

    useEffect(() => {
        fetchData();
        
        // 30s slow-poll fallback
        const intervalId = setInterval(fetchData, 30000);

        // Instant Realtime updates
        const channel = supabase
            .channel(`war-${warId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wars', filter: `id=eq.${warId}` }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'war_submissions', filter: `war_id=eq.${warId}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            clearInterval(intervalId);
            supabase.removeChannel(channel);
        };
    }, [fetchData, warId]);

    useEffect(() => {
        const onFocus = () => fetchData();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchData]);

    /* ── Derived scores ── */
    const myScore = submissions
        .filter(s => s.school_id === mySchoolId && s.status === "correct")
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
    const opponentScore = submissions
        .filter(s => s.school_id === opponentSchoolId && s.status === "correct")
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0);

    const mySecured = myQuestions.filter(q => submissions.some(s => s.question_id === q.id && s.school_id === mySchoolId && s.status === "correct")).length;
    const opponentSecured = opponentQuestions.filter(q => submissions.some(s => s.question_id === q.id && s.school_id === opponentSchoolId && s.status === "correct")).length;

    /* ── States ── */
    if (loading) {
        return (
            <View className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
                <View className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                <Text className="text-sm font-bold animate-pulse">Loading battlefield...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="max-w-sm mx-auto px-4 py-20 text-center">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <Text className="text-2xl font-black text-red-600 dark:text-red-400 mb-2">Error</Text>
                <Text className="text-slate-500 mb-6">{error}</Text>
                <View onPress={() => router.push("/war")} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold">War Room</View>
            </View>
        );
    }

    if (waitingOnOpponent) {
        return (
            <View className="max-w-sm mx-auto px-4 py-20 text-center">
                <Search className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-spin" />
                <Text className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-2">Awaiting Enemy Draft</Text>
                <Text className="text-slate-500 mb-6">The opposing General hasn't locked questions yet. Refreshing every 4 seconds...</Text>
                <View onPress={() => router.push("/war")} className="bg-slate-200 dark:bg-slate-800 px-6 py-2.5 rounded-xl font-bold">Return to Base</View>
            </View>
        );
    }

    const isLive = war?.status === "active";
    const isCalculating = war?.status === "calculating";
    const isCompleted = war?.status === "completed";

    // ── War ended results screen ──────────────────────
    if (isCompleted) {
        const iWon = war?.winner_school_id === mySchoolId;
        const isDraw = !war?.winner_school_id;
        return (
            <View className="min-h-[80vh] flex items-center justify-center px-4 py-12 flex-row">
                <View
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="w-full max-w-md"
                >
                    {/* Result banner */}
                    <View className={`text-center p-8 rounded-3xl mb-4 border-2 ${iWon
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border-amber-300 dark:border-amber-500/40"
                        : isDraw
                            ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10 border-red-200 dark:border-red-500/30"
                        }`}>
                        <View className="text-6xl mb-4">{iWon ? "🏆" : isDraw ? "🤝" : "💀"}</View>
                        <Text className={`text-4xl font-black mb-2 ${iWon ? "text-amber-600 dark:text-amber-400" : isDraw ? "text-slate-600 dark:text-slate-400" : "text-red-600 dark:text-red-400"}`}>
                            {iWon ? "VICTORY!" : isDraw ? "DRAW!" : "DEFEATED!"}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
                            {iWon ? "+5 victory bonus awarded to your squad!" : isDraw ? "An honourable tie." : "The enemy destroyed you."}
                        </Text>

                        {/* Final score */}
                        <View className="flex items-center justify-center gap-8 flex-row">
                            <View className="text-center">
                                <View className={`text-5xl font-black tabular-nums ${iWon ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>{myScore}</View>
                                <View className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{mySchoolName}</View>
                            </View>
                            <View className="text-slate-400 font-black">:</View>
                            <View className="text-center">
                                <View className={`text-5xl font-black tabular-nums ${!iWon && !isDraw ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}>{opponentScore}</View>
                                <View className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{opponentSchoolName}</View>
                            </View>
                        </View>
                    </View>

                    {/* Stats */}
                    <View className="grid grid-cols-2 gap-3 mb-6">
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                            <View className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{mySecured}<Text className="text-base text-slate-400">/{myQuestions.length}</Text></View>
                            <View className="text-xs font-bold text-slate-500 mt-1">Targets Destroyed</View>
                        </View>
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                            <View className="text-2xl font-black text-red-500">{opponentSecured}<Text className="text-base text-slate-400">/{opponentQuestions.length}</Text></View>
                            <View className="text-xs font-bold text-slate-500 mt-1">Your Base Fell</View>
                        </View>
                    </View>

                    <View
                        onPress={() => router.push("/war")}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl text-lg transition-all hover:opacity-90 active:scale-95"
                    >
                        Return to War Room
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="min-h-[100svh] bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100 pb-[calc(112px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] relative overflow-x-hidden native-scroll">

            {/* ─── Ambient background ───────────────────── */}
            <View className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <View className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
                <View className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/10 dark:bg-red-600/10 rounded-full blur-3xl" />
                <View className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
            </View>

            {/* ─── War Status Bar ───────────────────────── */}
            <View className={`relative z-10 w-full border-b backdrop-blur-md py-3 sm:py-4 px-3 sm:px-4 ${isLive
                ? "bg-gradient-to-r from-indigo-900/80 via-slate-900/80 to-red-900/80 dark:from-indigo-950/90 dark:to-red-950/90 border-indigo-700/30"
                : isCalculating
                    ? "bg-gradient-to-r from-fuchsia-900/80 to-slate-900/80 border-fuchsia-700/30"
                    : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"
                }`}>
                <View className="max-w-5xl mx-auto flex items-center justify-between gap-3 native-page-shell flex-row">
                    <View className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isLive
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                        : isCalculating
                            ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300"
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                        {isLive ? <Flame className="w-3 h-3 text-orange-400" /> : isCalculating ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                        <Text className={isLive ? "animate-pulse" : ""}>{isLive ? "⚔️ WAR IS LIVE" : isCalculating ? "🔮 CALCULATING" : "🏆 COMPLETED"}</Text>
                    </View>

                    {(isLive || isCalculating) && timeLeft && (
                        <View className={`flex items-center gap-2 font-mono font-black text-xl px-3 py-1.5 rounded-full border ${isUrgent
                            ? "border-red-500 text-red-400 bg-red-500/10 animate-pulse"
                            : isLive
                                ? "border-white/20 text-white bg-white/10"
                                : "border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10"
                            }`}>
                            <Clock className="w-5 h-5" />
                            {timeLeft}
                        </View>
                    )}
                </View>
            </View>

            {/* ─── Scoreboard ───────────────────────────── */}
            <View className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 mt-5 sm:mt-6 native-page-shell">
                <View className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm native-card">
                    <View className="grid grid-cols-3 items-center gap-4">
                        {/* My Team */}
                        <View className="text-center">
                            <View className="flex flex-col items-center gap-2 mb-3">
                                <View className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-row">
                                    <Shield className="w-7 h-7 text-white" />
                                </View>
                                <View className="font-black text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{mySchoolName}</View>
                            </View>
                            <View className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">{myScore}</View>
                            <View className="text-xs text-slate-500 mt-2">{mySecured}/{myQuestions.length} secured</View>
                        </View>

                        {/* VS */}
                        <View className="flex flex-col items-center gap-2">
                            <View className="relative">
                                <View className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30 flex-row">
                                    <Swords className="w-8 h-8 text-white" />
                                </View>
                                {isLive && <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />}
                            </View>
                            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">vs</Text>
                        </View>

                        {/* Opponent */}
                        <View className="text-center">
                            <View className="flex flex-col items-center gap-2 mb-3">
                                <View className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-row">
                                    <Target className="w-7 h-7 text-white" />
                                </View>
                                <View className="font-black text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{opponentSchoolName}</View>
                            </View>
                            <View className="text-5xl sm:text-6xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{opponentScore}</View>
                            <View className="text-xs text-slate-500 mt-2">{opponentSecured}/{opponentQuestions.length} secured</View>
                        </View>
                    </View>

                    {/* Progress bars */}
                    <View className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <View className="flex rounded-full h-3 bg-slate-100 dark:bg-slate-800 overflow-hidden flex-row">
                            {(myScore + opponentScore) > 0 ? (
                                <>
                                    <View
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700"
                                        style={{ width: `${(myScore / (myScore + opponentScore)) * 100}%` }}
                                    />
                                    <View
                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                                        style={{ width: `${(opponentScore / (myScore + opponentScore)) * 100}%` }}
                                    />
                                </>
                            ) : (
                                <View className="h-full w-full bg-gradient-to-r from-indigo-300 to-red-300 opacity-20" />
                            )}
                        </View>
                        <View className="flex justify-between mt-1.5 text-xs text-slate-400 font-bold flex-row">
                            <Text>🔵 {mySchoolName}</Text>
                            <Text>{opponentSchoolName} 🔴</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ─── Main Battlefield ─────────────────────── */}
            <View className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 mt-5 sm:mt-6 grid lg:grid-cols-2 gap-4 sm:gap-6 native-page-shell">

                {/* LEFT — My Questions (I attack) */}
                <View>
                    <View className="flex items-center gap-2 mb-4 flex-row">
                        <View className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center flex-row">
                            <Target className="w-4 h-4" />
                        </View>
                        <Text className="font-black text-xs sm:text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Attack These (Enemy's Questions)</Text>
                        <Text className="ml-auto text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                            {mySecured}/{myQuestions.length} destroyed
                        </Text>
                    </View>

                    {myQuestions.length === 0 ? (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <Text className="text-sm font-bold">Waiting for enemy to draft questions...</Text>
                        </View>
                    ) : (
                        <View className="grid gap-3">
                            {myQuestions.map(q => (
                                <QuestionCard
                                    key={q.id}
                                    q={q}
                                    isMine={true}
                                    sub={submissions}
                                    warStatus={war?.status}
                                    warId={warId}
                                    router={router}
                                />
                            ))}
                        </View>
                    )}

                    {/* My Squad Roster */}
                    {myMembers.length > 0 && (
                        <View className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                            <View className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 flex-row">
                                <User className="w-3.5 h-3.5" /> Your Squad
                            </View>
                            <View className="divide-y divide-slate-100 dark:divide-slate-800">
                                {myMembers.map(m => (
                                    <MemberRow key={m.id} member={m} submissions={submissions} schoolId={mySchoolId} />
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* RIGHT — Opponent's Questions (what they attack) */}
                <View>
                    <View className="flex items-center gap-2 mb-4 flex-row">
                        <View className="w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center flex-row">
                            <Shield className="w-4 h-4" />
                        </View>
                        <Text className="font-black text-xs sm:text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Your Side's Questions (Enemy Attacks These)</Text>
                        <Text className="ml-auto text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                            {opponentSecured}/{opponentQuestions.length} enemy secured
                        </Text>
                    </View>

                    {opponentQuestions.length === 0 ? (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <Text className="text-sm font-bold">Enemy questions not drafted yet...</Text>
                        </View>
                    ) : (
                        <View className="grid gap-3">
                            {opponentQuestions.map(q => {
                                const secured = submissions.some(s => s.question_id === q.id && s.school_id === opponentSchoolId && s.status === "correct");
                                return (
                                    <View key={q.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${secured ? "border-red-400/50 bg-red-50/80 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60"}`}>
                                        <View className={`h-1 w-full ${q.difficulty === "hard" ? "bg-red-500" : q.difficulty === "medium" ? "bg-amber-400" : "bg-green-400"}`} />
                                        <View className="p-4">
                                            <View className="flex justify-between items-start gap-2 mb-2 flex-row">
                                                <Text className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase tracking-wide">{q.subject || "General"}</Text>
                                                <Text className="text-xs font-black text-amber-500 flex items-center gap-0.5 flex-row"><Zap className="w-3 h-3" />{q.points}</Text>
                                            </View>
                                            <Text className={`text-sm font-bold leading-snug line-clamp-2 ${secured ? "line-through text-red-600 dark:text-red-400 opacity-60" : "text-slate-700 dark:text-slate-300"}`}>{q.title}</Text>
                                            {secured && <Text className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1 flex-row"><XCircle className="w-3.5 h-3.5" /> Enemy secured this</Text>}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Opponent Roster */}
                    {opponentMembers.length > 0 && (
                        <View className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                            <View className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 flex-row">
                                <User className="w-3.5 h-3.5" /> Enemy Roster
                            </View>
                            <View className="divide-y divide-slate-100 dark:divide-slate-800">
                                {opponentMembers.map(m => (
                                    <MemberRow key={m.id} member={m} submissions={submissions} schoolId={opponentSchoolId} />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* ─── Live Feed ────────────────────────────── */}
            <View className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 mt-5 sm:mt-6 native-page-shell">
                <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm native-card">
                    <View className="flex items-center justify-between mb-4 flex-row">
                        <Text className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 flex-row">
                            <Zap className="w-4 h-4 text-amber-500" /> Live Battle Feed
                        </Text>
                        <View className="flex items-center gap-1.5 text-xs font-bold text-green-500 flex-row">
                            <Text className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            LIVE
                        </View>
                    </View>

                    <View className="space-y-2 max-h-48 overflow-y-auto">
                        {submissions.length === 0 ? (
                            <Text className="text-center text-slate-400 text-sm py-6 font-bold">No shots fired yet. Be the first!</Text>
                        ) : (
                            [...submissions]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(sub => {
                                    const isAlly = sub.school_id === mySchoolId;
                                    return (
                                        <View key={sub.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${isAlly ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                                            <View className={`shrink-0 ${isAlly ? "text-indigo-500" : "text-red-400"}`}>
                                                {sub.status === "pending_check" ? <Search className="w-4 h-4 animate-spin" /> :
                                                    sub.status === "correct" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </View>
                                            <View className="flex-1 min-w-0 flex-row">
                                                <Text className={`font-bold ${isAlly ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}`}>
                                                    {isAlly ? "🔵 Ally" : "🔴 Enemy"}
                                                </Text>
                                                <Text className="text-slate-500 dark:text-slate-400 ml-1.5">fired a shot</Text>
                                            </View>
                                            <View className={`text-xs font-black shrink-0 ${sub.status === "pending_check" ? "text-amber-500" : sub.status === "correct" ? "text-green-500" : "text-red-500"}`}>
                                                {sub.status === "pending_check" ? "⏳ Checking" : sub.status === "correct" ? `✓ +${sub.points_awarded || 0}pts` : "✗ Miss"}
                                            </View>
                                        </View>
                                    );
                                })
                        )}
                    </View>
                </View>
            </View>

            {/* ─── Bonus Info Card ──────────────────────── */}
            <View className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 mt-4 native-page-shell">
                <View className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-wrap gap-3 sm:gap-4 text-sm native-card flex-row">
                    <View className="flex items-center gap-2 flex-row">
                        <Star className="w-4 h-4 text-amber-500 shrink-0" />
                        <Text className="font-bold text-amber-800 dark:text-amber-300">Scoring Rules:</Text>
                    </View>
                    <View className="flex flex-wrap gap-3 text-amber-700 dark:text-amber-400 font-medium text-xs flex-row">
                        <Text>✓ Correct → question points</Text>
                        <Text>✗ Wrong → no penalty</Text>
                        <Text>🏆 All correct → +5 bonus</Text>
                        <Text>⚔️ Win war → +5 bonus</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
