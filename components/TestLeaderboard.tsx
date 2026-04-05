"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Clock, Target, User } from 'lucide-react';
import Image from 'next/image';

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

    if (loading) return null; // keep it silent until ready

    if (leaderboard.length === 0) {
        return (
            <div className="w-full p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recorded stats yet</p>
            </div>
        );
    }

    const isTop10 = userStats && leaderboard.some(e => e.userId === userStats.userId);

    return (
        <div className="w-full space-y-3">
            <div className="grid gap-2">
                {leaderboard.map((entry, idx) => (
                    <div 
                        key={entry.userId}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            idx === 0 
                                ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 shadow-sm' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        } ${entry.userId === userStats?.userId ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                idx === 0 ? 'bg-amber-500 text-white' :
                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                idx === 2 ? 'bg-amber-700 text-white' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                                {entry.rank}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black tracking-tight flex items-center gap-1.5">
                                    {entry.name}
                                    {entry.userId === userStats?.userId && <span className="text-[8px] bg-indigo-500 text-white px-1 rounded-sm uppercase">You</span>}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[100px]">
                                    {entry.school || 'Private Scholar'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black italic tracking-tighter text-indigo-600 dark:text-indigo-400">
                                    {entry.score} <span className="text-[9px] text-slate-400 font-bold">/ {entry.maxScore}</span>
                                </span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                                    {entry.accuracy}% {Math.floor(entry.timeTaken / 60)}m
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Show current user if they aren't in Top 10 but have an attempt */}
                {userStats && !isTop10 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-500/5 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] bg-indigo-600 text-white">
                                    ??
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black tracking-tight text-indigo-600 dark:text-indigo-400">Your Current Best</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Keep pushing to hit Top 10!</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-black italic tracking-tighter text-indigo-600">
                                        {userStats.score} <span className="text-[9px] text-slate-400 font-bold">/ {userStats.maxScore}</span>
                                    </span>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                                        {userStats.accuracy}% {Math.floor(userStats.timeTaken / 60)}m
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
