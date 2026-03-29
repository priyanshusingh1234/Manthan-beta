"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swords, Trophy, Zap, Clock, Users, ArrowRight, MessageSquare } from "lucide-react";
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
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
                <div className="h-3 w-16 bg-white/20 rounded-full animate-pulse" />
            </div>
        );
        const isYou = (label === "initiator" && initiator?.username === player.username && currentUserId)
            || (label === "partner" && partner?.username === player.username && currentUserId);

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative">
                    {player.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover border-3 border-white/40 shadow-lg"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 text-white font-black text-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                            {player.name[0]?.toUpperCase()}
                        </div>
                    )}
                    {/* Live pulse ring */}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                    </span>
                </div>
                <div className="text-center">
                    <p className="text-white font-bold text-sm leading-tight">{(player.name || "Student").split(" ")[0]}</p>
                    <p className="text-white/60 text-xs">@{player.username}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-[2rem] mb-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.4),transparent_60%)]" />

            {/* Floating particles */}
            <div className="absolute top-4 left-12 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="absolute top-8 right-16 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            <div className="absolute bottom-5 left-24 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0.7s" }} />

            <div className="relative z-10 p-6 sm:p-8">
                {/* Top row: badge + timer */}
                <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        HELP REQUEST (LIVE)
                    </div>

                    <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {timeLeft || "Loading..."}
                    </div>
                </div>

                {/* Help Message */}
                {helpMessage && (
                    <div className="mb-5 flex items-start gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                        <MessageSquare className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                        <p className="text-white/90 text-sm font-semibold italic leading-snug">&ldquo;{helpMessage}&rdquo;</p>
                    </div>
                )}

                {/* Player vs Player */}
                <div className="flex items-center justify-between gap-4">
                    <Avatar player={initiator} label="initiator" />

                    {/* Center: VS + points */}
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-white/10 border border-white/20 rounded-2xl">
                            <Swords className="w-6 h-6 text-white/80" />
                        </div>
                        <div className="text-center">
                            <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Each wins</div>
                            <div className="flex items-center gap-1 text-white font-black text-2xl">
                                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                +{splitPoints}
                                <span className="text-sm font-semibold text-white/70">pts</span>
                            </div>
                            <div className="text-white/50 text-[10px]">if verified correct</div>
                        </div>
                    </div>

                    <Avatar player={partner} label="partner" />
                </div>

                {/* Bottom bar */}
                <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>Submit your answer below — both players solve independently</span>
                    </div>
                    <button
                        onClick={() => router.push(`/coop/${challengeId}`)}
                        className="shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl transition border border-white/20 whitespace-nowrap"
                    >
                        Live Status <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
