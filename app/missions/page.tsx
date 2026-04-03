'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';
import { CheckCircle2, Shield, BookOpen, Gift, Trophy, ArrowRight, Swords, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MissionsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchState() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data as Profile);
            setLoading(false);
        }
        fetchState();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    const ob = (profile?.onboarding || {}) as any;
    const quests = [
        {
            id: 'seen_tour',
            title: "Proclamation of Features",
            desc: "Finish the features induction tour to understand the forge mechanics.",
            instr: "Complete the 2-slide welcome carousel that appears on your first visit to the Home or Feed page.",
            icon: BookOpen,
            done: !!ob.seen_tour,
            href: "/feed"
        },
        {
            id: 'first_solve',
            title: "Battlefront Initiation",
            desc: "Prove your intellect by conquering your first question in the feed.",
            instr: "Go to the question feed and provide a correct answer to any active question.",
            icon: Swords,
            done: (profile?.daily_solved || 0) > 0 || !!ob.first_solve_checked,
            href: "/feed"
        }
    ];

    const completed = quests.filter(q => q.done).length;
    const isMaster = completed === quests.length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 pb-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">
                        The Induction Gauntlet
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 font-bold text-lg max-w-2xl">
                        Master the fundamentals of the Scholar Forge and earn your **10 Point Sage Blessing**. 🛡️🏆 🏇
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="md:col-span-2 space-y-6">
                        {quests.map((q) => (
                            <div key={q.id} className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${q.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex items-start gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${q.done ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-inner'}`}>
                                        <q.icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {q.done && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            <h3 className={`text-xl font-black uppercase italic tracking-tight ${q.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                {q.title}
                                            </h3>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 font-bold mb-4">{q.desc}</p>
                                        
                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-6">
                                            <p className="text-[11px] font-black uppercase italic text-indigo-500 mb-1">Mission Script:</p>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{q.instr}</p>
                                        </div>

                                        {!q.done ? (
                                            <Link href={q.href} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">
                                                Go to Mission
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        ) : (
                                            <div className="text-[12px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl w-fit">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Quest Accomplished
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-900 shadow-2xl border border-white/10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all rounded-full -mr-16 -mt-16" />
                           <Gift className="w-10 h-10 text-indigo-400 mb-6 animate-bounce" />
                           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">Induction Bounty</h3>
                           <p className="text-slate-400 font-bold mb-6">Complete all tasks to activate your 10 point blessing.</p>
                           
                           <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-white/5 shadow-inner">
                                <div 
                                    className="bg-indigo-500 h-full transition-all duration-1000 shadow-glow" 
                                    style={{ width: `${(completed/quests.length)*100}%` }} 
                                />
                           </div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-8">Gauntlet Status: {completed}/{quests.length}</p>

                           {isMaster ? (
                               <Link href="/" className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-center font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/40">
                                   <Sparkles className="w-4 h-4" />
                                   Claim 10 Pts
                               </Link>
                           ) : (
                               <div className="w-full py-4 rounded-2xl bg-slate-800 text-slate-500 text-center font-black flex items-center justify-center gap-2 border border-white/5 opacity-50">
                                   <Shield className="w-4 h-4" />
                                   Locked
                               </div>
                           )}
                        </div>

                        <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl group">
                            <Trophy className="w-8 h-8 text-amber-500 mb-4 group-hover:rotate-12 transition-transform" />
                            <h4 className="text-lg font-black text-slate-900 dark:text-white italic uppercase mb-2 leading-none">Top Ranks</h4>
                            <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">See where you stand against the world's greatest sages.</p>
                            <Link href="/leaderboard" className="block w-full py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-center text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                Global Leaderboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
