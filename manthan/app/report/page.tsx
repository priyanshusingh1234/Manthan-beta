'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Calendar, AlertTriangle, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function WeeklyReportPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                if (mounted) setLoading(false);
                return;
            }
            fetch('/api/report', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
                .then(r => r.json())
                .then(data => {
                    if (mounted) {
                        setReport(data);
                        setLoading(false);
                    }
                });
        });

        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!report?.rating) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-slate-600 mb-6" />
                <h1 className="text-2xl font-black text-white mb-2">No Data Yet</h1>
                <p className="text-slate-400 max-w-sm mb-8">Solve some questions this week to unlock your Dheeyudha Report Card.</p>
                <Link href="/feed" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-xl transition-all">
                    Start Solving
                </Link>
            </div>
        );
    }

    const { stats, rating } = report;

    // Mapping colors from API string to actual Tailwind classes
    const getBadgeStyle = (label: string) => {
        switch (label) {
            case 'Excellent': return 'bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-purple-500/30';
            case 'Very Good': return 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-500/30';
            case 'Good': return 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-500/30';
            case 'Not Bad': return 'bg-gradient-to-br from-orange-400 to-amber-600 shadow-orange-500/30';
            default: return 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="max-w-3xl mx-auto px-6 pt-12 relative z-10">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Weekly Report Card</h1>
                        <p className="text-slate-400 font-medium mt-1">Your performance over the last 7 days</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden mb-8"
                >
                    {/* Big Score Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="text-center md:text-left">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Overall Rating</p>
                            <h2 className={`text-5xl md:text-6xl font-black text-transparent bg-clip-text ${getBadgeStyle(rating.label)} pb-2`}>
                                {rating.label}
                            </h2>
                            <p className="text-slate-400 font-medium max-w-sm mt-2 leading-relaxed">
                                {rating.message}
                            </p>
                        </div>

                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" fill="none" className="stroke-slate-800" strokeWidth="12" />
                                <circle
                                    cx="64" cy="64" r="56" fill="none"
                                    className={`stroke-current ${rating.color}`}
                                    strokeWidth="12"
                                    strokeDasharray="351.8"
                                    strokeDashoffset={351.8 - (351.8 * (Math.min(stats.score, 100) / 100))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{stats.score}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Score</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-10" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                        {/* Volume */}
                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-blue-500 to-transparent w-full h-full pointer-events-none" />
                            <Target className="w-6 h-6 text-blue-400 mb-4 relative z-10" />
                            <p className="text-3xl font-black text-white relative z-10">{stats.totalAttempts}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 relative z-10">Questions Tryed</p>
                        </div>

                        {/* Accuracy */}
                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-emerald-500 to-transparent w-full h-full pointer-events-none" />
                            <TrendingUp className="w-6 h-6 text-emerald-400 mb-4 relative z-10" />
                            <p className="text-3xl font-black text-white relative z-10">{stats.accuracy}%</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 relative z-10">Accuracy Rate</p>
                            <p className="text-xs text-slate-600 font-medium mt-2">{stats.correctAttempts} Correct</p>
                        </div>

                        {/* Consistency */}
                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-amber-500 to-transparent w-full h-full pointer-events-none" />
                            <Calendar className="w-6 h-6 text-amber-400 mb-4 relative z-10" />
                            <p className="text-3xl font-black text-white relative z-10">{stats.activeDays}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 relative z-10">Active Days</p>
                        </div>

                    </div>
                </motion.div>

                <div className="flex items-center gap-4">
                    <Link href="/feed" className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-center transition-all flex justify-center gap-2">
                        Back to Feed <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
    );
}
