'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Shield, Swords, CheckCircle2, ChevronRight, ChevronLeft, Gift, Sparkles, BookOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/profiles';

export default function OnboardingHub() {
    const pathname = usePathname();
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
        const channel = supabase.channel('onboarding-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchProfile();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pathname]);

    async function fetchProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setProfile(data as Profile);
            const ob = data.onboarding || {};
            if (!ob.seen_tour && (pathname === '/feed' || pathname === '/')) {
                setShowTour(true);
            }
        } else {
            // FALLBACK for brand new users without a profile row yet
            const ob = user.user_metadata?.onboarding || {};
            // Mock a profile object for UI rendering
            setProfile({
                id: user.id,
                username: user.user_metadata?.username || 'Initiate',
                daily_solved: 0,
                total_points: user.user_metadata?.totalPoints || 0,
                onboarding: ob as any,
                updated_at: new Date().toISOString(),
                bio: null,
                avatar_url: user.user_metadata?.avatar_url || null,
                is_teacher: !!user.user_metadata?.isTeacher,
                is_ghost: !!user.user_metadata?.isGhost
            } as any);

            if (!ob.seen_tour && (pathname === '/feed' || pathname === '/')) {
                setShowTour(true);
            }
        }
    }

    async function updateFlag(flag: string) {
        await fetch('/api/onboarding/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flag })
        });
        fetchProfile();
    }

    async function handleClaim() {
        setIsClaiming(true);
        try {
            const res = await fetch('/api/onboarding/claim', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                fetchProfile();
                setMinimized(true);
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

    const ob = profile.onboarding || {};
    if (ob.claimed_bonus) return null; // Fully done!

    const items = [
        { id: 'seen_tour', label: 'Finish Feature Tour', done: !!ob.seen_tour, icon: BookOpen },
        { id: 'first_solve', label: 'Solve 1st Question', done: profile.daily_solved > 0 || !!ob.first_solve_checked, icon: Shield },
    ];

    const completedCount = items.filter(i => i.done).length;
    const isGrandMaster = completedCount === items.length;

    const slides = [
        {
            title: "Faction War Room",
            desc: "Join a school, build your squad, and dominate the global rankings in intense educational battles.",
            icon: Swords,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Co-op Forge",
            desc: "Partner with allies to solve the toughest questions. Split the points, double the wisdom.",
            icon: Shield,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        }
    ];

    return (
        <>
            {showTour && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-popIn border border-white/20">
                        <button onClick={closeTour} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-transform">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 sm:p-12">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-3xl ${slides[currentSlide].bg} flex items-center justify-center mb-8 animate-float`}>
                                    {React.createElement(slides[currentSlide].icon, { className: `w-10 h-10 ${slides[currentSlide].color}` })}
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 italic uppercase">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-xs">
                                    {slides[currentSlide].desc}
                                </p>
                            </div>
                        </div>

                        <div className="px-8 pb-10 flex items-center justify-between">
                            <div className="flex gap-2">
                                {slides.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                            <div className="flex gap-3">
                                {currentSlide > 0 && (
                                    <button onClick={() => setCurrentSlide(s => s - 1)} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => currentSlide < slides.length - 1 ? setCurrentSlide(s => s + 1) : closeTour()}
                                    className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <span>{currentSlide < slides.length - 1 ? "Next Sage Wisdom" : "Start Journey"}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, 
                document.body
            )}

            <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50">
                {minimized ? (
                    <button 
                        onClick={() => setMinimized(false)}
                        className="relative w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                    >
                        {isGrandMaster ? <Gift className="w-6 h-6 animate-bounce" /> : <BookOpen className="w-6 h-6" />}
                        {completedCount > 0 && !isGrandMaster && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black flex items-center justify-center">
                                {completedCount}
                            </span>
                        )}
                    </button>
                ) : (
                    <div className="w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-popIn">
                        <div className="p-6 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-purple-50 dark:to-purple-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic">Initiate Quest</h3>
                                <p className="text-xs font-bold text-slate-500">Progress: {completedCount}/{items.length}</p>
                            </div>
                            <button onClick={() => setMinimized(true)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.done ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                        {item.done ? <CheckCircle2 className="w-4 h-4" /> : React.createElement(item.icon, { className: "w-4 h-4" })}
                                    </div>
                                    <span className={`text-[13px] font-bold ${item.done ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-60' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 pt-0">
                            <button 
                                disabled={!isGrandMaster || isClaiming}
                                onClick={handleClaim}
                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest transition-all ${isGrandMaster ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                            >
                                {isClaiming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                    <>
                                        <Gift className="w-4 h-4" />
                                        <span>{isGrandMaster ? "Claim 10 Pts Bounty" : "Unlock Bounty"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
