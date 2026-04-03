'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Swords, CheckCircle2, ChevronRight, ChevronLeft, Gift, Sparkles, BookOpen, Compass, Trophy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';
import Link from 'next/link';

export default function OnboardingHub() {
    const pathname = usePathname();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [showTour, setShowTour] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [minimized, setMinimized] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchProfile();
        
        // Realtime sync for points and onboarding state
        const channel = supabase.channel('onboarding-sync-final')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchProfile();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const ob = (data?.onboarding || user.user_metadata?.onboarding || {}) as any;

        if (data) {
            setProfile(data as Profile);
        } else {
            // Mock profile
            setProfile({
                id: user.id,
                onboarding: ob,
                daily_solved: 0,
                total_points: user.user_metadata?.totalPoints || 0,
                username: user.user_metadata?.username || 'Initiate'
            } as any);
        }

        // AUTO-TRIGGER LOGIC
        // only show tour if flag is strictly false/missing
        if (!ob.seen_tour && (pathname === '/feed' || pathname === '/')) {
            setShowTour(true);
        }
    }

    async function updateFlag(flag: string) {
        // Optimistic local update to prevent re-opening immediately
        if (profile) {
            const newOb = { ...(profile.onboarding || {}), [flag]: true };
            setProfile({ ...profile, onboarding: newOb });
        }

        await fetch('/api/onboarding/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flag })
        });
        // We don't call fetchProfile() immediately to avoid re-triggering logic before state settles
    }

    async function handleClaim() {
        setIsClaiming(true);
        try {
            const res = await fetch('/api/onboarding/claim', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                fetchProfile();
                setMinimized(true);
                router.push('/leaderboard?aura=celebration');
            } else {
                alert(data.error);
            }
        } finally {
            setIsClaiming(false);
        }
    }

    const closeTour = () => {
        setShowTour(false);
        updateFlag('seen_tour');
    };

    if (!mounted || !profile) return null;

    const ob = (profile.onboarding || {}) as any;
    if (ob.claimed_bonus) return null; // Fully done!

    const items = [
        { 
            id: 'seen_tour', 
            label: 'The Proclamation', 
            desc: 'Finish the 2-slide Feature Tour to understand your powers.',
            done: !!ob.seen_tour, 
            icon: BookOpen 
        },
        { 
            id: 'first_solve', 
            label: 'Combat Trial', 
            desc: 'Solve your first question correctly in the Feed.',
            done: profile.daily_solved > 0 || !!ob.first_solve_checked, 
            icon: Shield 
        },
    ];

    const completedCount = items.filter(i => i.done).length;
    const isGrandMaster = completedCount === items.length;

    const slides = [
        {
            title: "Faction War Room",
            desc: "Dominance through intellect. Join your school, build your squad, and crush rivals in coordinated educational battles.",
            detail: "OBJECTIVE: Visit your school page to join a faction or search for your allies. Victory awards shared points to your school.",
            icon: Swords,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Co-op Forge",
            desc: "Partner with sages across the world. Take on legendary multi-part questions that require co-op strategy.",
            detail: "STRENGTH IN NUMBERS: Split points with partners on tougher written solutions. Your legacy grows with your allies.",
            icon: Shield,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        }
    ];

    return (
        <>
            {/* 🚀 WELCOME CAROUSEL MODAL */}
            {showTour && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.2)] overflow-hidden animate-popIn border border-white/20">
                        <button onClick={closeTour} className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-110 active:scale-95 transition-all z-10">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-10 sm:p-14">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-24 h-24 rounded-[2rem] ${slides[currentSlide].bg} flex items-center justify-center mb-10 animate-float shadow-inner`}>
                                    {React.createElement(slides[currentSlide].icon, { className: `w-12 h-12 ${slides[currentSlide].color}` })}
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 italic uppercase leading-none">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 text-lg font-bold leading-relaxed max-w-sm mb-6">
                                    {slides[currentSlide].desc}
                                </p>
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 max-w-md">
                                    <p className="text-[14px] font-black italic uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Instructions:</p>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {slides[currentSlide].detail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="px-10 pb-12 flex items-center justify-between">
                            <div className="flex gap-3">
                                {slides.map((_, i) => (
                                    <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-12 bg-indigo-500 shadow-glow' : 'w-3 bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                            <div className="flex gap-4">
                                {currentSlide > 0 && (
                                    <button onClick={() => setCurrentSlide(s => s - 1)} className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => currentSlide < slides.length - 1 ? setCurrentSlide(s => s + 1) : closeTour()}
                                    className="px-8 py-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-2xl shadow-indigo-500/40"
                                >
                                    <span>{currentSlide < slides.length - 1 ? "Next Chapter" : "Begin My Ascent"}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, 
                document.body
            )}

            {/* 📜 FLOATING INITIATE HANDBOOK (Minimized) */}
            <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50">
                {minimized ? (
                    <button 
                        onClick={() => setMinimized(false)}
                        className="relative w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_15px_35px_rgba(79,70,229,0.3)] hover:scale-110 active:scale-95 transition-all group"
                    >
                        {isGrandMaster ? <Gift className="w-7 h-7 animate-bounce" /> : <Sparkles className="w-7 h-7" />}
                        {completedCount < items.length && (
                             <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 border-4 border-white dark:border-slate-900 text-[11px] font-black flex items-center justify-center shadow-lg animate-pulse">
                                {items.length - completedCount}
                            </span>
                        )}
                    </button>
                ) : (
                    <div className="w-80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800/80 overflow-hidden animate-popIn">
                        <div className="p-7 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic mb-0.5">Induction Log</h3>
                                <p className="text-xs font-bold text-slate-500">Mastery: {completedCount}/{items.length}</p>
                            </div>
                            <button onClick={() => setMinimized(true)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className={`p-4 rounded-2xl border-2 transition-all ${item.done ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            {item.done ? <CheckCircle2 className="w-5 h-5" /> : React.createElement(item.icon, { className: "w-5 h-5" })}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[14px] font-black ${item.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {item.label}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-1">
                                                {item.done ? "Quest Accomplished! 🏁" : item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-5 pb-6 space-y-3">
                            <button 
                                disabled={!isGrandMaster || isClaiming}
                                onClick={handleClaim}
                                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest italic transition-all ${isGrandMaster ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                            >
                                {isClaiming ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                    <>
                                        <Gift className="w-5 h-5" />
                                        <span>{isGrandMaster ? "Claim 10 Pt Bounty" : "Gauntlet in Progress"}</span>
                                    </>
                                )}
                            </button>
                            
                            <div className="flex gap-2">
                                <Link 
                                    href="/missions" 
                                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50"
                                >
                                    Mission Page
                                </Link>
                                <Link 
                                    href="/leaderboard" 
                                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50"
                                >
                                    Ranks
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
