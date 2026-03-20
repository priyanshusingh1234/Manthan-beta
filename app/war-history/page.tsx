"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Swords, Clock, Target, Users, Search, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";

function WarHistoryContent() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get("schoolId");
    
    const [wars, setWars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!schoolId) {
            setLoading(false);
            return;
        }
        
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/war/history?schoolId=${schoolId}`);
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
        fetchHistory();
    }, [schoolId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!schoolId) {
        return (
            <div className="text-center py-20">
                <Shield className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <h2 className="text-xl font-black mb-2">School ID missing</h2>
                <Link href="/my-school" className="text-indigo-600 font-bold hover:underline">Return to Faction</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slideUp">
            {wars.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Search className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <h2 className="text-xl font-black mb-2">No Wars Fought Yet</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Your faction has not engaged in any battles. Head to the War Room to declare your first war!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {wars.map((war) => {
                        const isChallenger = war.challenger_school_id === schoolId;
                        const mySchoolName = isChallenger ? war.challenger_school?.name : war.defender_school?.name;
                        const opponentName = isChallenger ? war.defender_school?.name : war.challenger_school?.name;
                        const myScore = isChallenger ? war.challenger_score : war.defender_score;
                        const oppScore = isChallenger ? war.defender_score : war.challenger_score;
                        
                        const isLive = war.status === 'active' || war.status === 'preparation' || war.status === 'calculating';
                        
                        // Output win / loss
                        let resultBadge = null;
                        if (war.status === 'completed') {
                            if (war.winner_school_id === schoolId) {
                                resultBadge = <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">Victory</span>;
                            } else if (war.winner_school_id) {
                                resultBadge = <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">Defeated</span>;
                            } else {
                                resultBadge = <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">Draw</span>;
                            }
                        } else {
                            resultBadge = <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg animate-pulse shadow-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Live</span>;
                        }

                        // Format date nicely natively
                        const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(war.created_at));

                        return (
                            <Link href={`/war-battle/${war.id}`} key={war.id} className="block group">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {resultBadge}
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                <Calendar className="w-3.5 h-3.5" /> 
                                                {formattedDate}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-lg font-black mb-1">
                                            <span className="truncate max-w-[120px] sm:max-w-[200px]">{mySchoolName}</span>
                                            <span className="text-slate-300 dark:text-slate-700 text-sm italic font-bold">VS</span>
                                            <span className="truncate text-slate-600 dark:text-slate-300 max-w-[120px] sm:max-w-[200px]">{opponentName || "Unknown Faction"}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2 mt-2">
                                            <Swords className="w-3.5 h-3.5" /> Match ID: {war.id.split('-')[0]}
                                        </p>
                                    </div>

                                    <div className="flex items-stretch justify-between sm:justify-end gap-0 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 mt-2 sm:mt-0">
                                        <div className={`px-5 py-3 text-center transition-colors ${!isLive && war.winner_school_id === schoolId ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">Your Points</div>
                                            <div className={`text-2xl font-black font-mono leading-none ${!isLive && war.winner_school_id === schoolId ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {myScore || 0}
                                            </div>
                                        </div>
                                        <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                                        <div className={`px-5 py-3 text-center transition-colors ${!isLive && war.winner_school_id !== schoolId && war.winner_school_id ? 'bg-red-50 dark:bg-red-500/10' : ''}`}>
                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">Enemy Points</div>
                                            <div className={`text-xl font-black font-mono leading-none flex items-center h-full pt-0.5 ${!isLive && war.winner_school_id !== schoolId && war.winner_school_id ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-500'}`}>
                                                {oppScore || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export default function WarHistoryPage() {
    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-8 sm:pt-12 pb-24 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/my-school" className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">War History</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Review your faction's past battles and strategic victories.</p>
                    </div>
                </div>

                <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                    <WarHistoryContent />
                </Suspense>
            </div>
        </div>
    );
}
