'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Swords, Clock, CheckCircle, XCircle, Trophy, Loader2, ArrowLeft, Flame } from 'lucide-react';

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

function OpponentAvatar({ name, avatar }: { name: string; avatar: string | null }) {
    if (avatar) return <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700" />;
    return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white font-black flex items-center justify-center text-sm ring-2 ring-slate-700">
            {name?.[0]?.toUpperCase()}
        </div>
    );
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Pending',   color: 'text-amber-400 bg-amber-400/10' },
    accepted:  { label: 'Live ⚡',   color: 'text-orange-400 bg-orange-400/10' },
    completed: { label: 'Done',      color: 'text-slate-400 bg-slate-800' },
    rejected:  { label: 'Declined',  color: 'text-rose-400 bg-rose-400/10' },
    expired:   { label: 'Expired',   color: 'text-slate-500 bg-slate-800' },
};

const FILTERS = ['All', 'Pending', 'Active', 'Done'] as const;
type Filter = typeof FILTERS[number];

function filterDuels(duels: DuelEntry[], f: Filter) {
    if (f === 'All') return duels;
    if (f === 'Pending') return duels.filter(d => d.status === 'pending');
    if (f === 'Active') return duels.filter(d => d.status === 'accepted');
    if (f === 'Done') return duels.filter(d => d.status === 'completed' || d.status === 'rejected' || d.status === 'expired');
    return duels;
}

export default function MyDuelsPage() {
    const router = useRouter();
    const [duels, setDuels] = useState<DuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('All');

    const fetchDuels = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        const res = await fetch('/api/duel/mine', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setDuels((await res.json()).duels || []);
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchDuels(); }, [fetchDuels]);

    const filtered = filterDuels(duels, filter);
    const pendingCount = duels.filter(d => d.status === 'pending').length;
    const liveCount = duels.filter(d => d.status === 'accepted').length;

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 pt-12 pb-4">
                <button onClick={() => router.back()} className="text-slate-500 hover:text-white mb-3 flex items-center gap-1.5 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                            <Swords className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black">My Duels</h1>
                            <p className="text-slate-500 text-xs">1v1 Challenges</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {liveCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-black px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                                <Flame className="w-3 h-3" />{liveCount} Live
                            </span>
                        )}
                        {pendingCount > 0 && (
                            <span className="text-[11px] font-black px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                                {pendingCount} Pending
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
                {/* Filter tabs */}
                <div className="flex gap-2">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${filter === f ? 'bg-orange-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
                            {f}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <div className="text-5xl">⚔️</div>
                        <p className="font-black text-slate-300">{filter === 'All' ? 'No duels yet' : `No ${filter.toLowerCase()} duels`}</p>
                        <p className="text-slate-600 text-sm">Tap ⚔️ Duel on any MCQ in the feed</p>
                        <Link href="/" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-black text-sm">
                            Browse Questions
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(duel => {
                            const cfg = STATUS_CONFIG[duel.status] || STATUS_CONFIG.expired;
                            const needsAction = duel.status === 'pending' && !duel.isChallenger;
                            const isLive = duel.status === 'accepted' && !duel.isChallenger;
                            return (
                                <Link key={duel.id} href={`/duel/${duel.id}`}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${needsAction || isLive ? 'bg-orange-950/20 border-orange-800/30 hover:border-orange-700/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                                    <OpponentAvatar name={duel.opponent.name} avatar={duel.opponent.avatar} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <p className="font-bold text-sm text-white truncate">
                                                {duel.isChallenger ? `You challenged ${duel.opponent.name.split(' ')[0]}` : `${duel.opponent.name.split(' ')[0]} challenged you`}
                                            </p>
                                            {(needsAction || isLive) && (
                                                <span className="text-[10px] font-black text-orange-400 animate-pulse">● ACTION</span>
                                            )}
                                        </div>
                                        {duel.question && (
                                            <p className="text-xs text-slate-500 truncate">{duel.question.title}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                        {duel.status === 'completed' && (
                                            duel.iWon
                                                ? <span className="flex items-center gap-0.5 text-[10px] font-black text-yellow-400"><Trophy className="w-3 h-3" />Win</span>
                                                : <span className="flex items-center gap-0.5 text-[10px] font-black text-rose-400"><XCircle className="w-3 h-3" />Loss</span>
                                        )}
                                        <span className="text-[9px] text-slate-600">
                                            {new Date(duel.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
