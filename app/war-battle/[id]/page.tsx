"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
    Shield, Target, AlertCircle, Search, Zap, Swords, Crown,
    AlertTriangle, Clock, Star, CheckCircle2, XCircle, User, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Live countdown ─────────────────────────────── */
function useWarTimer(endsAt: string | null) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!endsAt) return;
        const tick = () => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("00:00"); setIsUrgent(true); return; }
            const totalSecs = Math.floor(diff / 1000);
            setIsUrgent(totalSecs < 120);
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endsAt]);

    return { timeLeft, isUrgent };
}

/* ── Avatar ─────────────────────────────────────── */
function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
    const sz = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover border-2 border-white/20 shadow-md`} />;
    return (
        <div className={`${sz} rounded-full flex items-center justify-center font-black shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-white/20`}>
            {name?.[0]?.toUpperCase() || "?"}
        </div>
    );
}

/* ── Question Card ──────────────────────────────── */
function QuestionCard({ q, isMine, sub, warStatus, warId, router }: any) {
    const correct = sub?.find((s: any) => s.question_id === q.id && s.status === "correct");
    const attempts = sub?.filter((s: any) => s.question_id === q.id).length || 0;
    const secured = !!correct;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300
                ${secured
                    ? "border-green-400/50 bg-green-50/80 dark:bg-green-900/20"
                    : isMine
                        ? "border-indigo-300/60 dark:border-indigo-500/40 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60"
                }`}
        >
            {secured && (
                <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
            )}

            {/* Difficulty stripe */}
            <div className={`h-1 w-full ${q.difficulty === "hard" ? "bg-red-500" : q.difficulty === "medium" || q.difficulty === "moderate" ? "bg-amber-400" : "bg-green-400"}`} />

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {q.subject || "General"}
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0">
                        <Zap className="w-3 h-3" />{q.points || 0}
                    </span>
                </div>

                <p className={`text-sm font-bold leading-snug mb-4 line-clamp-2 ${secured ? "line-through text-green-700 dark:text-green-400 opacity-70" : "text-slate-800 dark:text-white"}`}>
                    {q.title}
                </p>

                {secured ? (
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Secured! +{correct.points_awarded || q.points} pts
                    </div>
                ) : isMine && warStatus === "active" ? (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{attempts} attempt{attempts !== 1 ? "s" : ""}</span>
                        <button
                            onClick={() => router.push(`/war-battle/${warId}/solve/${q.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/30 flex items-center gap-1.5"
                        >
                            <Target className="w-3.5 h-3.5" /> Attack
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        {isMine ? (
                            warStatus !== "active" ? <><Shield className="w-3 h-3" /> Locked</> : null
                        ) : (
                            <><Target className="w-3 h-3 text-red-400" /> Enemy target</>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Member Row ─────────────────────────────────── */
function MemberRow({ member, submissions, schoolId }: { member: any; submissions: any[]; schoolId: string }) {
    const correct = submissions.filter(s => s.student_id === member.id && s.school_id === schoolId && s.status === "correct").length;
    const total = submissions.filter(s => s.student_id === member.id && s.school_id === schoolId).length;
    return (
        <div className="flex items-center gap-2 py-1.5">
            <Avatar name={member.name} avatar={member.avatar} size="sm" />
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{member.name}</div>
                <div className="text-xs text-slate-400">{member.points.toLocaleString()} pts</div>
            </div>
            {total > 0 && (
                <div className="flex items-center gap-1 text-xs font-black">
                    <span className="text-green-500">{correct}✓</span>
                    {total - correct > 0 && <span className="text-red-400">{total - correct}✗</span>}
                </div>
            )}
        </div>
    );
}

/* ── Main Page ──────────────────────────────────── */
export default function WarBattleDashboard() {
    const params = useParams();
    const router = useRouter();
    const warId = params.id as string;

    const [war, setWar] = useState<any>(null);
    const [myQuestions, setMyQuestions] = useState<any[]>([]);
    const [opponentQuestions, setOpponentQuestions] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [mySchoolId, setMySchoolId] = useState("");
    const [opponentSchoolId, setOpponentSchoolId] = useState("");
    const [mySchoolName, setMySchoolName] = useState("Your School");
    const [opponentSchoolName, setOpponentSchoolName] = useState("Opponent");
    const [myMembers, setMyMembers] = useState<any[]>([]);
    const [opponentMembers, setOpponentMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waitingOnOpponent, setWaitingOnOpponent] = useState(false);

    const { timeLeft, isUrgent } = useWarTimer(war?.ends_at ?? null);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        try {
            const res = await fetch(`/api/war/battle?war_id=${warId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
                cache: "no-store",
            });
            const data = await res.json();

            if (data.error === "MISSING_TABLE") { setError("Run the war SQL setup script first."); setLoading(false); return; }
            if (data.error) { setError(data.error); setLoading(false); return; }

            setWar(data.war);
            setMyQuestions(data.myQuestions || []);
            setOpponentQuestions(data.opponentQuestions || []);
            setSubmissions(data.submissions || []);
            setMySchoolId(data.mySchoolId);
            setOpponentSchoolId(data.opponentSchoolId);
            setMySchoolName(data.mySchoolName || "Your School");
            setOpponentSchoolName(data.opponentSchoolName || "Opponent");
            setMyMembers(data.challengerMembers || []);
            setOpponentMembers(data.defenderMembers || []);
            setWaitingOnOpponent(data.waitingOnOpponent);
        } catch {
            setError("Failed to load battlefield.");
        } finally {
            setLoading(false);
        }
    }, [warId, router]);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 4000);
        return () => clearInterval(id);
    }, [fetchData]);

    useEffect(() => {
        const onFocus = () => fetchData();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchData]);

    /* ── Derived scores ── */
    const myScore = submissions
        .filter(s => s.school_id === mySchoolId && s.status === "correct")
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
    const opponentScore = submissions
        .filter(s => s.school_id === opponentSchoolId && s.status === "correct")
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0);

    const mySecured = myQuestions.filter(q => submissions.some(s => s.question_id === q.id && s.school_id === mySchoolId && s.status === "correct")).length;
    const opponentSecured = opponentQuestions.filter(q => submissions.some(s => s.question_id === q.id && s.school_id === opponentSchoolId && s.status === "correct")).length;

    /* ── States ── */
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm font-bold animate-pulse">Loading battlefield...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-sm mx-auto px-4 py-20 text-center">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-red-600 dark:text-red-400 mb-2">Error</h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <button onClick={() => router.push("/war")} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold">War Room</button>
            </div>
        );
    }

    if (waitingOnOpponent) {
        return (
            <div className="max-w-sm mx-auto px-4 py-20 text-center">
                <Search className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-2">Awaiting Enemy Draft</h1>
                <p className="text-slate-500 mb-6">The opposing General hasn't locked questions yet. Refreshing every 4 seconds...</p>
                <button onClick={() => router.push("/war")} className="bg-slate-200 dark:bg-slate-800 px-6 py-2.5 rounded-xl font-bold">Return to Base</button>
            </div>
        );
    }

    const isLive = war?.status === "active";
    const isCalculating = war?.status === "calculating";
    const isCompleted = war?.status === "completed";

    // ── War ended results screen ──────────────────────
    if (isCompleted) {
        const iWon = war?.winner_school_id === mySchoolId;
        const isDraw = !war?.winner_school_id;
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="w-full max-w-md"
                >
                    {/* Result banner */}
                    <div className={`text-center p-8 rounded-3xl mb-4 border-2 ${iWon
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border-amber-300 dark:border-amber-500/40"
                        : isDraw
                            ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10 border-red-200 dark:border-red-500/30"
                        }`}>
                        <div className="text-6xl mb-4">{iWon ? "🏆" : isDraw ? "🤝" : "💀"}</div>
                        <h1 className={`text-4xl font-black mb-2 ${iWon ? "text-amber-600 dark:text-amber-400" : isDraw ? "text-slate-600 dark:text-slate-400" : "text-red-600 dark:text-red-400"}`}>
                            {iWon ? "VICTORY!" : isDraw ? "DRAW!" : "DEFEATED!"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
                            {iWon ? "+5 victory bonus awarded to your squad!" : isDraw ? "An honourable tie." : "The enemy destroyed you."}
                        </p>

                        {/* Final score */}
                        <div className="flex items-center justify-center gap-8">
                            <div className="text-center">
                                <div className={`text-5xl font-black tabular-nums ${iWon ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>{myScore}</div>
                                <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{mySchoolName}</div>
                            </div>
                            <div className="text-slate-400 font-black">:</div>
                            <div className="text-center">
                                <div className={`text-5xl font-black tabular-nums ${!iWon && !isDraw ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}>{opponentScore}</div>
                                <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{opponentSchoolName}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{mySecured}<span className="text-base text-slate-400">/{myQuestions.length}</span></div>
                            <div className="text-xs font-bold text-slate-500 mt-1">Targets Destroyed</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-red-500">{opponentSecured}<span className="text-base text-slate-400">/{opponentQuestions.length}</span></div>
                            <div className="text-xs font-bold text-slate-500 mt-1">Your Base Fell</div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/war")}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl text-lg transition-all hover:opacity-90 active:scale-95"
                    >
                        Return to War Room
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100 pb-24 relative overflow-x-hidden">

            {/* ─── Ambient background ───────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/10 dark:bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            {/* ─── War Status Bar ───────────────────────── */}
            <div className={`relative z-10 w-full border-b backdrop-blur-md py-4 px-4 ${isLive
                ? "bg-gradient-to-r from-indigo-900/80 via-slate-900/80 to-red-900/80 dark:from-indigo-950/90 dark:to-red-950/90 border-indigo-700/30"
                : isCalculating
                    ? "bg-gradient-to-r from-fuchsia-900/80 to-slate-900/80 border-fuchsia-700/30"
                    : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"
                }`}>
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isLive
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                        : isCalculating
                            ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300"
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                        {isLive ? <Flame className="w-3 h-3 text-orange-400" /> : isCalculating ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                        <span className={isLive ? "animate-pulse" : ""}>{isLive ? "⚔️ WAR IS LIVE" : isCalculating ? "🔮 CALCULATING" : "🏆 COMPLETED"}</span>
                    </div>

                    {(isLive || isCalculating) && timeLeft && (
                        <div className={`flex items-center gap-2 font-mono font-black text-2xl px-4 py-1.5 rounded-full border ${isUrgent
                            ? "border-red-500 text-red-400 bg-red-500/10 animate-pulse"
                            : isLive
                                ? "border-white/20 text-white bg-white/10"
                                : "border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10"
                            }`}>
                            <Clock className="w-5 h-5" />
                            {timeLeft}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Scoreboard ───────────────────────────── */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 mt-6">
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm">
                    <div className="grid grid-cols-3 items-center gap-4">
                        {/* My Team */}
                        <div className="text-center">
                            <div className="flex flex-col items-center gap-2 mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <div className="font-black text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{mySchoolName}</div>
                            </div>
                            <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">{myScore}</div>
                            <div className="text-xs text-slate-500 mt-2">{mySecured}/{myQuestions.length} secured</div>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30">
                                    <Swords className="w-8 h-8 text-white" />
                                </div>
                                {isLive && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />}
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">vs</span>
                        </div>

                        {/* Opponent */}
                        <div className="text-center">
                            <div className="flex flex-col items-center gap-2 mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                                <div className="font-black text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{opponentSchoolName}</div>
                            </div>
                            <div className="text-6xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{opponentScore}</div>
                            <div className="text-xs text-slate-500 mt-2">{opponentSecured}/{opponentQuestions.length} secured</div>
                        </div>
                    </div>

                    {/* Progress bars */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex rounded-full h-3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            {(myScore + opponentScore) > 0 ? (
                                <>
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700"
                                        style={{ width: `${(myScore / (myScore + opponentScore)) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                                        style={{ width: `${(opponentScore / (myScore + opponentScore)) * 100}%` }}
                                    />
                                </>
                            ) : (
                                <div className="h-full w-full bg-gradient-to-r from-indigo-300 to-red-300 opacity-20" />
                            )}
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-slate-400 font-bold">
                            <span>🔵 {mySchoolName}</span>
                            <span>{opponentSchoolName} 🔴</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Main Battlefield ─────────────────────── */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 mt-6 grid lg:grid-cols-2 gap-6">

                {/* LEFT — My Questions (I attack) */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4" />
                        </div>
                        <h2 className="font-black text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Attack These (Enemy's Questions)</h2>
                        <span className="ml-auto text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                            {mySecured}/{myQuestions.length} destroyed
                        </span>
                    </div>

                    {myQuestions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-bold">Waiting for enemy to draft questions...</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {myQuestions.map(q => (
                                <QuestionCard
                                    key={q.id}
                                    q={q}
                                    isMine={true}
                                    sub={submissions}
                                    warStatus={war?.status}
                                    warId={warId}
                                    router={router}
                                />
                            ))}
                        </div>
                    )}

                    {/* My Squad Roster */}
                    {myMembers.length > 0 && (
                        <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Your Squad
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {myMembers.map(m => (
                                    <MemberRow key={m.id} member={m} submissions={submissions} schoolId={mySchoolId} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — Opponent's Questions (what they attack) */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4" />
                        </div>
                        <h2 className="font-black text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Your Side's Questions (Enemy Attacks These)</h2>
                        <span className="ml-auto text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                            {opponentSecured}/{opponentQuestions.length} enemy secured
                        </span>
                    </div>

                    {opponentQuestions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-bold">Enemy questions not drafted yet...</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {opponentQuestions.map(q => {
                                const secured = submissions.some(s => s.question_id === q.id && s.school_id === opponentSchoolId && s.status === "correct");
                                return (
                                    <div key={q.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${secured ? "border-red-400/50 bg-red-50/80 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60"}`}>
                                        <div className={`h-1 w-full ${q.difficulty === "hard" ? "bg-red-500" : q.difficulty === "medium" ? "bg-amber-400" : "bg-green-400"}`} />
                                        <div className="p-4">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase tracking-wide">{q.subject || "General"}</span>
                                                <span className="text-xs font-black text-amber-500 flex items-center gap-0.5"><Zap className="w-3 h-3" />{q.points}</span>
                                            </div>
                                            <p className={`text-sm font-bold leading-snug line-clamp-2 ${secured ? "line-through text-red-600 dark:text-red-400 opacity-60" : "text-slate-700 dark:text-slate-300"}`}>{q.title}</p>
                                            {secured && <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Enemy secured this</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Opponent Roster */}
                    {opponentMembers.length > 0 && (
                        <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Enemy Roster
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {opponentMembers.map(m => (
                                    <MemberRow key={m.id} member={m} submissions={submissions} schoolId={opponentSchoolId} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Live Feed ────────────────────────────── */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 mt-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Live Battle Feed
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            LIVE
                        </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {submissions.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-6 font-bold">No shots fired yet. Be the first!</p>
                        ) : (
                            [...submissions]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(sub => {
                                    const isAlly = sub.school_id === mySchoolId;
                                    return (
                                        <div key={sub.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${isAlly ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                                            <div className={`shrink-0 ${isAlly ? "text-indigo-500" : "text-red-400"}`}>
                                                {sub.status === "pending_check" ? <Search className="w-4 h-4 animate-spin" /> :
                                                    sub.status === "correct" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`font-bold ${isAlly ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}`}>
                                                    {isAlly ? "🔵 Ally" : "🔴 Enemy"}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400 ml-1.5">fired a shot</span>
                                            </div>
                                            <div className={`text-xs font-black shrink-0 ${sub.status === "pending_check" ? "text-amber-500" : sub.status === "correct" ? "text-green-500" : "text-red-500"}`}>
                                                {sub.status === "pending_check" ? "⏳ Checking" : sub.status === "correct" ? `✓ +${sub.points_awarded || 0}pts` : "✗ Miss"}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Bonus Info Card ──────────────────────── */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 mt-4">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-amber-800 dark:text-amber-300">Scoring Rules:</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-amber-700 dark:text-amber-400 font-medium text-xs">
                        <span>✓ Correct → question points</span>
                        <span>✗ Wrong → −(points÷5) penalty</span>
                        <span>🏆 All correct → +5 bonus</span>
                        <span>⚔️ Win war → +5 bonus</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
