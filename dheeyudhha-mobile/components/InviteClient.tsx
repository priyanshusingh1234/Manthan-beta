"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Zap, Users, Trophy, ArrowRight, CheckCircle, AlertTriangle, LogIn } from 'lucide-react-native';
import { Link } from 'expo-router';

interface Props {
    squadId: string | null;
}

export default function InviteClient({ squadId }: Props) {
    const [squadInfo, setSquadInfo] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        // Fetch squad public info (no auth needed)
        if (!squadId) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        fetch(`/api/squad/join?squad=${squadId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    setNotFound(true);
                } else {
                    setSquadInfo(data);
                }
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));

        // Check auth
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => authListener?.subscription.unsubscribe();
    }, [squadId]);

    const handleJoin = async () => {
        if (!session) return;
        setJoining(true);
        setError(null);
        try {
            const res = await fetch('/api/squad/join', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ squadId }),
            });
            const data = await res.json();
            if (res.ok) {
                setJoined(true);
            } else {
                setError(data.error || "Failed to join. Try again.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <View className="min-h-screen bg-slate-950 flex items-center justify-center flex-row">
                <View className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </View>
        );
    }

    // Invalid link
    if (notFound || !squadInfo) {
        return (
            <View className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6">
                <View className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30 flex-row">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </View>
                <Text className="text-3xl font-black text-white mb-3">Invalid Invite</Text>
                <Text className="text-slate-400 max-w-sm mb-8 leading-relaxed">This recruit link has expired or the squad has been disbanded. Ask your General for a fresh link.</Text>
                <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-all">
                    Go to Dheeyudha
                </Link>
            </View>
        );
    }

    // Successfully joined
    if (joined) {
        return (
            <View className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6">
                {/* Confetti-ish decorations */}
                <View className="absolute inset-0 overflow-hidden pointer-events-none">
                    <View className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full" />
                    <View className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
                </View>
                <View className="relative z-10">
                    <View className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50 shadow-2xl shadow-green-500/20 flex-row">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </View>
                    <View className="inline-block bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                        Deployment Confirmed
                    </View>
                    <Text className="text-4xl font-black text-white mb-3">Welcome, Soldier</Text>
                    <Text className="text-slate-400 max-w-sm mx-auto mb-2 leading-relaxed text-lg">
                        You are now fighting for{" "}
                        <Text className="text-white font-black">{squadInfo.school.name}</Text>.
                    </Text>
                    <Text className="text-slate-500 text-sm mb-10">Your school flag is now on the global war map.</Text>
                    <Link
                        href="/war"
                        className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-600/30 text-lg flex-row"
                    >
                        Enter the War Room <ArrowRight className="w-5 h-5" />
                    </Link>
                </View>
            </View>
        );
    }

    // Main invite page
    return (
        <View className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
            {/* Background blobs */}
            <View className="absolute inset-0 pointer-events-none overflow-hidden">
                <View className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 blur-3xl rounded-full animate-pulse" />
                <View className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/10 blur-3xl rounded-full animate-pulse delay-1000" />
                <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-900/50 blur-3xl rounded-full" />
            </View>

            <View className="relative z-10 w-full max-w-md mx-auto">
                {/* War badge */}
                <View className="text-center mb-10">
                    <View className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest mb-6 flex-row">
                        <Zap className="w-3 h-3" /> Recruit Draft Incoming
                    </View>
                </View>

                {/* Card */}
                <View className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
                    {/* School icon */}
                    <View className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 text-4xl font-black text-white flex-row">
                        {squadInfo.school.name.charAt(0).toUpperCase()}
                    </View>

                    {/* Headline */}
                    <Text className="text-2xl font-black text-white text-center mb-1 leading-tight">
                        {squadInfo.squad.generalName}
                    </Text>
                    <Text className="text-slate-400 text-center text-sm mb-1">has personally drafted you to serve</Text>
                    <Text className="text-3xl font-black text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
                        {squadInfo.school.name}
                    </Text>

                    {/* Stats strip */}
                    <View className="grid grid-cols-3 gap-3 mb-8">
                        <View className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <Text className="font-mono font-black text-xl text-white">{squadInfo.squad.memberCount}</Text>
                            <Text className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Soldiers</Text>
                        </View>
                        <View className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <Text className="font-mono font-black text-xl text-indigo-400">{(squadInfo.school.points || 0).toLocaleString()}</Text>
                            <Text className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">War Points</Text>
                        </View>
                        <View className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <Text className="font-mono font-black text-xl text-amber-400">50</Text>
                            <Text className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Max Roster</Text>
                        </View>
                    </View>

                    {/* The hook text */}
                    <Text className="text-slate-400 text-center text-sm leading-relaxed mb-8 border border-slate-800 bg-slate-950/30 rounded-xl p-4">
                        ⚠️ Accepting this draft will <Text className="text-white font-bold">change your school</Text> to{" "}
                        <Text className="text-indigo-300 font-black">{squadInfo.school.name}</Text>. All your points will now count for their war ranking.
                    </Text>

                    {error && (
                        <View className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-5 text-sm text-center font-medium">
                            {error}
                        </View>
                    )}

                    {/* CTA */}
                    {session ? (
                        <View
                            onPress={handleJoin}
                            disabled={joining}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed flex-row"
                        >
                            <Shield className="w-6 h-6" />
                            {joining ? "Swearing Allegiance..." : "Accept the Draft"}
                        </View>
                    ) : (
                        <View className="space-y-4">
                            <Text className="text-center text-slate-500 text-sm font-medium">You must be logged in to accept this draft.</Text>
                            <Link
                                href={`/?redirect=/invite?squad=${squadId}`}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-3 shadow-xl flex-row"
                            >
                                <LogIn className="w-5 h-5" /> Login to Accept
                            </Link>
                        </View>
                    )}

                    <Text className="text-center text-slate-600 text-xs mt-4">Dheeyudha &mdash; The Premier Academic Proving Ground</Text>
                </View>

                {/* Social proof */}
                <View className="flex items-center justify-center gap-6 mt-8 text-slate-600 text-xs font-medium flex-row">
                    <View className="flex items-center gap-1.5 flex-row"><Users className="w-3.5 h-3.5" /> Real Students</View>
                    <View className="flex items-center gap-1.5 flex-row"><Trophy className="w-3.5 h-3.5" /> National Ranking</View>
                    <View className="flex items-center gap-1.5 flex-row"><Shield className="w-3.5 h-3.5" /> School Wars</View>
                </View>
            </View>
        </View>
    );
}
