"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, Clock, Zap, Crown, Shield, Play, ChevronRight, Sparkles } from 'lucide-react';

const CHALLENGES = [
    {
        id: 'class-9-hard',
        title: 'Class 9 Ultimate Gauntlet',
        description: 'The hardest 40 questions for Class 9. One chance. Total focus.',
        questions: 40,
        time: '60 Mins',
        difficulty: 'Hard',
        reward: 'Sharpen your skills',
        color: 'from-indigo-600 to-indigo-800',
        glow: 'shadow-indigo-500/20',
        href: '/tests/class-9-hard'
    }
    // and room for future ones like 'science-sprint', 'math-marathon', etc.
];

export default function TestsHubPage() {
    const router = useRouter();

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 relative overflow-hidden">
            {/* Global Mesh Gradients */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-fuchsia-500/5 blur-[120px] rounded-full pointer-events-none" />

            <main className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 pt-12 md:pt-20">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Exhibition Challenges</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">The Arena</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">
                        Push your intellect to the limit. These curated gauntlets are designed to identify the top 1% of scholars.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CHALLENGES.map((challenge) => (
                        <div
                            key={challenge.id}
                            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                        >
                            {/* Card Background Glow */}
                            <div className={`absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl ${challenge.color} opacity-[0.03] dark:opacity-[0.07] group-hover:opacity-[0.08] transition-opacity`} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${challenge.color} flex items-center justify-center text-white shadow-lg`}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{challenge.difficulty} TEST</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-[10px] font-bold">{challenge.time}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black italic uppercase tracking-tight mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {challenge.title}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                                    {challenge.description}
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Questions</span>
                                            <span className="font-bold text-sm">{challenge.questions} MCQs</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Potential</span>
                                            <span className="font-bold text-sm">+{challenge.questions * 3} Points</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-yellow-500" />
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{challenge.reward}</span>
                                    </div>

                                    <button
                                        onClick={() => router.push(challenge.href)}
                                        className={`w-full py-4 mt-2 bg-gradient-to-r ${challenge.color} text-white font-black italic uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 transition-all shadow-xl ${challenge.glow}`}
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Enter the Gauntlet
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Coming Soon Teasers */}
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center opacity-60">
                        <Zap className="w-10 h-10 text-slate-300 mb-4" />
                        <h3 className="font-black italic uppercase tracking-widest text-slate-400">Class 10 Marathon</h3>
                        <p className="text-xs font-medium text-slate-400 mt-2">Locked. Unlocks in Season 2.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
