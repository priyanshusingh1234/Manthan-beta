"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Clock, Target, User, BarChart3, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type LeaderboardEntry = {
    rank: number;
    userId: string;
    name: string;
    username: string;
    avatar: string | null;
    school: string | null;
    score: number;
    maxScore: number;
    timeTaken: number;
    accuracy: number;
    completedAt: string;
};

export default function TestLeaderboard({ testId }: { testId: string }) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userStats, setUserStats] = useState<any>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                const headers: any = {};
                if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

                const res = await fetch(`/api/test/leaderboard?testId=${testId}`, { headers });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLeaderboard(data.leaderboard || []);
                setUserStats(data.userStats);
            } catch (err: any) {
                console.error("Leaderboard fetch failed:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [testId]);

    if (loading) return (
        <div className="w-full space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
            ))}
        </div>
    );

    if (leaderboard.length === 0) {
        return (
            <div className="w-full p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recorded stats yet</p>
            </div>
        );
    }

    const isTop10 = userStats && leaderboard.some(e => e.userId === userStats.userId);

    return (
        <div className="w-full space-y-4">
            <div className="grid gap-2.5">
                {leaderboard.map((entry, idx) => (
                    <Link 
                        key={entry.userId}
                        href={`/user/${entry.username || entry.userId}`}
                        className={`group flex items-center justify-between p-4 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            idx === 0 
                                ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/5' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50'
                        } ${entry.userId === userStats?.userId ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                idx === 0 ? 'bg-amber-500 text-white shadow-md' :
                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                idx === 2 ? 'bg-amber-700 text-white' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                                {entry.rank}
                            </div>
                            
                            <div className="relative w-11 h-11 shrink-0">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                {entry.avatar ? (
                                    <Image 
                                        src={entry.avatar} 
                                        alt={entry.name} 
                                        fill 
                                        className="rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white truncate">
                                    {entry.name}
                                    {entry.userId === userStats?.userId && <span className="shrink-0 text-[7px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none">You</span>}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 truncate">
                                    {entry.school || 'Private Scholar'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-right pr-2">
                                <div className="text-sm font-black italic tracking-tighter text-indigo-600 dark:text-indigo-400">
                                    {entry.score} <span className="text-[10px] text-slate-400 font-bold">/ {entry.maxScore}</span>
                                </div>
                                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter flex items-center justify-end gap-1">
                                    <span>{entry.accuracy}%</span>
                                    <span className="opacity-40">•</span>
                                    <span>{Math.floor(entry.timeTaken / 60)}m</span>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </Link>
                ))}

                {/* Personal Rank Section */}
                {userStats && (
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                        {!isTop10 && (
                            <div className="mb-4">
                                <div className="p-4 bg-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center font-black">
                                            #{userStats.rank || '??'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black italic uppercase">Current Standing</span>
                                            <span className="text-[10px] opacity-70">Keep pushing for the Top 10!</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black">{userStats.score} / {userStats.maxScore}</span>
                                        <div className="text-[10px] font-bold opacity-60 uppercase">{userStats.accuracy}% Accuracy</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link 
                            href="/stats" 
                            className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all shadow-sm"
                        >
                            <BarChart3 className="w-4 h-4" />
                            See Your Full Analytics
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
