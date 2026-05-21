'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Swords, Clock, CheckCircle, XCircle, Trophy,
    Loader2, Flame, Shield, ChevronLeft
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────── */
function Avatar({ name, avatar, lg }: { name: string; avatar: string | null; lg?: boolean }) {
    const sz = lg ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
    if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-indigo-100 dark:ring-slate-700`} />;
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black flex items-center justify-center ring-2 ring-indigo-100 dark:ring-slate-700`}>
            {name?.[0]?.toUpperCase()}
        </div>
    );
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
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [expiresAt]);
    return <span>{t}</span>;
}

/* ── page ─────────────────────────────────────────────── */
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
        const res = await fetch(`/api/duel/${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        setData(await res.json());
        setLoading(false);
    }, [id, router]);

    useEffect(() => {
        fetchDuel();
        
        // 30s slow-poll fallback just in case the socket connection drops
        pollRef.current = setInterval(fetchDuel, 30000);
        
        // Instant Realtime updates
        const channel = supabase
            .channel(`duel-${id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${id}` }, () => {
                fetchDuel();
            })
            .subscribe();

        return () => { 
            if (pollRef.current) clearInterval(pollRef.current);
            supabase.removeChannel(channel);
        };
    }, [fetchDuel, id]);

    /* stop polling once terminal state */
    useEffect(() => {
        const s = data?.duel?.status;
        if (['completed', 'rejected', 'expired'].includes(s)) {
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

    /* ── loading / error states ── */
    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </div>
    );
    if (!data) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4">
            <Swords className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="font-black text-slate-700 dark:text-slate-300">Duel not found</p>
            <button onClick={() => router.back()} className="text-sm font-bold text-indigo-600 dark:text-indigo-400">← Go back</button>
        </div>
    );

    const { duel, question, challenger, challenged, currentUserId } = data;
    const isChallenger = currentUserId === challenger.id;
    const isChallenged = currentUserId === challenged.id;
    const options: string[] = Array.isArray(question?.options)
        ? question.options
        : (typeof question?.options === 'string' ? JSON.parse(question.options) : []);

    const statusLabel: Record<string, string> = {
        pending: 'Pending', accepted: 'Live', completed: 'Completed',
        rejected: 'Declined', expired: 'Expired',
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24">
            <main className="max-w-xl mx-auto px-4 pt-5 space-y-4">

                {/* ── Back + VS bar ──────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-sm">
                        <Avatar name={challenger.name} avatar={challenger.avatar} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[70px]">{challenger.name.split(' ')[0]}</span>
                        <div className="flex-1 flex justify-center">
                            <span className="text-[10px] font-black bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Swords className="w-3 h-3" /> VS
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[70px] text-right">{challenged.name.split(' ')[0]}</span>
                        <Avatar name={challenged.name} avatar={challenged.avatar} />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1.5 rounded-xl shrink-0 ${duel.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                            duel.status === 'accepted' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                        {statusLabel[duel.status] ?? duel.status}
                    </span>
                </div>

                {/* ── Taunt message ──────────────────────────────── */}
                {duel.message && (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 italic px-4">
                        &ldquo;{duel.message}&rdquo;
                    </p>
                )}

                {/* ══ PENDING — challenged sees accept / reject ══ */}
                {duel.status === 'pending' && isChallenged && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-5">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-3xl">⚔️</div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                {challenger.name.split(' ')[0]} challenged you!
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Can you answer this question?</p>
                        </div>
                        {question?.title && (
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                {question.subject && (
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">{question.subject}</span>
                                )}
                                {question?.title}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => doAction('reject')} disabled={acting}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                Decline
                            </button>
                            <button onClick={() => doAction('accept')} disabled={acting}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black flex items-center justify-center gap-2 shadow-md shadow-orange-200 dark:shadow-orange-900/20 transition-all active:scale-95">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Accept ⚔️
                            </button>
                        </div>
                    </div>
                )}

                {/* ══ PENDING — challenger waits ══ */}
                {duel.status === 'pending' && isChallenger && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Loader2 className="w-9 h-9 mx-auto animate-spin text-orange-400" />
                        <p className="font-black text-lg text-slate-900 dark:text-white">
                            Waiting for {challenged.name.split(' ')[0]}…
                        </p>
                        <p className="text-slate-500 text-sm">
                            <Countdown expiresAt={duel.expiresAt} /> to respond
                        </p>
                        {question?.title && (
                            <div className="mt-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your challenge</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{question?.title}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ ACCEPTED — challenger waits for the answer ══ */}
                {duel.status === 'accepted' && isChallenger && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <Flame className="w-7 h-7 text-orange-500" />
                        </div>
                        <p className="font-black text-lg text-slate-900 dark:text-white">
                            {challenged.name.split(' ')[0]} is answering…
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">You'll be notified when done.</p>
                        <Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-300 dark:text-slate-600" />
                    </div>
                )}

                {/* ══ ACCEPTED — challenged answers ══ */}
                {duel.status === 'accepted' && isChallenged && !submitted && (
                    <div className="space-y-3">
                        {/* Q card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-2">
                            {question?.subject && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg uppercase tracking-wide">
                                    {question.subject}
                                </span>
                            )}
                            <h3 className="font-black text-lg leading-snug text-slate-900 dark:text-white">{question?.title}</h3>
                            {question?.body && <p className="text-slate-500 dark:text-slate-400 text-sm">{question.body}</p>}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Choose your answer</p>
                            {options.map((opt, i) => (
                                <button key={i} onClick={() => setSelected(i)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${selected === i
                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}>
                                    <span className="font-black text-orange-400 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                                </button>
                            ))}
                        </div>

                        {selected !== null && (
                            <button
                                onClick={async () => {
                                    setSubmitted(true);
                                    await doAction('answer', { answer: selected, timeMs: Date.now() - startTime });
                                }}
                                disabled={acting}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-base shadow-md shadow-orange-200 dark:shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-5 h-5" /> Lock In Answer</>}
                            </button>
                        )}
                    </div>
                )}

                {duel.status === 'accepted' && isChallenged && submitted && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-400" />
                        <p className="font-black text-slate-900 dark:text-white">Answer submitted!</p>
                        <p className="text-slate-500 text-sm">Calculating result…</p>
                    </div>
                )}

                {/* ══ COMPLETED ══ */}
                {duel.status === 'completed' && (
                    <div className="space-y-4">
                        {/* Result hero */}
                        {duel.winnerId === currentUserId ? (
                            <div className="bg-white dark:bg-slate-900 border-2 border-yellow-300 dark:border-yellow-700/40 rounded-3xl shadow-md p-8 text-center space-y-2">
                                <div className="text-5xl">🏆</div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">You Won!</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} couldn't crack your question!` : 'You answered it correctly!'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-2">
                                <div className="text-5xl">💀</div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">You Lost!</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} cracked your question!` : 'Wrong answer this time.'}
                                </p>
                            </div>
                        )}

                        {/* Breakdown card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Result Breakdown</p>

                            <div className="flex items-center gap-3">
                                <Avatar name={challenged.name} avatar={challenged.avatar} lg />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{challenged.name.split(' ')[0]}'s answer</p>
                                    {duel.challengedAnswer !== null && options[duel.challengedAnswer] && (
                                        <p className="text-xs text-slate-500 truncate">
                                            {String.fromCharCode(65 + duel.challengedAnswer)}. {options[duel.challengedAnswer]}
                                        </p>
                                    )}
                                </div>
                                {duel.challengedCorrect
                                    ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs"><CheckCircle className="w-4 h-4" />Correct</span>
                                    : <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs"><XCircle className="w-4 h-4" />Wrong</span>
                                }
                            </div>

                            {question?.correct_option !== undefined && options[question.correct_option] && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-3 text-sm">
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">✓ Correct: </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                        {String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button onClick={() => router.back()}
                            className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold shadow-sm active:scale-95 transition-all">
                            ← Back
                        </button>
                    </div>
                )}

                {/* ══ REJECTED ══ */}
                {duel.status === 'rejected' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <XCircle className="w-12 h-12 mx-auto text-rose-400" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Duel Declined</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {isChallenged ? 'You declined this duel.' : `${challenged.name.split(' ')[0]} declined your challenge.`}
                        </p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 active:scale-95">
                            ← Back
                        </button>
                    </div>
                )}

                {/* ══ EXPIRED ══ */}
                {duel.status === 'expired' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Duel Expired</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">The 24-hour window passed without a response.</p>
                        <button onClick={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 active:scale-95">
                            ← Back
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}
