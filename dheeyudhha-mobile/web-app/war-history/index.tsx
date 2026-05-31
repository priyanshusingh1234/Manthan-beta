import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from '@/lib/next-navigation';
import { 
    Shield, Swords, Clock, Target, Users, Search, 
    ChevronLeft, Calendar, Trophy, Zap, AlertCircle,
    ArrowUpRight, Award, History, Info
} from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from "@/lib/supabaseClient";
function WarHistoryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const schoolIdFromQuery = searchParams.get("schoolId");
    
    const [wars, setWars] = useState<any[]>([]);
    const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(schoolIdFromQuery);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                let finalSchoolId = schoolIdFromQuery;

                if (!finalSchoolId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        setResolvedSchoolId(null);
                        setWars([]);
                        return;
                    }
                    finalSchoolId = user.user_metadata?.school_id || null;
                    if (!finalSchoolId) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('school_id, school')
                            .eq('id', user.id)
                            .maybeSingle();
                        finalSchoolId = profile?.school_id || null;
                        if (!finalSchoolId && (profile?.school || user.user_metadata?.school)) {
                            const schoolName = profile?.school || user.user_metadata?.school;
                            const { data: schoolRow } = await supabase
                                .from('schools')
                                .select('id')
                                .eq('name', schoolName)
                                .maybeSingle();
                            finalSchoolId = schoolRow?.id || null;
                        }
                    }
                }

                if (!finalSchoolId) {
                    setResolvedSchoolId(null);
                    setWars([]);
                    return;
                }

                setResolvedSchoolId(finalSchoolId);
                const res = await fetch(`/api/war/history?schoolId=${finalSchoolId}`);
                const data = await res.json();
                if (res.ok) {
                    setWars(data.wars || []);
                }
            } catch (err) {
                console.error("Error fetching war history:", err);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [schoolIdFromQuery]);

    if (loading) {
        return (
            <View className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <View className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></View>
                <Text className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Scanning battle records...</Text>
            </View>
        );
    }

    if (!resolvedSchoolId) {
        return (
            <View 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-6 max-w-sm mx-auto"
            >
                <View className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 flex-row">
                    <Shield className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                </View>
                <Text className="text-2xl font-black mb-3">Identify Faction</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-8 font-medium">We couldn&apos;t identify your faction. Please return to your base to sync data.</Text>
                <View 
                    onPress={() => router.push('/my-school')}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                >
                    Return to Base
                </View>
            </View>
        );
    }

    return (
        <View className="space-y-4 px-4 pb-12">
            {wars.length === 0 ? (
                <View 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 shadow-sm"
                >
                    <View className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 flex-row">
                        <History className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </View>
                    <Text className="text-2xl font-black mb-3">Battles Pending</Text>
                    <Text className="text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto font-medium text-sm leading-relaxed">
                        Your faction has not engaged in any world wars yet. Join the War Room to make history!
                    </Text>
                </View>
            ) : (
                <View className="grid gap-4">
                    <>
                        {wars.map((war, idx) => {
                            const isChallenger = war.challenger_school_id === resolvedSchoolId;
                            const mySchoolName = isChallenger ? war.challenger_school?.name : war.defender_school?.name;
                            const opponentName = isChallenger ? war.defender_school?.name : (war.challenger_school?.name || "Ghost School");
                            const myScore = isChallenger ? war.challenger_score : war.defender_score;
                            const oppScore = isChallenger ? war.defender_score : war.challenger_score;
                            
                            const isLive = war.status === 'active' || war.status === 'preparation' || war.status === 'calculating';
                            const isWin = !isLive && war.winner_school_id === resolvedSchoolId;
                            const isLoss = !isLive && war.winner_school_id && war.winner_school_id !== resolvedSchoolId;
                            const isDraw = !isLive && !war.winner_school_id && war.status === 'completed';

                            const formattedDate = new Intl.DateTimeFormat('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: idx === wars.length - 1 ? 'numeric' : undefined
                            }).format(new Date(war.declared_at));

                            return (
                                <View
                                    key={war.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    layout
                                >
                                    <Link href={`/war-battle/${war.id}`} className="block active:scale-[0.98] transition-all">
                                        <View className={`relative overflow-hidden rounded-[1.75rem] border-2 transition-all p-5 shadow-sm
                                            ${isWin 
                                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20" 
                                                : isLoss 
                                                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-500/20"
                                                    : isLive
                                                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20"
                                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                            }`}
                                        >
                                            <View className="flex items-start justify-between mb-4 flex-row">
                                                <View>
                                                    <View className="flex items-center gap-2 mb-1.5 flex-row">
                                                        {isLive ? (
                                                            <Text className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full flex-row">
                                                                <Text className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                                                Live Battle
                                                            </Text>
                                                        ) : isWin ? (
                                                            <Text className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg flex-row">
                                                                <Trophy className="w-3 h-3" /> Victory
                                                            </Text>
                                                        ) : isLoss ? (
                                                            <Text className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-1 rounded-lg flex-row">
                                                                <Info className="w-3 h-3" /> Defeat
                                                            </Text>
                                                        ) : (
                                                            <Text className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex-row">
                                                                Draw
                                                            </Text>
                                                        )}
                                                        <Text className="text-[10px] font-bold text-slate-400 uppercase">{formattedDate}</Text>
                                                    </View>
                                                    <Text className="text-lg font-black tracking-tight flex items-center gap-2 flex-row">
                                                        <Text className="truncate max-w-[140px]">{mySchoolName}</Text>
                                                        <Text className="text-slate-300 dark:text-slate-600 font-bold italic text-sm shrink-0">vs</Text>
                                                        <Text className="truncate max-w-[140px] text-slate-600 dark:text-slate-300">{opponentName}</Text>
                                                    </Text>
                                                </View>
                                                <View className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm shrink-0 flex-row">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </View>
                                            </View>

                                            <View className="flex items-center gap-3 flex-row">
                                                <View className="flex-1 bg-white/60 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center justify-between border border-slate-200/40 dark:border-white/5 flex-row">
                                                    <View className="space-y-0.5">
                                                        <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score</Text>
                                                        <Text className={`text-2xl font-black font-mono leading-none ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                                            {myScore || 0}
                                                        </Text>
                                                    </View>
                                                    <View className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
                                                    <View className="space-y-0.5 text-right">
                                                        <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enemy</Text>
                                                        <Text className={`text-2xl font-black font-mono leading-none ${isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {oppScore || 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                
                                                {/* Mini Stats Circle */}
                                                <View className="hidden sm:flex flex-col gap-1 shrink-0">
                                                    <View className="flex items-center gap-1 text-[10px] font-bold text-slate-500 flex-row">
                                                        <Award className="w-3 h-3 text-amber-500" />
                                                        ID: {war.id.split('-')[0]}
                                                    </View>
                                                    <View className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 flex-row">
                                                        <Swords className="w-3 h-3" />
                                                        {war.war_format}v{war.war_format}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </Link>
                                </View>
                            );
                        })}
                    </>
                </View>
            )}
        </View>
    );
}

export default function WarHistoryPage() {
    const router = useRouter();

    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 relative overflow-x-hidden">
            {/* Native style sticky app bar */}
            <View className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0f1d]/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4 flex-row">
                <View 
                    onPress={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex-row"
                >
                    <ChevronLeft className="w-6 h-6" />
                </View>
                <View className="flex-1 flex-row">
                    <Text className="text-xl font-black tracking-tight">War History</Text>
                    <View className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest flex-row">
                        <History className="w-3 h-3" />
                        Battle Logs
                    </View>
                </View>
                <View className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-row">
                    <History className="w-5 h-5 text-indigo-500" />
                </View>
            </View>

            {/* Content Area */}
            <View className="max-w-2xl mx-auto pt-6 pb-24">
                <View className="px-6 mb-8">
                    <View className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <View className="relative z-10">
                            <Text className="text-2xl font-black mb-1">Strategic Archives</Text>
                            <Text className="text-white/80 text-xs font-medium max-w-[200px]">Review past deployments, analyze enemy tactics, and celebrate victories.</Text>
                        </View>
                        <View className="absolute bottom-4 right-4 text-white/20">
                            <Swords className="w-16 h-16 transform -rotate-12" />
                        </View>
                    </View>
                </View>

                <Suspense fallback={
                    <View className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                        <View className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></View>
                    </View>
                }>
                    <WarHistoryContent />
                </Suspense>
            </View>

            {/* Pull to refresh indicator simulation / footer space */}
            <View className="h-20" />
        </View>
    );
}
