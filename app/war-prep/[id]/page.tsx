"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Target, AlertCircle, CheckCircle2, Search, ArrowRight, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";

async function nativeHaptic(kind: "light" | "medium" = "light") {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
        await Haptics.impact({ style: kind === "light" ? ImpactStyle.Light : ImpactStyle.Medium });
    } catch {
        // ignore haptics failures
    }
}

export default function WarPrepPage() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;
    
    const [war, setWar] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [isGeneral, setIsGeneral] = useState(false);
    const [hasLocked, setHasLocked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prepTimeLeft, setPrepTimeLeft] = useState("--:--");
    const [myPickedCount, setMyPickedCount] = useState(0);
    const [opponentPickedCount, setOpponentPickedCount] = useState(0);
    const [requiredPicks, setRequiredPicks] = useState(5);
    const [isSelectedForWar, setIsSelectedForWar] = useState(true);
    const [selectedRosterCount, setSelectedRosterCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchPrepData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`/api/war/prep?war_id=${warId}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setWar(data.war);
                    setQuestions(data.questions);
                    setIsGeneral(data.isGeneral);
                    setHasLocked(data.hasLockedPicks);
                    setMyPickedCount(data.myPickedCount || 0);
                    setOpponentPickedCount(data.opponentPickedCount || 0);
                    setRequiredPicks(data.requiredPicks || 5);
                    setIsSelectedForWar(data.isSelectedForWar !== false);
                    setSelectedRosterCount(typeof data.selectedRosterCount === "number" ? data.selectedRosterCount : null);
                }
            } catch (err: any) {
                setError("Failed to load preparation data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrepData();
    }, [warId, router]);

    useEffect(() => {
        if (!war?.declared_at || war?.status !== 'preparation') return;

        const tick = () => {
            const start = new Date(war.declared_at).getTime();
            const end = start + 10 * 60 * 1000;
            const diff = end - Date.now();
            if (diff <= 0) {
                setPrepTimeLeft("00:00");
                return;
            }
            const totalSecs = Math.floor(diff / 1000);
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            setPrepTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [war?.declared_at, war?.status]);

    const toggleQuestion = (id: string) => {
        if (hasLocked) return;
        setSelectedId(prev => (prev === id ? null : id));
        nativeHaptic("light");
    };

    const lockInPicks = async () => {
        if (!selectedId || hasLocked || !isSelectedForWar) return;
        setLocking(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/war/prep`, {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ war_id: warId, question_id: selectedId })
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setSelectedId(null);
                const myCount = data.myPickedCount ?? (myPickedCount + 1);
                setMyPickedCount(myCount);
                setHasLocked(myCount >= (data.requiredPicks || requiredPicks));
                nativeHaptic("medium");
            }
        } catch (err: any) {
            setError("Failed to submit your pick.");
        } finally {
            setLocking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 pb-[calc(76px+env(safe-area-inset-bottom))]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                <h2 className="text-xl font-bold animate-pulse">Loading War Preparation...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-5 text-center text-slate-900 dark:text-slate-100">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-500">Access Denied</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to War Room</button>
            </div>
        );
    }

    return (
        <div className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[calc(82px+env(safe-area-inset-bottom))] pt-[calc(10px+env(safe-area-inset-top))] md:pt-12 relative overflow-hidden native-scroll">
            <div className="pointer-events-none absolute -top-32 left-1/4 w-[34rem] h-[34rem] rounded-full bg-amber-400/10 dark:bg-amber-500/10 blur-3xl mix-blend-overlay" />
            
            <div className="max-w-6xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8 relative z-10 native-page-shell">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" /> PREPARATION PHASE
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black mb-2">Draft Your Artillery</h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl">
                            Every squad member contributes one question pick until your side reaches 
                            <strong className="text-slate-900 dark:text-white px-1">{requiredPicks}</strong>. 
                            Those become the opponent's targets. Enemy side is doing the same.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl min-w-[250px] native-card">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Prep Clock</span>
                            <span className="font-mono font-black text-xl text-red-600 dark:text-red-400">{prepTimeLeft}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Your Side Picks</span>
                            <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-500">{myPickedCount} / {requiredPicks}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Enemy Picks</span>
                            <span className="font-mono font-black text-xl text-slate-700 dark:text-slate-300">{opponentPickedCount} / {requiredPicks}</span>
                        </div>
                        {selectedRosterCount !== null && (
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Deployed Members</span>
                                <span className="font-mono font-black text-xl text-red-600 dark:text-red-400">{selectedRosterCount}</span>
                            </div>
                        )}
                        {hasLocked ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5" /> Your side is fully drafted
                            </div>
                        ) : !isSelectedForWar ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 rounded-lg text-center px-2">
                                <AlertCircle className="w-5 h-5" /> General did not deploy you for this war
                            </div>
                        ) : (
                            <button 
                                onClick={lockInPicks}
                                disabled={!selectedId || locking}
                                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95"
                            >
                                {locking ? "Submitting..." : "Submit My Question Pick"} <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        {!hasLocked && isSelectedForWar && (
                            <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-bold mt-2">Each member can submit one pick at a time.</div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-3 sm:px-6 relative z-10 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 native-page-shell">
                {questions.map(q => {
                    const isSelected = selectedId === q.id;
                    return (
                        <div 
                            key={q.id}
                            onClick={() => toggleQuestion(q.id)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group native-card
                                ${isSelected 
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-md shadow-amber-900/10 scale-[1.02]' 
                                    : hasLocked ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 opacity-60 cursor-not-allowed' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-lg'}
                            `}
                        >
                            {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/20 rounded-bl-full pointer-events-none" />}
                            
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isSelected ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    {q.subject || 'General'}
                                </span>
                                {isSelected ? <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-500 drop-shadow-sm" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-amber-400" />}
                            </div>
                            
                            <h3 className={`font-bold text-lg leading-tight mb-3 line-clamp-3 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                {q.title}
                            </h3>
                            
                            <div className="flex items-center gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Class {q.class_grade || '?'}
                                </div>
                                <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                    {q.points || 0} pts
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
}
