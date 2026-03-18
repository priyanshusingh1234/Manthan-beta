"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Shield, Users, Swords, Crown, Target, ChevronLeft, Globe, Award, Calendar, Handshake, CheckBadge, CheckCircle, Search } from "lucide-react";
import Link from "next/link";

export default function PublicSchoolPage() {
    const params = useParams();
    const router = useRouter();
    const schoolId = params.id as string;

    const [session, setSession] = useState<any>(null);
    const [mySchoolId, setMySchoolId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [warHistory, setWarHistory] = useState<any[]>([]);
    
    const [joinError, setJoinError] = useState("");
    // Join actions
    const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'requested'>('idle');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession?.user?.user_metadata?.school_id) {
                setMySchoolId(currentSession.user.user_metadata.school_id);
            }
        });

        const fetchAll = async () => {
            if (!schoolId) return;
            try {
                const [schoolRes, historyRes] = await Promise.all([
                    fetch(`/api/schools/${schoolId}`),
                    fetch(`/api/war/history?schoolId=${schoolId}`)
                ]);

                if (schoolRes.ok) {
                    const data = await schoolRes.json();
                    setSchoolInfo(data);
                }
                
                if (historyRes.ok) {
                    const hData = await historyRes.json();
                    setWarHistory(hData.wars || []);
                }
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [schoolId]);

    const handleJoinRequest = async () => {
        if (!session) {
            router.push('/login');
            return;
        }

        setJoinStatus('loading');
        setJoinError('');
        try {
            const res = await fetch('/api/schools/join', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'request', schoolId: schoolInfo?.school?.id })
            });
            const data = await res.json();
            
            if (res.ok) {
                setJoinStatus('requested');
            } else {
                setJoinStatus('idle');
                setJoinError(data.error || 'Failed to send request.');
            }
        } catch (e) {
            setJoinStatus('idle');
            setJoinError('Network error during request.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-24">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!schoolInfo?.school) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Shield className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
                <h1 className="text-3xl font-black mb-2">Faction Not Found</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">The school or faction you are looking for does not exist or has been disbanded.</p>
                <Link href="/top-schools" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Back to Leaderboards</Link>
            </div>
        );
    }

    const { school, members } = schoolInfo;
    const isMySchool = mySchoolId === school.id;
    const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(school.createdAt));

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-10">
            {/* Background Decor */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-900/10 to-transparent pointer-events-none" />
            
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                
                {/* Back Link */}
                <div className="mb-6">
                    <Link href="/top-schools" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Leaderboards
                    </Link>
                </div>

                {/* Hero / Banner Area */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/40 dark:shadow-none mb-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        
                        {/* School Identity */}
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 text-white border-4 border-white dark:border-slate-800">
                                <Shield className="w-12 h-12 sm:w-16 sm:h-16 opacity-90" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-5xl font-black mb-2 tracking-tight">{school.name}</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium flex-wrap flex gap-4 items-center mb-3">
                                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global Rank #{school.rank}</span>
                                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {school.memberCount} Soldiers</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Founded {formattedDate}</span>
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 max-w-xl text-sm leading-relaxed hidden sm:block">
                                    A premier faction on Dheeyudha dedicated to commanding intelligence and dominating the war room. They currently rank #{school.rank} in the world with a battle-hardened squad of {school.memberCount} members.
                                </p>
                            </div>
                        </div>

                        {/* Call to Action Column */}
                        <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-black px-6 py-3 rounded-2xl flex items-center gap-3 text-2xl shadow-sm mb-2 w-full justify-center md:w-auto">
                                <Award className="w-6 h-6" /> {school.points.toLocaleString()} PTS
                            </div>
                            
                            {isMySchool ? (
                                <Link href="/my-school" className="w-full text-center bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:border-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    <Shield className="w-5 h-5" /> Enter Base
                                </Link>
                            ) : (
                                <button 
                                    onClick={handleJoinRequest}
                                    disabled={joinStatus !== 'idle'}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {joinStatus === 'loading' ? 'Sending Request...' : 
                                     joinStatus === 'requested' ? <><CheckCircle className="w-5 h-5" /> Request Sent</> : 
                                     <><Handshake className="w-5 h-5" /> Request to Join</>}
                                </button>
                            )}
                            {joinError && <p className="text-red-500 text-xs font-bold w-full text-center mt-1">{joinError}</p>}
                        </div>

                    </div>
                    {/* Mobile description */}
                    <p className="text-slate-600 dark:text-slate-300 mt-6 text-sm leading-relaxed sm:hidden relative z-10">
                        A premier faction on Dheeyudha dedicated to commanding intelligence and dominating the war room. They currently rank #{school.rank} in the world with a battle-hardened squad of {school.memberCount} members.
                    </p>
                </div>

                {/* Grid Layout: Roster & War History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Active Roster */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" /> Active Roster
                            </h2>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none divide-y divide-slate-100 dark:divide-slate-800/50">
                            {members?.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 font-medium">No soldiers have enlisted yet.</div>
                            ) : (
                                members?.map((m: any, i: number) => (
                                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold flex items-center gap-2 text-base text-slate-900 dark:text-white">
                                                    {m.name}
                                                    {m.role === 'General' && <Crown className="w-4 h-4 text-amber-500 ml-1" />}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{m.role} • Lvl {m.classGrade}</div>
                                            </div>
                                        </div>
                                        <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                            {m.points.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* War History Board */}
                    <div className="space-y-6 flex flex-col h-full items-stretch">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Swords className="w-6 h-6 text-rose-500 dark:text-rose-400" /> War History
                            </h2>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/30 dark:shadow-none flex-1 flex flex-col overflow-hidden max-h-[600px] overflow-y-auto">
                            {warHistory.length === 0 ? (
                                <div className="text-center py-16 my-auto">
                                    <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">This faction has not engaged in any wars yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {warHistory.map((war) => {
                                        const isChallenger = war.challenger_school_id === school.id;
                                        const opponentName = isChallenger ? war.defender_school?.name : war.challenger_school?.name;
                                        const isLive = war.status === 'active' || war.status === 'preparation' || war.status === 'calculating';
                                        
                                        let resultBadge = null;
                                        if (war.status === 'completed') {
                                            if (war.winner_school_id === school.id) {
                                                resultBadge = <span className="text-emerald-600 dark:text-emerald-400 font-black">W</span>;
                                            } else if (war.winner_school_id) {
                                                resultBadge = <span className="text-red-500 font-black">L</span>;
                                            } else {
                                                resultBadge = <span className="text-slate-400 font-black">D</span>;
                                            }
                                        } else {
                                            resultBadge = <span className="text-amber-500 font-black animate-pulse">●</span>;
                                        }

                                        const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric'}).format(new Date(war.created_at));

                                        return (
                                            <div key={war.id} className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-lg shadow-sm">
                                                        {resultBadge}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold flex items-center gap-2 text-sm">
                                                            <span className="text-slate-400 text-xs italic">vs</span> {opponentName || "Unknown"}
                                                        </div>
                                                        <div className="text-xs font-semibold text-slate-400 mt-0.5">{dateLabel}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg w-full sm:w-auto mt-2 sm:mt-0 shadow-sm shrink-0">
                                                    <div className="px-3 text-center">
                                                        <div className="text-[10px] text-slate-400 uppercase font-bold text-center w-full">Us</div>
                                                        <div className={`font-mono font-black ${war.status === 'completed' && war.winner_school_id === school.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                                            {isChallenger ? war.challenger_score : war.defender_score}
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
                                                    <div className="px-3 text-center">
                                                        <div className="text-[10px] text-slate-400 uppercase font-bold text-center w-full">Them</div>
                                                        <div className={`font-mono font-black ${war.status === 'completed' && war.winner_school_id && war.winner_school_id !== school.id ? 'text-red-500 dark:text-red-400' : ''}`}>
                                                            {!isChallenger ? war.challenger_score : war.defender_score}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
