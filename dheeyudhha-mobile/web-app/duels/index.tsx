import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/next-navigation';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import {
    Swords, Clock, XCircle, Trophy, Loader2,
    Flame, ChevronLeft, ChevronRight
} from 'lucide-react-native';

type DuelEntry = {
    id: string;
    status: string;
    message: string | null;
    expiresAt: string;
    createdAt: string;
    isChallenger: boolean;
    myAnswer: number | null;
    myCorrect: boolean | null;
    winnerId: string | null;
    iWon: boolean;
    question: { id: string; title: string; subject: string | null; points: number | null } | null;
    opponent: { id: string; name: string; username: string; avatar: string | null };
};

function OppAvatar({ name, avatar }: { name: string; avatar: string | null }) {
    if (avatar) return <Image src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-slate-700" />;
    return (
        <View className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black flex items-center justify-center text-sm ring-2 ring-indigo-100 dark:ring-slate-700 flex-row">
            {name?.[0]?.toUpperCase()}
        </View>
    );
}

const FILTERS = ['All', 'Pending', 'Active', 'Done'] as const;
type Filter = typeof FILTERS[number];

function applyFilter(duels: DuelEntry[], f: Filter) {
    if (f === 'Pending') return duels.filter(d => d.status === 'pending');
    if (f === 'Active')  return duels.filter(d => d.status === 'accepted');
    if (f === 'Done')    return duels.filter(d => ['completed', 'rejected', 'expired'].includes(d.status));
    return duels;
}

const STATUS_PILL: Record<string, { label: string; class: string }> = {
    pending:   { label: 'Pending',  class: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    accepted:  { label: 'Live ⚡',  class: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
    completed: { label: 'Done',     class: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
    rejected:  { label: 'Declined', class: 'bg-red-100 dark:bg-red-900/20 text-rose-600 dark:text-rose-400' },
    expired:   { label: 'Expired',  class: 'bg-slate-100 dark:bg-slate-800 text-slate-400' },
};

export default function MyDuelsPage() {
    const router = useRouter();
    const [duels, setDuels] = useState<DuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('All');

    const fetchDuels = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        const res = await fetch('/api/duel/mine', {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setDuels((await res.json()).duels || []);
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchDuels(); }, [fetchDuels]);

    const filtered = applyFilter(duels, filter);
    const pendingCount = duels.filter(d => d.status === 'pending' && !d.isChallenger).length;
    const liveCount   = duels.filter(d => d.status === 'accepted' && !d.isChallenger).length;

    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24">
            <View className="max-w-lg mx-auto px-4 pt-5 space-y-4">

                {/* Page header */}
                <View className="flex items-center gap-3 flex-row">
                    <View onPress={() => router.back()}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors flex-row">
                        <ChevronLeft className="w-4 h-4" />
                    </View>
                    <View className="flex-1 flex-row">
                        <Text className="text-xl font-black text-slate-900 dark:text-white">My Duels</Text>
                        <Text className="text-xs text-slate-500">1v1 Challenges</Text>
                    </View>
                    <View className="flex gap-2 flex-row">
                        {liveCount > 0 && (
                            <Text className="flex items-center gap-1 text-[10px] font-black px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-800/30 flex-row">
                                <Flame className="w-3 h-3" />{liveCount} Live
                            </Text>
                        )}
                        {pendingCount > 0 && (
                            <Text className="text-[10px] font-black px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/30">
                                {pendingCount} Action
                            </Text>
                        )}
                    </View>
                </View>

                {/* Filter tabs */}
                <View className="flex gap-2 flex-row">
                    {FILTERS.map(f => (
                        <View key={f} onPress={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                                filter === f
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}>
                            {f}
                        </View>
                    ))}
                </View>

                {/* Duel list */}
                {loading ? (
                    <View className="flex justify-center py-20 flex-row">
                        <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                    </View>
                ) : filtered.length === 0 ? (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-12 text-center space-y-3">
                        <Swords className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                        <Text className="font-black text-slate-700 dark:text-slate-300">
                            {filter === 'All' ? 'No duels yet' : `No ${filter.toLowerCase()} duels`}
                        </Text>
                        <Text className="text-slate-400 text-sm">Tap ⚔️ Duel on any MCQ in the feed</Text>
                        <Link href="/"
                            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm shadow-md shadow-orange-200 dark:shadow-orange-900/20">
                            Browse Questions
                        </Link>
                    </View>
                ) : (
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map((duel) => {
                            const pill = STATUS_PILL[duel.status] ?? STATUS_PILL.expired;
                            const needsAction = (duel.status === 'pending' || duel.status === 'accepted') && !duel.isChallenger;

                            return (
                                <Link key={duel.id} href={`/duel/${duel.id}`}
                                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${needsAction ? 'bg-orange-50/50 dark:bg-orange-900/5' : ''}`}>
                                    <OppAvatar name={duel.opponent.name} avatar={duel.opponent.avatar} />

                                    <View className="flex-1 min-w-0 flex-row">
                                        <View className="flex items-center gap-2 mb-0.5 flex-row">
                                            <Text className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                {duel.isChallenger
                                                    ? `You → ${duel.opponent.name.split(' ')[0]}`
                                                    : `${duel.opponent.name.split(' ')[0]} → You`}
                                            </Text>
                                            {needsAction && <Text className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />}
                                        </View>
                                        {duel.question && (
                                            <Text className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                {duel.question.subject && <><Text className="text-indigo-500">{duel.question.subject}</Text> · </>}
                                                {duel.question.title}
                                            </Text>
                                        )}
                                    </View>

                                    <View className="flex flex-col items-end gap-1.5 shrink-0">
                                        <Text className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pill.class}`}>{pill.label}</Text>
                                        {duel.status === 'completed' && (
                                            duel.iWon
                                                ? <Text className="flex items-center gap-0.5 text-[10px] font-black text-yellow-500 flex-row">🏆 Win</Text>
                                                : <Text className="flex items-center gap-0.5 text-[10px] font-black text-rose-500 flex-row"><XCircle className="w-3 h-3" />Loss</Text>
                                        )}
                                        <Text className="text-[9px] text-slate-400 dark:text-slate-600">
                                            {new Date(duel.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>

                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                                </Link>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
}
