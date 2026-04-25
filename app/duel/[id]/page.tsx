'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Swords, Clock, CheckCircle, XCircle, Trophy, Loader2, ArrowLeft, Shield, Flame } from 'lucide-react';

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'lg' }) {
    const sz = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-8 h-8 text-xs';
    if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-white/20`} />;
    return <div className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black flex items-center justify-center ring-2 ring-white/20`}>{name?.[0]?.toUpperCase()}</div>;
}

function Countdown({ expiresAt }: { expiresAt: string }) {
    const [t, setT] = useState('');
    useEffect(() => {
        const tick = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) { setT('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setT(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);
    return <span>{t}</span>;
}

export default function DuelRoomPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [startTime] = useState(Date.now());
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchDuel = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        const res = await fetch(`/api/duel/${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!res.ok) { setLoading(false); return; }
        setData(await res.json());
        setLoading(false);
    }, [id, router]);

    useEffect(() => {
        fetchDuel();
        pollRef.current = setInterval(fetchDuel, 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchDuel]);

    useEffect(() => {
        const s = data?.duel?.status;
        if (s === 'completed' || s === 'rejected' || s === 'expired') {
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
                <p className="text-xl font-black">Duel not found</p>
                <button onClick={() => router.back()} className="text-orange-400 text-sm font-bold">← Go back</button>
            </div>
        </div>
    );

    const { duel, question, challenger, challenged, currentUserId } = data;
    const isChallenger = currentUserId === challenger.id;
    const isChallenged = currentUserId === challenged.id;
    const options: string[] = Array.isArray(question?.options)
        ? question.options
        : (typeof question?.options === 'string' ? JSON.parse(question.options) : []);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                    <Avatar name={challenger.name} avatar={challenger.avatar} size="sm" />
                    <span className="text-xs font-bold text-slate-400">{challenger.name.split(' ')[0]}</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded-full mx-1">
                        <Swords className="w-3 h-3 text-orange-400" />
                        <span className="text-[10px] font-black text-orange-400">VS</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{challenged.name.split(' ')[0]}</span>
                    <Avatar name={challenged.name} avatar={challenged.avatar} size="sm" />
                </div>
                {/* Status pill */}
                <div className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    duel.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                    duel.status === 'accepted' ? 'bg-orange-500/20 text-orange-300' :
                    duel.status === 'completed' ? 'bg-slate-700 text-slate-300' :
                    'bg-slate-800 text-slate-500'
                }`}>
                    {duel.status === 'pending' ? <><Clock className="w-3 h-3 inline mr-1" /><Countdown expiresAt={duel.expiresAt} /></> :
                     duel.status === 'accepted' ? <><Flame className="w-3 h-3 inline mr-1" />LIVE</> :
                     duel.status === 'completed' ? '✓ DONE' : duel.status.toUpperCase()}
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

                {/* Taunt */}
                {duel.message && (
                    <div className="text-center text-sm text-slate-400 italic">
                        &ldquo;{duel.message}&rdquo;
                    </div>
                )}

                {/* ── PENDING: challenged sees accept/reject ── */}
                {duel.status === 'pending' && isChallenged && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="text-center space-y-1">
                            <div className="text-4xl mb-3">⚔️</div>
                            <h2 className="text-lg font-black">Challenge from {challenger.name.split(' ')[0]}</h2>
                            <p className="text-slate-400 text-sm">Can you answer this question?</p>
                        </div>
                        {question?.title && (
                            <div className="bg-slate-800 rounded-xl p-4 text-sm font-semibold text-slate-200 border border-slate-700">
                                {question.title}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => doAction('reject')} disabled={acting}
                                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-red-400" />}
                                Decline
                            </button>
                            <button onClick={() => doAction('accept')} disabled={acting}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Accept ⚔️
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PENDING: challenger waits ── */}
                {duel.status === 'pending' && isChallenger && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                        <Loader2 className="w-10 h-10 mx-auto animate-spin text-orange-400" />
                        <p className="font-bold text-lg">Waiting for {challenged.name.split(' ')[0]}…</p>
                        <p className="text-slate-500 text-sm">They have <Countdown expiresAt={duel.expiresAt} /> to respond.</p>
                        {question?.title && (
                            <div className="mt-4 bg-slate-800 rounded-xl p-4 text-sm text-slate-400 text-left border border-slate-700">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Your challenge</p>
                                <p className="font-semibold text-slate-300">{question.title}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ACCEPTED: challenger waits for answer ── */}
                {duel.status === 'accepted' && isChallenger && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center">
                            <Flame className="w-7 h-7 text-orange-400" />
                        </div>
                        <p className="font-black text-lg">{challenged.name.split(' ')[0]} is answering…</p>
                        <p className="text-slate-500 text-sm">You'll be notified when they answer.</p>
                        <Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-600 mt-2" />
                    </div>
                )}

                {/* ── ACCEPTED: challenged answers ── */}
                {duel.status === 'accepted' && isChallenged && (
                    <div className="space-y-4">
                        {/* Question card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                            {question?.subject && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/10 text-orange-300 rounded-lg uppercase tracking-wide">
                                    {question.subject}
                                </span>
                            )}
                            <h3 className="font-black text-lg leading-snug">{question?.title}</h3>
                            {question?.body && <p className="text-slate-400 text-sm">{question.body}</p>}
                        </div>

                        {/* Options or submitted */}
                        {!submitted ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your answer — one shot!</p>
                                {options.map((opt, i) => (
                                    <button key={i} onClick={() => setSelected(i)}
                                        className={`w-full text-left p-4 rounded-xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${
                                            selected === i
                                                ? 'border-orange-500 bg-orange-500/10 text-white'
                                                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                                        }`}>
                                        <span className="font-black text-orange-400 mr-3">{String.fromCharCode(65 + i)}.</span>{opt}
                                    </button>
                                ))}
                                {selected !== null && (
                                    <button
                                        onClick={async () => {
                                            setSubmitted(true);
                                            await doAction('answer', { answer: selected, timeMs: Date.now() - startTime });
                                        }}
                                        disabled={acting}
                                        className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-base shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-5 h-5" />Lock In Answer</>}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-400" />
                                <p className="font-black">Answer submitted!</p>
                                <p className="text-slate-400 text-sm">Calculating result…</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── COMPLETED ── */}
                {duel.status === 'completed' && (
                    <div className="space-y-4">
                        {/* Result hero */}
                        {duel.winnerId === currentUserId ? (
                            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-600/30 rounded-2xl p-8 text-center space-y-2">
                                <div className="text-5xl">🏆</div>
                                <h2 className="text-2xl font-black text-yellow-300">You Won!</h2>
                                <p className="text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} couldn't answer your question!` : 'You answered it correctly!'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                                <div className="text-5xl">💀</div>
                                <h2 className="text-2xl font-black text-rose-400">You Lost!</h2>
                                <p className="text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} cracked your question!` : 'Wrong answer this time.'}
                                </p>
                            </div>
                        )}

                        {/* Breakdown */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Result</p>
                            <div className="flex items-center gap-3">
                                <Avatar name={challenged.name} avatar={challenged.avatar} size="sm" />
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{challenged.name.split(' ')[0]} answered</p>
                                    {duel.challengedAnswer !== null && options[duel.challengedAnswer] && (
                                        <p className="text-xs text-slate-400">{String.fromCharCode(65 + duel.challengedAnswer)}. {options[duel.challengedAnswer]}</p>
                                    )}
                                </div>
                                {duel.challengedCorrect
                                    ? <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-4 h-4" />Correct</span>
                                    : <span className="text-rose-400 font-bold text-xs flex items-center gap-1"><XCircle className="w-4 h-4" />Wrong</span>
                                }
                            </div>
                            {question?.correct_option !== undefined && options[question.correct_option] && (
                                <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-xl p-3 text-sm">
                                    <span className="font-bold text-emerald-400">Correct: </span>
                                    <span className="text-white">{String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => router.back()} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold active:scale-95 transition-all">
                            ← Back
                        </button>
                    </div>
                )}

                {/* ── REJECTED ── */}
                {duel.status === 'rejected' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                        <XCircle className="w-12 h-12 mx-auto text-rose-400" />
                        <h2 className="text-xl font-black">Duel Rejected</h2>
                        <p className="text-slate-400 text-sm">
                            {isChallenged ? 'You declined this duel.' : `${challenged.name.split(' ')[0]} declined your challenge.`}
                        </p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 font-bold text-sm active:scale-95">← Back</button>
                    </div>
                )}

                {/* ── EXPIRED ── */}
                {duel.status === 'expired' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                        <Clock className="w-12 h-12 mx-auto text-slate-600" />
                        <h2 className="text-xl font-black">Duel Expired</h2>
                        <p className="text-slate-400 text-sm">The 24-hour window passed.</p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 font-bold text-sm active:scale-95">← Back</button>
                    </div>
                )}
            </div>
        </div>
    );
}
