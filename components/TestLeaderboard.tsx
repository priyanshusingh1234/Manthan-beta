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

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch(`/api/test/leaderboard?testId=${testId}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLeaderboard(data.leaderboard || []);
            } catch (err: any) {
                console.error("Leaderboard fetch failed:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [testId]);

    if (loading) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Top Scholars...</p>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="w-full p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center">
                <Star className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <h3 className="font-black italic uppercase tracking-widest text-slate-400 text-sm">No recorded attempts yet</h3>
                <p className="text-[10px] text-slate-500 mt-2">Finish the test to be the first on the map!</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-3 px-4 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Scholars Hall of Fame</h3>
            </div>

            <div className="grid gap-3">
                {leaderboard.map((entry, idx) => (
                    <div 
                        key={entry.userId}
                        className={`group relative flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${
                            idx === 0 
                                ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-200/50 dark:border-yellow-500/20 shadow-xl shadow-yellow-500/5' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-lg'
                        }`}
                    >
                        {/* Rank Badge */}
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                idx === 0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' :
                                idx === 1 ? 'bg-slate-300 text-slate-700 shadow-md shadow-slate-300/20' :
                                idx === 2 ? 'bg-amber-700 text-white shadow-sm shadow-amber-900/20' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                                {idx === 0 ? <Medal className="w-4 h-4" /> : entry.rank}
                            </div>

                            {/* Info */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                    {entry.avatar ? (
                                        <Image src={entry.avatar} alt={entry.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-black tracking-tight ${idx === 0 ? 'text-slate-900 dark:text-yellow-500' : 'text-slate-900 dark:text-white'}`}>
                                        {entry.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                                        {entry.school || 'Freelance Scholar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-4 md:gap-8">
                             <div className="hidden sm:flex flex-col items-center">
                                <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-500 transition-colors">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase">{Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s</span>
                                </div>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Time</p>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                    <Target className="w-3.5 h-3.5" />
                                    <span className="text-sm font-black italic tracking-tighter">{entry.score}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">/ {entry.maxScore}</span>
                                </div>
                                <p className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 rounded-full mt-0.5 uppercase tracking-tighter">
                                    {entry.accuracy}% Acc
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
