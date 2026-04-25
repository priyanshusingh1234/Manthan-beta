'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Swords, Clock, CheckCircle, XCircle, Trophy, Loader2, ArrowLeft, Timer, Shield, Flame } from 'lucide-react';

type DuelStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';

function PlayerAvatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs';
    if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover border-2 border-white shadow`} />;
    return <div className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black flex items-center justify-center border-2 border-white shadow`}>{name?.[0]?.toUpperCase()}</div>;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [remaining, setRemaining] = useState('');
    useEffect(() => {
        const tick = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) { setRemaining('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);
    return <span>{remaining}</span>;
}

export default function DuelRoomPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [startTime] = useState<number>(Date.now());
    const [submitted, setSubmitted] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchDuel = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        const res = await fetch(`/api/duel/${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        setData(json);
        setLoading(false);
    }, [id, router]);

    useEffect(() => {
        fetchDuel();
        // Poll every 4s while waiting for opponent
        pollRef.current = setInterval(fetchDuel, 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchDuel]);

    // Stop polling when completed
    useEffect(() => {
        if (data?.duel?.status === 'completed' || data?.duel?.status === 'rejected' || data?.duel?.status === 'expired') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
    }, [data?.duel?.status]);

    const doAction = async (action: string, extra: object = {}) => {
        setActing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/duel/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ action, ...extra }),
            });
            const json = await res.json();
            if (res.ok) await fetchDuel();
            else alert(json.error || 'Action failed');
        } finally { setActing(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="text-center space-y-3">
                <p className="text-2xl font-black">Duel not found</p>
                <button onClick={() => router.back()} className="text-orange-400 text-sm font-bold">← Go back</button>
            </div>
        </div>
    );

    const { duel, question, challenger, challenged, currentUserId } = data;
    const iChallenger = currentUserId === challenger.id;
    const me = iChallenger ? challenger : challenged;
    const opponent = iChallenger ? challenged : challenger;
    const myAnswer = iChallenger ? duel.challengerAnswer : duel.challengedAnswer;
    const iAmChallenged = currentUserId === challenged.id;
    const options: string[] = Array.isArray(question?.options) ? question.options : (typeof question?.options === 'string' ? JSON.parse(question.options) : []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-red-600 px-4 pt-12 pb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent" />
                <button onClick={() => router.back()} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold mb-4 relative">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* VS Banner */}
                <div className="flex items-center justify-between relative">
                    <div className="text-center flex-1">
                        <PlayerAvatar name={challenger.name} avatar={challenger.avatar} size="lg" />
                        <p className="font-black text-sm mt-2 truncate">{challenger.name.split(' ')[0]}</p>
                        {iChallenger && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                    </div>

                    <div className="flex flex-col items-center gap-1 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Swords className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-xl">VS</span>
                    </div>

                    <div className="text-center flex-1">
                        <PlayerAvatar name={challenged.name} avatar={challenged.avatar} size="lg" />
                        <p className="font-black text-sm mt-2 truncate">{challenged.name.split(' ')[0]}</p>
                        {!iChallenger && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                    </div>
                </div>

                {/* Status & Timer */}
                <div className="flex items-center justify-center gap-2 mt-4 relative">
                    {duel.status === 'pending' && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            Expires in <CountdownTimer expiresAt={duel.expiresAt} />
                        </div>
                    )}
                    {duel.status === 'accepted' && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold">
                            <Flame className="w-3.5 h-3.5 text-yellow-300" /> DUEL ACTIVE
                        </div>
                    )}
                    {duel.status === 'completed' && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold">
                            <Trophy className="w-3.5 h-3.5 text-yellow-300" /> COMPLETED
                        </div>
                    )}
                </div>

                {/* Taunt */}
                {duel.message && (
                    <div className="mt-3 text-center text-sm text-white/80 font-semibold italic">
                        &ldquo;{duel.message}&rdquo;
                    </div>
                )}
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

                {/* ── PENDING: challenged party sees accept/reject ── */}
                {duel.status === 'pending' && iAmChallenged && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 space-y-4 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <Swords className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">You've been challenged!</h2>
                            <p className="text-slate-400 text-sm mt-1">{challenger.name} wants to duel you on this question.</p>
                        </div>
                        <div className="bg-slate-900/60 rounded-2xl p-4 text-sm font-semibold text-left">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Question</p>
                            <p className="text-white">{question?.title}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => doAction('reject')} disabled={acting}
                                className="flex-1 py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 text-red-400" /> Reject</>}
                            </button>
                            <button onClick={() => doAction('accept')} disabled={acting}
                                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Accept Duel</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PENDING: challenger waits ── */}
                {duel.status === 'pending' && !iAmChallenged && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 text-center space-y-3">
                        <Loader2 className="w-10 h-10 mx-auto animate-spin text-orange-400" />
                        <p className="font-bold text-lg">Waiting for {challenged.name.split(' ')[0]}...</p>
                        <p className="text-slate-400 text-sm">They have until <CountdownTimer expiresAt={duel.expiresAt} /> to respond.</p>
                    </div>
                )}

                {/* ── ACTIVE: show the question ── */}
                {duel.status === 'accepted' && (
                    <div className="space-y-4">
                        {/* Opponent status */}
                        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <PlayerAvatar name={opponent.name} avatar={opponent.avatar} size="sm" />
                                <span className="text-sm font-bold">{opponent.name.split(' ')[0]}</span>
                            </div>
                            {opponent.hasAnswered
                                ? <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Answered</span>
                                : <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Thinking...</span>
                            }
                        </div>

                        {/* Question */}
                        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-1 bg-orange-500/20 text-orange-300 rounded-lg">{question?.subject}</span>
                                {question?.difficulty && <span className="text-xs font-bold text-slate-400">{question.difficulty}</span>}
                            </div>
                            <h3 className="font-black text-lg leading-snug">{question?.title}</h3>
                            {question?.body && <p className="text-slate-300 text-sm">{question.body}</p>}
                        </div>

                        {/* Answer options */}
                        {!submitted ? (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">Choose your answer — first and only chance!</p>
                                {options.map((opt, i) => (
                                    <button key={i} onClick={() => setSelectedAnswer(i)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${selectedAnswer === i ? 'border-orange-500 bg-orange-500/20 text-white' : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500'}`}>
                                        <span className="font-black mr-3 text-orange-400">{String.fromCharCode(65 + i)}.</span> {opt}
                                    </button>
                                ))}
                                {selectedAnswer !== null && (
                                    <button onClick={async () => {
                                        setSubmitted(true);
                                        const timeTaken = Date.now() - startTime;
                                        await doAction('answer', { answer: selectedAnswer, timeMs: timeTaken });
                                    }} disabled={acting}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-base shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-5 h-5" /> Lock In Answer</>}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center space-y-2">
                                <CheckCircle className="w-10 h-10 mx-auto text-emerald-400" />
                                <p className="font-black text-lg">Answer Locked In!</p>
                                <p className="text-slate-400 text-sm">Waiting for {opponent.name.split(' ')[0]} to answer...</p>
                                <Loader2 className="w-5 h-5 mx-auto animate-spin text-orange-400 mt-2" />
                            </div>
                        )}
                    </div>
                )}

                {/* ── COMPLETED ── */}
                {duel.status === 'completed' && (
                    <div className="space-y-4">
                        {/* Result hero */}
                        {duel.winnerId === null ? (
                            <div className="bg-slate-800/80 border border-slate-600 rounded-3xl p-8 text-center space-y-3">
                                <div className="text-5xl">🤝</div>
                                <h2 className="text-2xl font-black">It's a Draw!</h2>
                                <p className="text-slate-400">Both of you answered the same way.</p>
                            </div>
                        ) : duel.winnerId === currentUserId ? (
                            <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border border-yellow-500/40 rounded-3xl p-8 text-center space-y-3">
                                <div className="text-5xl">🏆</div>
                                <h2 className="text-2xl font-black text-yellow-300">You Won!</h2>
                                <p className="text-slate-300">You beat {opponent.name.split(' ')[0]}. Champion! 🎉</p>
                            </div>
                        ) : (
                            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-8 text-center space-y-3">
                                <div className="text-5xl">💀</div>
                                <h2 className="text-2xl font-black text-rose-400">You Lost!</h2>
                                <p className="text-slate-400">{opponent.name.split(' ')[0]} beat you this time. Rematch?</p>
                            </div>
                        )}

                        {/* Both answers breakdown */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 space-y-4">
                            <h3 className="font-black text-sm uppercase tracking-wide text-slate-400">Breakdown</h3>
                            {[challenger, challenged].map((p, pi) => {
                                const correct = pi === 0 ? duel.challengerCorrect : duel.challengedCorrect;
                                const ans = pi === 0 ? duel.challengerAnswer : duel.challengedAnswer;
                                const timeMs = pi === 0 ? duel.challengerTimeMs : duel.challengedTimeMs;
                                return (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <PlayerAvatar name={p.name} avatar={p.avatar} size="sm" />
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{p.name.split(' ')[0]} {p.id === currentUserId ? '(you)' : ''}</p>
                                            <p className="text-xs text-slate-400">{ans !== null ? `Answer: ${String.fromCharCode(65 + ans)}` : 'No answer'} {timeMs ? `· ${(timeMs / 1000).toFixed(1)}s` : ''}</p>
                                        </div>
                                        {correct
                                            ? <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Correct</span>
                                            : <span className="text-rose-400 font-bold text-xs flex items-center gap-1"><XCircle className="w-4 h-4" /> Wrong</span>
                                        }
                                    </div>
                                );
                            })}
                            {/* Correct answer reveal */}
                            {question?.correct_option !== undefined && question?.correct_option !== null && options[question.correct_option] && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-sm">
                                    <span className="font-bold text-emerald-400">Correct answer: </span>
                                    <span className="text-white">{String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}</span>
                                </div>
                            )}
                        </div>

                        <button onClick={() => router.back()} className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold active:scale-95 transition-all">
                            ← Back to Feed
                        </button>
                    </div>
                )}

                {/* ── REJECTED ── */}
                {duel.status === 'rejected' && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-8 text-center space-y-3">
                        <XCircle className="w-12 h-12 mx-auto text-rose-400" />
                        <h2 className="text-xl font-black">Duel Rejected</h2>
                        <p className="text-slate-400">
                            {iAmChallenged ? "You rejected this duel." : `${challenged.name.split(' ')[0]} rejected your duel.`}
                        </p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-3 rounded-2xl bg-slate-700 font-bold text-sm active:scale-95 transition-all">← Go Back</button>
                    </div>
                )}

                {/* ── EXPIRED ── */}
                {duel.status === 'expired' && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-8 text-center space-y-3">
                        <Clock className="w-12 h-12 mx-auto text-slate-500" />
                        <h2 className="text-xl font-black">Duel Expired</h2>
                        <p className="text-slate-400">The 24-hour window has passed.</p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-3 rounded-2xl bg-slate-700 font-bold text-sm active:scale-95 transition-all">← Go Back</button>
                    </div>
                )}
            </div>
        </div>
    );
}
