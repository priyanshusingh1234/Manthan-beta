"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Target, Clock, ShieldCheck, User, Search, Filter } from 'lucide-react';

type GauntletRecord = {
    id: string;
    score: number;
    maxScore: number;
    accuracy: number;
    timeTaken: number;
    completed_at: string;
    profiles: {
        full_name: string;
        username: string;
    }
};

export default function GauntletAnalytics() {
    const [data, setData] = useState<GauntletRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalClears: 0, avgScore: 0, avgAccuracy: 0 });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/admin/gauntlet-stats');
                const json = await res.json();
                
                if (json.source === 'test_results') {
                   const records = json.data;
                   setData(records);
                   
                   const total = records.length;
                   const avgS = records.reduce((s: number, r: any) => s + r.score, 0) / total;
                   const avgA = records.reduce((s: number, r: any) => s + r.accuracy, 0) / total;
                   
                   setStats({ totalClears: total, avgScore: Math.round(avgS), avgAccuracy: Math.round(avgA) });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-12 text-center animate-pulse">Scanning the Scrolls of Honor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3 italic uppercase">
                            <ShieldCheck className="w-8 h-8 text-indigo-500" />
                            Gauntlet Intelligence
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Combat analysis for the Class 9 Hard Challenge.</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                        <h3 className="text-3xl font-black">{stats.totalClears}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Scholars Survived</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Target className="w-6 h-6 text-emerald-500 mb-2" />
                        <h3 className="text-3xl font-black">{stats.avgScore} <span className="text-sm text-slate-500">/ 120</span></h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Average Performance</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Clock className="w-6 h-6 text-indigo-500 mb-2" />
                        <h3 className="text-3xl font-black">{stats.avgAccuracy}%</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global Accuracy</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Scholar</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Cleared</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No combat data recorded yet. Results will appear here as scholars complete the challenge.</td>
                                    </tr>
                                ) : data.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                                                    {r.profiles.full_name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">{r.profiles.full_name || 'Scholar'}</p>
                                                    <p className="text-xs text-slate-500">@{r.profiles.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.score} / {r.maxScore}</td>
                                        <td className="px-6 py-4 text-xs font-medium">{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                                        <td className="px-6 py-4">
                                             <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${r.accuracy}%` }} />
                                             </div>
                                             <span className="text-[10px] font-bold mt-1 block">{r.accuracy}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">
                                            {new Date(r.completed_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
