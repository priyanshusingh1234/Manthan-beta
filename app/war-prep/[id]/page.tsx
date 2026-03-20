"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Target, AlertCircle, CheckCircle2, Search, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function WarPrepPage() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;
    
    const [war, setWar] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [isGeneral, setIsGeneral] = useState(false);
    const [hasLocked, setHasLocked] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                }
            } catch (err: any) {
                setError("Failed to load preparation data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrepData();
    }, [warId, router]);

    const toggleQuestion = (id: string) => {
        if (hasLocked || !isGeneral) return;
        
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(q => q !== id);
            if (prev.length >= war.war_format) return prev; // max reached
            return [...prev, id];
        });
    };

    const lockInPicks = async () => {
        if (selectedIds.length !== war.war_format) return;
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
                body: JSON.stringify({ war_id: warId, question_ids: selectedIds })
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setHasLocked(true);
            }
        } catch (err: any) {
            setError("Failed to lock in picks.");
        } finally {
            setLocking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 pb-20">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                <h2 className="text-xl font-bold animate-pulse">Loading War Preparation...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-500">Access Denied</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to War Room</button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-8 md:pt-12 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-32 left-1/4 w-[34rem] h-[34rem] rounded-full bg-amber-400/10 dark:bg-amber-500/10 blur-3xl mix-blend-overlay" />
            
            <div className="max-w-6xl mx-auto px-6 mb-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" /> PREPARATION PHASE
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-2">Draft Your Artillery</h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl">
                            Select exactly <strong className="text-slate-900 dark:text-white px-1">{war.war_format} questions</strong> from the vault. 
                            These chosen questions will be presented to the opposing faction to solve. They are doing the same to you.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl min-w-[250px]">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Payload Selected</span>
                            <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-500">{selectedIds.length} / {war.war_format}</span>
                        </div>
                        {hasLocked ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5" /> Locked & Loaded
                            </div>
                        ) : (
                            <button 
                                onClick={lockInPicks}
                                disabled={selectedIds.length !== war.war_format || locking || !isGeneral}
                                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95"
                            >
                                {locking ? "Locking..." : "Assign Questions to Foe"} <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        {!isGeneral && !hasLocked && (
                            <div className="text-center text-xs text-red-500 font-bold mt-2">Only the General can lock in the draft.</div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 relative z-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {questions.map(q => {
                    const isSelected = selectedIds.includes(q.id);
                    return (
                        <div 
                            key={q.id}
                            onClick={() => toggleQuestion(q.id)}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group
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
