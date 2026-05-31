import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from '@/lib/next-navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Swords, Clock, CheckCircle, XCircle, Trophy,
    Loader2, Flame, Shield, ChevronLeft
} from 'lucide-react-native';

/* ── helpers ─────────────────────────────────────────── */
function Avatar({ name, avatar, lg }: { name: string; avatar: string | null; lg?: boolean }) {
    const sz = lg ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
    if (avatar) return <Image src={avatar} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-indigo-100 dark:ring-slate-700`} />;
    return (
        <View className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black flex items-center justify-center ring-2 ring-indigo-100 dark:ring-slate-700`}>
            {name?.[0]?.toUpperCase()}
        </View>
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
    return <Text>{t}</Text>;
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
        <View className="min-h-[60vh] flex items-center justify-center flex-row">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </View>
    );
    if (!data) return (
        <View className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4">
            <Swords className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <Text className="font-black text-slate-700 dark:text-slate-300">Duel not found</Text>
            <View onPress={() => router.back()} className="text-sm font-bold text-indigo-600 dark:text-indigo-400">← Go back</View>
        </View>
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
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24">
            <View className="max-w-xl mx-auto px-4 pt-5 space-y-4">

                {/* ── Back + VS bar ──────────────────────────────── */}
                <View className="flex items-center gap-3 flex-row">
                    <View onPress={() => router.back()}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors flex-row">
                        <ChevronLeft className="w-4 h-4" />
                    </View>
                    <View className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-sm flex-row">
                        <Avatar name={challenger.name} avatar={challenger.avatar} />
                        <Text className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[70px]">{challenger.name.split(' ')[0]}</Text>
                        <View className="flex-1 flex justify-center flex-row">
                            <Text className="text-[10px] font-black bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1 flex-row">
                                <Swords className="w-3 h-3" /> VS
                            </Text>
                        </View>
                        <Text className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[70px] text-right">{challenged.name.split(' ')[0]}</Text>
                        <Avatar name={challenged.name} avatar={challenged.avatar} />
                    </View>
                    <Text className={`text-[10px] font-black px-2 py-1.5 rounded-xl shrink-0 ${duel.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                            duel.status === 'accepted' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                        {statusLabel[duel.status] ?? duel.status}
                    </Text>
                </View>

                {/* ── Taunt message ──────────────────────────────── */}
                {duel.message && (
                    <Text className="text-center text-sm text-slate-500 dark:text-slate-400 italic px-4">
                        &ldquo;{duel.message}&rdquo;
                    </Text>
                )}

                {/* ══ PENDING — challenged sees accept / reject ══ */}
                {duel.status === 'pending' && isChallenged && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-5">
                        <View className="flex flex-col items-center gap-2 text-center">
                            <View className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-3xl flex-row">⚔️</View>
                            <Text className="text-lg font-black text-slate-900 dark:text-white">
                                {challenger.name.split(' ')[0]} challenged you!
                            </Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400">Can you answer this question?</Text>
                        </View>
                        {question?.title && (
                            <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                {question.subject && (
                                    <Text className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">{question.subject}</Text>
                                )}
                                {question?.title}
                            </View>
                        )}
                        <View className="flex gap-3 flex-row">
                            <View onPress={() => doAction('reject')} disabled={acting}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 flex-row">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                Decline
                            </View>
                            <View onPress={() => doAction('accept')} disabled={acting}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black flex items-center justify-center gap-2 shadow-md shadow-orange-200 dark:shadow-orange-900/20 transition-all active:scale-95 flex-row">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Accept ⚔️
                            </View>
                        </View>
                    </View>
                )}

                {/* ══ PENDING — challenger waits ══ */}
                {duel.status === 'pending' && isChallenger && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Loader2 className="w-9 h-9 mx-auto animate-spin text-orange-400" />
                        <Text className="font-black text-lg text-slate-900 dark:text-white">
                            Waiting for {challenged.name.split(' ')[0]}…
                        </Text>
                        <Text className="text-slate-500 text-sm">
                            <Countdown expiresAt={duel.expiresAt} /> to respond
                        </Text>
                        {question?.title && (
                            <View className="mt-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-700">
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your challenge</Text>
                                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">{question?.title}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ══ ACCEPTED — challenger waits for the answer ══ */}
                {duel.status === 'accepted' && isChallenger && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <View className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-row">
                            <Flame className="w-7 h-7 text-orange-500" />
                        </View>
                        <Text className="font-black text-lg text-slate-900 dark:text-white">
                            {challenged.name.split(' ')[0]} is answering…
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">You'll be notified when done.</Text>
                        <Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-300 dark:text-slate-600" />
                    </View>
                )}

                {/* ══ ACCEPTED — challenged answers ══ */}
                {duel.status === 'accepted' && isChallenged && !submitted && (
                    <View className="space-y-3">
                        {/* Q card */}
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-2">
                            {question?.subject && (
                                <Text className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg uppercase tracking-wide">
                                    {question.subject}
                                </Text>
                            )}
                            <Text className="font-black text-lg leading-snug text-slate-900 dark:text-white">{question?.title}</Text>
                            {question?.body && <Text className="text-slate-500 dark:text-slate-400 text-sm">{question.body}</Text>}
                        </View>

                        {/* Options */}
                        <View className="space-y-2">
                            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Choose your answer</Text>
                            {options.map((opt, i) => (
                                <View key={i} onPress={() => setSelected(i)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${selected === i
                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}>
                                    <Text className="font-black text-orange-400 mr-2">{String.fromCharCode(65 + i)}.</Text>{opt}
                                </View>
                            ))}
                        </View>

                        {selected !== null && (
                            <View
                                onPress={async () => {
                                    setSubmitted(true);
                                    await doAction('answer', { answer: selected, timeMs: Date.now() - startTime });
                                }}
                                disabled={acting}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-base shadow-md shadow-orange-200 dark:shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 flex-row">
                                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-5 h-5" /> Lock In Answer</>}
                            </View>
                        )}
                    </View>
                )}

                {duel.status === 'accepted' && isChallenged && submitted && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-400" />
                        <Text className="font-black text-slate-900 dark:text-white">Answer submitted!</Text>
                        <Text className="text-slate-500 text-sm">Calculating result…</Text>
                    </View>
                )}

                {/* ══ COMPLETED ══ */}
                {duel.status === 'completed' && (
                    <View className="space-y-4">
                        {/* Result hero */}
                        {duel.winnerId === currentUserId ? (
                            <View className="bg-white dark:bg-slate-900 border-2 border-yellow-300 dark:border-yellow-700/40 rounded-3xl shadow-md p-8 text-center space-y-2">
                                <View className="text-5xl">🏆</View>
                                <Text className="text-2xl font-black text-slate-900 dark:text-white">You Won!</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} couldn't crack your question!` : 'You answered it correctly!'}
                                </Text>
                            </View>
                        ) : (
                            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-2">
                                <View className="text-5xl">💀</View>
                                <Text className="text-2xl font-black text-slate-900 dark:text-white">You Lost!</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm">
                                    {isChallenger ? `${challenged.name.split(' ')[0]} cracked your question!` : 'Wrong answer this time.'}
                                </Text>
                            </View>
                        )}

                        {/* Breakdown card */}
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-4">
                            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">Result Breakdown</Text>

                            <View className="flex items-center gap-3 flex-row">
                                <Avatar name={challenged.name} avatar={challenged.avatar} lg />
                                <View className="flex-1 min-w-0 flex-row">
                                    <Text className="font-bold text-sm text-slate-900 dark:text-white">{challenged.name.split(' ')[0]}'s answer</Text>
                                    {duel.challengedAnswer !== null && options[duel.challengedAnswer] && (
                                        <Text className="text-xs text-slate-500 truncate">
                                            {String.fromCharCode(65 + duel.challengedAnswer)}. {options[duel.challengedAnswer]}
                                        </Text>
                                    )}
                                </View>
                                {duel.challengedCorrect
                                    ? <Text className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex-row"><CheckCircle className="w-4 h-4" />Correct</Text>
                                    : <Text className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs flex-row"><XCircle className="w-4 h-4" />Wrong</Text>
                                }
                            </View>

                            {question?.correct_option !== undefined && options[question.correct_option] && (
                                <View className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-3 text-sm">
                                    <Text className="font-black text-emerald-600 dark:text-emerald-400">✓ Correct: </Text>
                                    <Text className="text-slate-700 dark:text-slate-300">
                                        {String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View onPress={() => router.back()}
                            className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold shadow-sm active:scale-95 transition-all">
                            ← Back
                        </View>
                    </View>
                )}

                {/* ══ REJECTED ══ */}
                {duel.status === 'rejected' && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <XCircle className="w-12 h-12 mx-auto text-rose-400" />
                        <Text className="text-xl font-black text-slate-900 dark:text-white">Duel Declined</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">
                            {isChallenged ? 'You declined this duel.' : `${challenged.name.split(' ')[0]} declined your challenge.`}
                        </Text>
                        <View onPress={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 active:scale-95">
                            ← Back
                        </View>
                    </View>
                )}

                {/* ══ EXPIRED ══ */}
                {duel.status === 'expired' && (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center space-y-3">
                        <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                        <Text className="text-xl font-black text-slate-900 dark:text-white">Duel Expired</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">The 24-hour window passed without a response.</Text>
                        <View onPress={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 active:scale-95">
                            ← Back
                        </View>
                    </View>
                )}

            </View>
        </View>
    );
}
