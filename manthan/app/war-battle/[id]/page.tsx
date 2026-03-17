"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Target, AlertCircle, Search, Zap, Swords, Crown, AlertTriangle, Clock } from "lucide-react";

function useWarTimer(endsAt: string | null, status: string) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!endsAt) return;
        const tick = () => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("00:00"); return; }
            const totalSecs = Math.floor(diff / 1000);
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endsAt]);

    return timeLeft;
}

export default function WarBattleDashboard() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;

    const [war, setWar] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [mySchoolId, setMySchoolId] = useState<string>("");
    const [opponentSchoolId, setOpponentSchoolId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waitingOnOpponent, setWaitingOnOpponent] = useState(false);

    const warTimer = useWarTimer(war?.ends_at, war?.status);

    const fetchBattleData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        try {
            const res = await fetch(`/api/war/battle?war_id=${warId}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                cache: 'no-store'
            });
            const data = await res.json();

            if (data.error === 'MISSING_TABLE') {
                setError("Database Schema Missing. Please run the war SQL migration.");
                setLoading(false);
                return;
            }
            if (data.error) {
                setError(data.error);
            } else {
                setWar(data.war);
                setQuestions(data.questions || []);
                setSubmissions(data.submissions || []);
                setMySchoolId(data.mySchoolId);
                setOpponentSchoolId(data.opponentSchoolId);
                setWaitingOnOpponent(data.waitingOnOpponent);
            }
        } catch {
            setError("Failed to load battle data.");
        } finally {
            setLoading(false);
        }
    }, [warId, router]);

    useEffect(() => {
        fetchBattleData();
        const timerId = setInterval(fetchBattleData, 4000); // poll every 4s for live updates
        return () => clearInterval(timerId);
    }, [fetchBattleData]);

    // Re-fetch immediately when navigating back from solve page
    useEffect(() => {
        const handleFocus = () => fetchBattleData();
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetchBattleData]);

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100 pb-20">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-red-500 rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-bold animate-pulse text-red-500">Connecting to Battlefield...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-500">Battlefield Error</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to War Room</button>
            </div>
        );
    }

    if (waitingOnOpponent) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Search className="w-16 h-16 text-amber-500 mb-4 animate-spin" />
                <h1 className="text-2xl font-black mb-2 text-amber-600 dark:text-amber-500">Awaiting Enemy Draft</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">The opposing General has not locked in their questions yet. Auto-refreshing every 4 seconds...</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to Base</button>
            </div>
        );
    }

    const myScore = war?.challenger_school_id === mySchoolId ? war.challenger_score : war.defender_score;
    const opponentScore = war?.challenger_school_id === opponentSchoolId ? war.challenger_score : war.defender_score;
    const isLive = war?.status === 'active';
    const isCalculating = war?.status === 'calculating';

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
            {/* Ambient glows */}
            <div className={`pointer-events-none fixed top-0 left-0 w-[50vw] h-64 blur-3xl opacity-60 ${isCalculating ? 'bg-fuchsia-500/10' : 'bg-red-500/10'}`} />
            <div className={`pointer-events-none fixed bottom-0 right-0 w-[50vw] h-64 blur-3xl opacity-60 ${isCalculating ? 'bg-fuchsia-600/10' : 'bg-orange-500/10'}`} />

            {/* Score + Timer Header — sits below global header */}
            <div className={`w-full border-b px-4 py-5 ${isCalculating ? 'border-fuchsia-200 dark:border-fuchsia-500/20 bg-fuchsia-50/50 dark:bg-fuchsia-900/10' : isLive ? 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60'} backdrop-blur-sm`}>
                <div className="max-w-5xl mx-auto">
                    {/* Status badge + timer as one row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 ${isCalculating ? 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400' : isLive ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {isLive ? <Swords className="w-3 h-3" /> : isCalculating ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                            {isLive ? 'WAR IS LIVE' : isCalculating ? 'CALCULATING RESULTS' : 'COMBAT ENDED'}
                        </div>

                        {/* Live War Timer */}
                        {(isLive || isCalculating) && warTimer && (
                            <div className={`flex items-center gap-1.5 font-mono font-black text-xl px-4 py-1.5 rounded-full border ${warTimer === '00:00' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : isCalculating ? 'border-fuchsia-400 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/20' : 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'}`}>
                                <Clock className="w-4 h-4" />
                                {warTimer}
                            </div>
                        )}
                    </div>

                    {/* Live Scoreboard */}
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums">{myScore ?? 0}</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Your Squad</div>
                        </div>

                        <div className="text-slate-400 dark:text-slate-600">
                            <Swords className="w-6 h-6" />
                        </div>

                        <div className="text-center">
                            <div className="text-5xl sm:text-6xl font-black text-red-600 dark:text-red-500 tabular-nums">{opponentScore ?? 0}</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Opponent</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6 relative z-10">
                {/* Questions */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <Target className="w-4 h-4 text-red-500" /> Incoming Payload
                    </h3>

                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No questions assigned yet.</div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {questions.map(q => {
                                const correctSub = submissions.find(s => s.question_id === q.id && s.school_id === mySchoolId && s.status === 'correct');
                                const totalAttempts = submissions.filter(s => s.question_id === q.id && s.school_id === mySchoolId).length;

                                return (
                                    <div key={q.id} className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden
                                        ${correctSub
                                            ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-500/30'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                                    >
                                        {correctSub && <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-bl-full pointer-events-none" />}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                {q.subject || 'General'}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                                {q.points || 0} pts
                                            </span>
                                        </div>
                                        <h4 className={`font-bold leading-tight mb-4 ${correctSub ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-slate-900 dark:text-white'}`}>
                                            {q.title}
                                        </h4>

                                        {correctSub ? (
                                            <div className="text-sm font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Secured!
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto">
                                                <div className="text-xs text-slate-500 font-bold">Shots fired: {totalAttempts}</div>
                                                {isLive ? (
                                                    <button
                                                        onClick={() => router.push(`/war-battle/${warId}/solve/${q.id}`)}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs shadow-md shadow-red-500/20 transition-all active:scale-95"
                                                    >
                                                        Engage →
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">Locked</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Live Feed */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <Zap className="w-4 h-4 text-indigo-500" /> Live Feed
                        <span className="ml-auto flex items-center gap-1 text-xs text-green-500 font-bold">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
                        </span>
                    </h3>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-[460px] overflow-y-auto space-y-2">
                        {submissions.length === 0 ? (
                            <div className="text-center text-slate-500 py-8 text-sm font-bold">No shots fired yet.</div>
                        ) : (
                            [...submissions]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(sub => {
                                    const isAlly = sub.school_id === mySchoolId;
                                    return (
                                        <div key={sub.id} className={`p-3 rounded-xl border flex gap-3 text-sm ${isAlly ? 'bg-indigo-50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20' : 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20'}`}>
                                            <div className={`mt-0.5 flex-shrink-0 ${isAlly ? 'text-indigo-500' : 'text-red-500'}`}>
                                                {sub.status === 'pending_check' ? <Search className="w-4 h-4 animate-spin" /> :
                                                    sub.status === 'correct' ? <Shield className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                    {isAlly ? '🟦 Ally' : '🟥 Enemy'} fired a shot
                                                </div>
                                                <div className={`text-xs mt-0.5 font-bold ${sub.status === 'pending_check' ? 'text-amber-500' : sub.status === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {sub.status === 'pending_check' ? 'Checking...' : sub.status === 'correct' ? `✓ HIT! +${sub.points_awarded || 0} pts` : '✗ MISSED'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
