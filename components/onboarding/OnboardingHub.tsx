'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Swords, CheckCircle2, ChevronRight, ChevronLeft, Gift, Sparkles, BookOpen, Compass, Trophy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';
import Link from 'next/link';
import { clearRankCache } from '@/hooks/useTopRanks';

export default function OnboardingHub({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [showTour, setShowTour] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [minimized, setMinimized] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [hasClosedTourSession, setHasClosedTourSession] = useState(false);

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
        // only show tour if flag is strictly false/missing AND we haven't closed it this session
        if (!ob.seen_tour && !hasClosedTourSession && (pathname === '/feed' || pathname === '/')) {
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
                clearRankCache();
                router.refresh();
                router.push('/leaderboard?aura=celebration');
            } else {
                alert(data.error);
            }
        } finally {
            setIsClaiming(false);
        }
    }

    const closeTour = () => {
        setHasClosedTourSession(true);
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
            id: 'first_post', 
            label: 'Community Decree', 
            desc: 'Share your first post or thought in the Feed to connect with others.',
            done: !!ob.first_post_checked || (profile as any).posts_count > 0, 
            icon: Sparkles 
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
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.2)] overflow-hidden animate-popIn border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]">
                        <button onClick={closeTour} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2.5 sm:p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-110 active:scale-95 transition-all z-10">
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        <div className="p-6 pt-12 sm:p-14 overflow-y-auto overflow-x-hidden no-scrollbar">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] ${slides[currentSlide].bg} flex items-center justify-center mb-6 sm:mb-10 animate-float shadow-inner`}>
                                    {React.createElement(slides[currentSlide].icon, { className: `w-10 h-10 sm:w-12 sm:h-12 ${slides[currentSlide].color}` })}
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 sm:mb-6 italic uppercase leading-tight sm:leading-none">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 font-bold leading-relaxed max-w-sm mb-6 px-2 sm:px-0">
                                    {slides[currentSlide].desc}
                                </p>
                                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 w-full max-w-md">
                                    <p className="text-[12px] sm:text-[14px] font-black italic uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 sm:mb-2">Instructions:</p>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {slides[currentSlide].detail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="px-6 pb-6 sm:px-10 sm:pb-12 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2.5 sm:gap-3 order-2 sm:order-1">
                                {slides.map((_, i) => (
                                    <div key={i} className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 sm:w-12 bg-indigo-500 shadow-glow' : 'w-2.5 sm:w-3 bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                            <div className="flex gap-3 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                                {currentSlide > 0 && (
                                    <button onClick={() => setCurrentSlide(s => s - 1)} className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all text-slate-600 dark:text-slate-300">
                                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => currentSlide < slides.length - 1 ? setCurrentSlide(s => s + 1) : closeTour()}
                                    className="flex-1 sm:flex-none px-6 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all shadow-xl sm:shadow-2xl shadow-indigo-500/30 sm:shadow-indigo-500/40"
                                >
                                    <span>{currentSlide < slides.length - 1 ? "Next Chapter" : "Begin My Ascent"}</span>
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, 
                document.body
            )}

            {/* 📜 INLINE QUEST HUB TOGGLE */}
            <div className="relative">
                <button 
                    onClick={() => setMinimized(!minimized)}
                    className="relative w-10 h-10 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 md:bg-white/15 md:hover:bg-white/25 border border-indigo-500/20 md:border-white/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 md:text-white transition-all shadow-sm md:shadow-md active:scale-95 group"
                >
                    {isGrandMaster ? <Gift className="w-5 h-5 animate-bounce" /> : <Sparkles className="w-5 h-5" />}
                    {completedCount < items.length && (
                         <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 md:border-white md:dark:border-white shadow-sm animate-pulse">
                            {items.length - completedCount}
                        </span>
                    )}
                </button>

                {!minimized && (
                    <div className="absolute top-14 right-0 w-[320px] sm:w-80 bg-white dark:bg-slate-950 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border-2 border-indigo-100 dark:border-slate-800 overflow-hidden z-50 animate-in zoom-in-95 origin-top-right">
                        <div className="p-6 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-white dark:to-slate-950 flex items-center justify-between border-b border-indigo-100/50 dark:border-slate-800/80">
                            <div>
                                <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic mb-0.5">Induction Log</h3>
                                <p className="text-[11px] font-bold text-slate-500">Mastery: <span className="text-indigo-500">{completedCount}/{items.length}</span></p>
                            </div>
                            <button onClick={() => setMinimized(true)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                            {items.map((item) => (
                                <div key={item.id} className={`p-3 rounded-2xl border-2 transition-all ${item.done ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-500 dark:text-slate-400'}`}>
                                            {item.done ? <CheckCircle2 className="w-5 h-5" /> : React.createElement(item.icon, { className: "w-4 h-4" })}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-black leading-tight ${item.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {item.label}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-2">
                                                {item.done ? "Quest Accomplished! 🏁" : item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 space-y-2 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                disabled={!isGrandMaster || isClaiming}
                                onClick={handleClaim}
                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest italic transition-all ${isGrandMaster ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                            >
                                {isClaiming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                    <>
                                        <Gift className="w-4 h-4" />
                                        <span>{isGrandMaster ? "Claim 10 Pt Bounty" : "Gauntlet in Progress"}</span>
                                    </>
                                )}
                            </button>
                            
                            <div className="flex gap-2">
                                <Link 
                                    href="/missions" 
                                    onClick={() => setMinimized(true)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Details
                                </Link>
                                <Link 
                                    href="/leaderboard" 
                                    onClick={() => setMinimized(true)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
