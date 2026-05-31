import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { useState, useEffect } from "react";
import { useRouter } from '@/lib/next-navigation';
import { Swords, Trophy, Zap, Clock, Users, ArrowRight, MessageSquare } from 'lucide-react-native';
import { supabase } from "@/lib/supabaseClient";

type PlayerInfo = {
    name: string;
    username: string;
    avatar: string | null;
};

type CoopHeaderProps = {
    challengeId: string;
    questionPoints: number;
    currentUserId: string | null;
};

export default function CoopChallengeHeader({ challengeId, questionPoints, currentUserId }: CoopHeaderProps) {
    const router = useRouter();
    const [initiator, setInitiator] = useState<PlayerInfo | null>(null);
    const [partner, setPartner] = useState<PlayerInfo | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [loaded, setLoaded] = useState(false);
    const [helpMessage, setHelpMessage] = useState<string | null>(null);

    const splitPoints = Math.ceil(questionPoints / 2);

    // Fetch challenge + players
    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/coop/${challengeId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (!res.ok) return;
            const data = await res.json();

            setInitiator({
                name: data.initiator.name,
                username: data.initiator.username,
                avatar: data.initiator.avatar,
            });
            setPartner({
                name: data.partner.name,
                username: data.partner.username,
                avatar: data.partner.avatar,
            });
            setExpiresAt(data.challenge.expiresAt);
            setHelpMessage(data.challenge.message || null);
            setLoaded(true);
        })();
    }, [challengeId]);

    // Countdown
    useEffect(() => {
        if (!expiresAt) return;
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
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
    }, [expiresAt]);

    function Avatar({ player, label }: { player: PlayerInfo | null; label: string }) {
        if (!player) return (
            <View className="flex flex-col items-center gap-2">
                <View className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
                <View className="h-3 w-16 bg-white/20 rounded-full animate-pulse" />
            </View>
        );
        const isYou = (label === "initiator" && initiator?.username === player.username && currentUserId)
            || (label === "partner" && partner?.username === player.username && currentUserId);

        return (
            <View className="flex flex-col items-center gap-2">
                <View className="relative">
                    {player.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image
                            src={player.avatar}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover border-3 border-white/40 shadow-lg"
                        />
                    ) : (
                        <View className="w-16 h-16 rounded-full bg-white/20 text-white font-black text-2xl flex items-center justify-center border-2 border-white/30 shadow-lg flex-row">
                            {player.name[0]?.toUpperCase()}
                        </View>
                    )}
                    {/* Live pulse ring */}
                    <Text className="absolute -top-1 -right-1 flex h-4 w-4 flex-row">
                        <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 flex-row" />
                        <Text className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white flex-row" />
                    </Text>
                </View>
                <View className="text-center">
                    <Text className="text-white font-bold text-sm leading-tight">{(player.name || "Student").split(" ")[0]}</Text>
                    <Text className="text-white/60 text-xs">@{player.username}</Text>
                </View>
            </View>
        );
    }

    return (
        <View className={`relative overflow-hidden rounded-[2rem] mb-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            {/* Animated gradient background */}
            <View className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
            <View className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
            <View className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.4),transparent_60%)]" />

            {/* Floating particles */}
            <View className="absolute top-4 left-12 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <View className="absolute top-8 right-16 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            <View className="absolute bottom-5 left-24 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0.7s" }} />

            <View className="relative z-10 p-6 sm:p-8">
                {/* Top row: badge + timer */}
                <View className="flex items-center justify-between mb-6 flex-row">
                    <View className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wider flex-row">
                        <Text className="relative flex h-2 w-2 flex-row">
                            <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 flex-row" />
                            <Text className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 flex-row" />
                        </Text>
                        HELP REQUEST (LIVE)
                    </View>

                    <View className="flex items-center gap-1.5 text-white/80 text-xs font-semibold flex-row">
                        <Clock className="w-3.5 h-3.5" />
                        {timeLeft || "Loading..."}
                    </View>
                </View>

                {/* Help Message */}
                {helpMessage && (
                    <View className="mb-5 flex items-start gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex-row">
                        <MessageSquare className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                        <Text className="text-white/90 text-sm font-semibold italic leading-snug">&ldquo;{helpMessage}&rdquo;</Text>
                    </View>
                )}

                {/* Player vs Player */}
                <View className="flex items-center justify-between gap-4 flex-row">
                    <Avatar player={initiator} label="initiator" />

                    {/* Center: VS + points */}
                    <View className="flex flex-col items-center gap-3 flex-1">
                        <View className="flex items-center justify-center w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex-row">
                            <Swords className="w-6 h-6 text-white/80" />
                        </View>
                        <View className="text-center">
                            <View className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Each wins</View>
                            <View className="flex items-center gap-1 text-white font-black text-2xl flex-row">
                                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                +{splitPoints}
                                <Text className="text-sm font-semibold text-white/70">pts</Text>
                            </View>
                            <View className="text-white/50 text-[10px]">if verified correct</View>
                        </View>
                    </View>

                    <Avatar player={partner} label="partner" />
                </View>

                {/* Bottom bar */}
                <View className="mt-6 flex items-center justify-between gap-3 flex-row">
                    <View className="flex items-center gap-2 text-white/70 text-xs flex-row">
                        <Users className="w-3.5 h-3.5" />
                        <Text>Submit your answer below — both players solve independently</Text>
                    </View>
                    <View
                        onPress={() => router.push(`/coop/${challengeId}`)}
                        className="shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl transition border border-white/20 whitespace-nowrap flex-row"
                    >
                        Live Status <ArrowRight className="w-3 h-3" />
                    </View>
                </View>
            </View>
        </View>
    );
}
