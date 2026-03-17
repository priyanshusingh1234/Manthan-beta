"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Target, AlertCircle, Search, Zap, Swords, Crown, User, AlertTriangle } from "lucide-react";

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

    useEffect(() => {
        let timerId: NodeJS.Timeout;

        const fetchBattleData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`/api/war/battle?war_id=${warId}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                
                if (data.error === 'MISSING_TABLE') {
                     setError("Database Schema Missing: Ask the General or Admin to run the war migration SQL script.");
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
            } catch (err: any) {
                setError("Failed to load battle data.");
            } finally {
                setLoading(false);
            }
        };

        fetchBattleData();

        // High frequency polling during active war
        timerId = setInterval(() => {
             fetchBattleData();
        }, 5000);

        return () => clearInterval(timerId);
    }, [warId, router]);

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
                <h1 className="text-2xl font-black mb-2 text-red-600 dark:text-red-500">Battlefield Comm Error</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to War Room</button>
            </div>
        );
    }

    if (waitingOnOpponent) {
        return (
             <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Search className="w-16 h-16 text-amber-500 mb-4 animate-spin-slow" />
                <h1 className="text-2xl font-black mb-2 text-amber-600 dark:text-amber-500">Awaiting Foe's Picks</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">The opposing General has not yet locked in their drafted payload. You cannot see the battlefield until they verify their questions.</p>
                <button onClick={() => router.push('/war')} className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-xl font-bold">Return to Base</button>
            </div>
        );
    }

    const myScore = war.challenger_school_id === mySchoolId ? war.challenger_score : war.defender_score;
    const opponentScore = war.challenger_school_id === opponentSchoolId ? war.challenger_score : war.defender_score;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 relative overflow-hidden">
            {/* Visual Indicators */}
            <div className={`pointer-events-none absolute top-0 left-0 w-[50vw] h-64 blur-3xl mix-blend-overlay transition-colors ${war.status === 'calculating' ? 'bg-fuchsia-500/20' : 'bg-red-500/20'}`} />
            <div className={`pointer-events-none absolute bottom-0 right-0 w-[50vw] h-64 blur-3xl mix-blend-overlay transition-colors ${war.status === 'calculating' ? 'bg-fuchsia-600/10' : 'bg-orange-500/10'}`} />
            
            <header className={`py-6 sm:py-10 px-6 border-b z-20 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ${war.status === 'calculating' ? 'border-fuchsia-200 dark:border-fuchsia-500/30' : 'border-red-200 dark:border-red-500/30'}`}>
                <div className="max-w-6xl mx-auto flex flex-col items-center">
                    <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 animate-pulse flex items-center gap-2 ${war.status === 'calculating' ? 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400' : war.status === 'completed' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'}`}>
                        {war.status === 'active' ? <Swords className="w-3 h-3" /> : war.status === 'calculating' ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                        {war.status === 'active' ? 'WAR IS LIVE' : war.status === 'calculating' ? 'CALCULATING RESULTS' : 'COMBAT ENDED'}
                    </div>

                    <div className="flex items-center gap-4 sm:gap-12 w-full justify-center">
                        <div className="text-center w-1/3">
                             <div className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white drop-shadow-md">{myScore}</div>
                             <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-2">Your Squad</div>
                        </div>
                        
                        <div className="text-center">
                             <div className="text-sm font-bold text-slate-400">VS</div>
                        </div>

                        <div className="text-center w-1/3">
                             <div className="text-4xl sm:text-6xl font-black text-red-600 dark:text-red-500 drop-shadow-md">{opponentScore}</div>
                             <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-2">Opponent</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 relative z-10 grid lg:grid-cols-3 gap-8">
                {/* Available Targets (Questions) */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Target className="w-5 h-5 text-red-500" /> Incoming Payload Targets
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        {questions.map(q => {
                            // Find out if any ally correctly answered this already
                            const correctSub = submissions.find(s => s.question_id === q.id && s.school_id === mySchoolId && s.status === 'correct');
                            const totalAttempts = submissions.filter(s => s.question_id === q.id && s.school_id === mySchoolId).length;

                            return (
                                <div key={q.id} className={`p-5 rounded-2xl border-2 transition-all ${correctSub ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-lg'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            {q.subject || 'General'}
                                        </span>
                                        <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                            {q.points || 0} pts
                                        </div>
                                    </div>
                                    <h4 className={`font-bold text-lg leading-tight mb-4 ${correctSub ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-slate-900 dark:text-white'}`}>
                                        {q.title}
                                    </h4>

                                    {correctSub ? (
                                        <div className="mt-4 text-sm font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Secured by {correctSub.profiles?.name || 'an ally'}
                                        </div>
                                    ) : (
                                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                                             <div className="text-xs text-slate-500 font-bold">Attempts: {totalAttempts}</div>
                                             {war.status === 'active' ? (
                                                <button onClick={() => router.push(`/war-battle/${warId}/solve/${q.id}`)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md shadow-red-500/20 transition-transform active:scale-95">
                                                    Engage Target
                                                </button>
                                             ) : (
                                                <button disabled className="bg-slate-200 dark:bg-slate-800 text-slate-400 px-4 py-2 rounded-lg font-bold text-xs">
                                                    Locked
                                                </button>
                                             )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Submissions Feed */}
                <div className="space-y-6">
                     <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Zap className="w-5 h-5 text-indigo-500" /> Live Feed
                    </h3>
                    
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                         {submissions.length === 0 ? (
                             <div className="text-center text-slate-500 py-10 font-bold text-sm">No shots fired yet.</div>
                         ) : (
                             <div className="space-y-3">
                                  {submissions.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(sub => {
                                      const isAlly = sub.school_id === mySchoolId;
                                      return (
                                          <div key={sub.id} className={`p-3 rounded-xl border flex gap-3 text-sm ${isAlly ? 'bg-indigo-50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20' : 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20'}`}>
                                              <div className={`mt-0.5 flex-shrink-0 ${isAlly ? 'text-indigo-500' : 'text-red-500'}`}>
                                                   {sub.status === 'pending_check' ? <Search className="w-4 h-4 animate-spin-slow" /> : 
                                                    sub.status === 'correct' ? <Shield className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-slate-900 dark:text-white">
                                                      {sub.profiles?.name || 'A soldier'} 
                                                      <span className="text-slate-500 dark:text-slate-400 font-normal"> submitted an answer.</span>
                                                  </div>
                                                  <div className={`text-xs mt-1 font-bold ${sub.status === 'pending_check' ? 'text-amber-500' : sub.status === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                                                      {sub.status === 'pending_check' ? 'Awaiting AI Check...' : sub.status === 'correct' ? `+${sub.points_awarded || 0} POINTS` : 'Target Missed!'}
                                                  </div>
                                              </div>
                                          </div>
                                      )
                                  })}
                             </div>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}
