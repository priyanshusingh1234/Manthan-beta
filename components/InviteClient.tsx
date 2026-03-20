"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Zap, Users, Trophy, ArrowRight, CheckCircle, AlertTriangle, LogIn } from "lucide-react";
import Link from "next/link";

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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Invalid link
    if (notFound || !squadInfo) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-white mb-3">Invalid Invite</h1>
                <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">This recruit link has expired or the squad has been disbanded. Ask your General for a fresh link.</p>
                <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-all">
                    Go to Dheeyudha
                </Link>
            </div>
        );
    }

    // Successfully joined
    if (joined) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6">
                {/* Confetti-ish decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
                </div>
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50 shadow-2xl shadow-green-500/20">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <div className="inline-block bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                        Deployment Confirmed
                    </div>
                    <h1 className="text-4xl font-black text-white mb-3">Welcome, Soldier</h1>
                    <p className="text-slate-400 max-w-sm mx-auto mb-2 leading-relaxed text-lg">
                        You are now fighting for{" "}
                        <span className="text-white font-black">{squadInfo.school.name}</span>.
                    </p>
                    <p className="text-slate-500 text-sm mb-10">Your school flag is now on the global war map.</p>
                    <Link
                        href="/war"
                        className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-600/30 text-lg"
                    >
                        Enter the War Room <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        );
    }

    // Main invite page
    return (
        <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 blur-3xl rounded-full animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/10 blur-3xl rounded-full animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-900/50 blur-3xl rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-auto">
                {/* War badge */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest mb-6">
                        <Zap className="w-3 h-3" /> Recruit Draft Incoming
                    </div>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
                    {/* School icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 text-4xl font-black text-white">
                        {squadInfo.school.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl font-black text-white text-center mb-1 leading-tight">
                        {squadInfo.squad.generalName}
                    </h1>
                    <p className="text-slate-400 text-center text-sm mb-1">has personally drafted you to serve</p>
                    <h2 className="text-3xl font-black text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
                        {squadInfo.school.name}
                    </h2>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <p className="font-mono font-black text-xl text-white">{squadInfo.squad.memberCount}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Soldiers</p>
                        </div>
                        <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <p className="font-mono font-black text-xl text-indigo-400">{(squadInfo.school.points || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">War Points</p>
                        </div>
                        <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
                            <p className="font-mono font-black text-xl text-amber-400">50</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Max Roster</p>
                        </div>
                    </div>

                    {/* The hook text */}
                    <p className="text-slate-400 text-center text-sm leading-relaxed mb-8 border border-slate-800 bg-slate-950/30 rounded-xl p-4">
                        ⚠️ Accepting this draft will <span className="text-white font-bold">change your school</span> to{" "}
                        <span className="text-indigo-300 font-black">{squadInfo.school.name}</span>. All your points will now count for their war ranking.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-5 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* CTA */}
                    {session ? (
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Shield className="w-6 h-6" />
                            {joining ? "Swearing Allegiance..." : "Accept the Draft"}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-slate-500 text-sm font-medium">You must be logged in to accept this draft.</p>
                            <Link
                                href={`/?redirect=/invite?squad=${squadId}`}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                <LogIn className="w-5 h-5" /> Login to Accept
                            </Link>
                        </div>
                    )}

                    <p className="text-center text-slate-600 text-xs mt-4">Dheeyudha &mdash; The Premier Academic Proving Ground</p>
                </div>

                {/* Social proof */}
                <div className="flex items-center justify-center gap-6 mt-8 text-slate-600 text-xs font-medium">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Real Students</div>
                    <div className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> National Ranking</div>
                    <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> School Wars</div>
                </div>
            </div>
        </div>
    );
}
