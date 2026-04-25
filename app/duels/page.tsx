'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
    Swords, Trophy, Clock, XCircle, CheckCircle, Loader2,
    ArrowLeft, Handshake, Flame, HelpCircle, ChevronRight
} from 'lucide-react';

type DuelEntry = {
    id: string;
    status: string;
    message: string | null;
    expiresAt: string;
    createdAt: string;
    isChallenger: boolean;
    myAnswer: number | null;
    myCorrect: boolean | null;
    myTimeMs: number | null;
    winnerId: string | null;
    iWon: boolean;
    isDraw: boolean;
    question: { id: string; title: string; subject: string | null; points: number | null } | null;
    opponent: { id: string; name: string; username: string; avatar: string | null };
};

function OpponentAvatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'md' }) {
    const sz = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
    if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover border-2 border-slate-700`} />;
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white font-black flex items-center justify-center border-2 border-slate-700`}>
            {name?.[0]?.toUpperCase()}
        </div>
    );
}

function StatusBadge({ status, isChallenger }: { status: string; isChallenger: boolean }) {
    const configs: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
        pending: {
            label: isChallenger ? 'Waiting' : 'Respond!',
            class: isChallenger
                ? 'bg-slate-700 text-slate-300'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse',
            icon: isChallenger ? <Clock className="w-3 h-3" /> : <Flame className="w-3 h-3" />,
        },
        accepted: {
            label: 'Active',
            class: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
            icon: <Flame className="w-3 h-3" />,
        },
        completed: {
            label: 'Done',
            class: 'bg-slate-700 text-slate-300',
            icon: <CheckCircle className="w-3 h-3" />,
        },
        rejected: {
            label: 'Rejected',
            class: 'bg-red-900/30 text-rose-400',
            icon: <XCircle className="w-3 h-3" />,
        },
        expired: {
            label: 'Expired',
            class: 'bg-slate-800 text-slate-500',
            icon: <Clock className="w-3 h-3" />,
        },
    };
    const c = configs[status] || configs.expired;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${c.class}`}>
            {c.icon}{c.label}
        </span>
    );
}

function ResultChip({ duel }: { duel: DuelEntry }) {
    if (duel.status !== 'completed') return null;
    if (duel.isDraw) return <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><Handshake className="w-3.5 h-3.5" />Draw</span>;
    if (duel.iWon) return <span className="flex items-center gap-1 text-xs font-bold text-yellow-400"><Trophy className="w-3.5 h-3.5" />Won</span>;
    return <span className="flex items-center gap-1 text-xs font-bold text-rose-400"><XCircle className="w-3.5 h-3.5" />Lost</span>;
}

const FILTERS = ['all', 'pending', 'accepted', 'completed'] as const;
type Filter = typeof FILTERS[number];

export default function MyDuelsPage() {
    const router = useRouter();
    const [duels, setDuels] = useState<DuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');

    const fetchDuels = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        const res = await fetch('/api/duel/mine', {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
            const json = await res.json();
            setDuels(json.duels || []);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchDuels(); }, [fetchDuels]);

    const filtered = filter === 'all'
        ? duels
        : duels.filter((d) => d.status === filter);

    // Counts for filter tabs
    const counts: Record<Filter, number> = {
        all: duels.length,
        pending: duels.filter((d) => d.status === 'pending').length,
        accepted: duels.filter((d) => d.status === 'accepted').length,
        completed: duels.filter((d) => d.status === 'completed').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-red-600 px-4 pt-12 pb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none" />
                <button onClick={() => router.back()} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold mb-4 relative transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3 relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                        <Swords className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">My Duels</h1>
                        <p className="text-white/70 text-sm">Your 1v1 battles</p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all ${
                                filter === f
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-800/60 flex items-center justify-center">
                            <Swords className="w-9 h-9 text-slate-600" />
                        </div>
                        <div>
                            <p className="font-black text-lg text-slate-300">
                                {filter === 'all' ? 'No duels yet' : `No ${filter} duels`}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                Head to the feed and hit ⚔️ Duel on any MCQ!
                            </p>
                        </div>
                        <Link href="/"
                            className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                            Browse Questions
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((duel) => (
                            <Link key={duel.id} href={`/duel/${duel.id}`}
                                className="block bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 hover:bg-slate-800 hover:border-slate-600 transition-all group">
                                <div className="flex items-center gap-3">
                                    <OpponentAvatar name={duel.opponent.name} avatar={duel.opponent.avatar} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-black text-sm text-white group-hover:text-orange-300 transition-colors truncate">
                                                {duel.isChallenger ? 'You challenged' : 'Challenged by'} {duel.opponent.name.split(' ')[0]}
                                            </p>
                                            <StatusBadge status={duel.status} isChallenger={duel.isChallenger} />
                                        </div>
                                        {duel.question && (
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                {duel.question.subject && (
                                                    <span className="text-orange-400 font-semibold mr-1">{duel.question.subject} ·</span>
                                                )}
                                                {duel.question.title}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <ResultChip duel={duel} />
                                            {duel.status === 'accepted' && duel.myAnswer === null && (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                                    <HelpCircle className="w-3 h-3" />Your turn!
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-600 ml-auto">
                                                {new Date(duel.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
