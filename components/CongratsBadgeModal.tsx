'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import { Trophy, Share2, X, PartyPopper, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function CongratsBadgeModal() {
    const [userRank, setUserRank] = useState<number | null>(null);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkRank = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    const top3 = data.topBrains || [];
                    const myRank = top3.findIndex((u: any) => u.id === user.id);
                    
                    if (myRank !== -1 && myRank < 3) {
                        const actualRank = myRank + 1;
                        const lastShownKey = `badge_congrats_seen_${user.id}_rank${actualRank}`;
                        const alreadyShown = localStorage.getItem(lastShownKey);
                        
                        if (!alreadyShown) {
                            setUserRank(actualRank);
                            setShow(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to check rank for congrats:", err);
            } finally {
                setLoading(false);
            }
        };

        checkRank();
    }, []);

    const dismiss = () => {
        if (userRank) {
            supabase.auth.getUser().then(({ data: { user } }) => {
               if (user) {
                 localStorage.setItem(`badge_congrats_seen_${user.id}_rank${userRank}`, 'true');
               }
            });
        }
        setShow(false);
    };

    const handleShare = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch username for deep profile linking
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        const username = profile?.username || '';
        
        const shareTitle = `I just earned a ${userRank === 1 ? 'GOLD' : userRank === 2 ? 'SILVER' : 'BRONZE'} badge! 🏆`;
        const shareText = `I'm currently Rank #${userRank} on Dheeyudha! 🧠 Join the ultimate battle of brains and see if you can beat my score. @dheeyudha #Education #GamifiedLearning`;
        
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dheeyudhha-pi.vercel.app';
        const shareUrl = username ? `${origin}/user/${username}` : `${origin}/leaderboard`; 

        try {
            // Priority 1: Capacitor Native Sharing (for official Android/iOS apps)
            if (Capacitor.isNativePlatform()) {
                await Share.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                    dialogTitle: 'Share your achievement',
                });
                return;
            }

            // Priority 2: Web Share API (for mobile browsers like Chrome on Android)
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }

            // Priority 3: Fallback - Only if none of the above are available
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                alert("Share link copied! You can now paste it in any app.");
            }
        } catch (err) {
            console.error("Sharing operation failed:", err);
            // Ignore 'AbortError' which happens when user cancels the share sheet
        }
    };

    if (!show || !userRank) return null;

    const rankInfo = [
        { title: "CHAMPION", badge: <GoldBadge />, color: "from-amber-400 to-amber-700", text: "You are the undisputed leader of the leaderboard. Keep your crown!" },
        { title: "ELITE CHALLENGER", badge: <SilverBadge />, color: "from-slate-300 to-slate-600", text: "You've proven your brilliance. The top spot is only a few points away!" },
        { title: "PRO WARRIOR", badge: <BronzeBadge />, color: "from-orange-400 to-orange-700", text: "Outstanding performance! You are among the elite elite students." }
    ][userRank - 1];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={dismiss} />
            
            {/* Modal Card */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
                {/* Header Gradient */}
                <div className={`h-48 bg-gradient-to-br ${rankInfo.color} relative overflow-hidden flex items-center justify-center group`}>
                   {/* Animated particles background (simplified) */}
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center scale-[2.5] transition-transform duration-700 group-hover:scale-[3] group-hover:rotate-12">
                      {rankInfo.badge}
                   </div>
                   <PartyPopper className="absolute bottom-4 right-4 text-white/50 w-12 h-12" />
                </div>

                <div className="p-8 pb-10 text-center relative">
                    <button onClick={dismiss} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="mb-2 flex justify-center gap-1">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                        <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Badge Earned!</h2>
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Congratulations!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 px-2 lowercase italic">
                        "{rankInfo.text}"
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleShare}
                            className={`w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br ${rankInfo.color} text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform group`}
                        >
                            <Share2 className="w-5 h-5 group-hover:rotate-12" /> SHARE ACHIEVEMENT
                        </button>
                        <button 
                            onClick={dismiss}
                            className="w-full py-4 text-slate-400 dark:text-slate-600 font-bold hover:text-slate-600 dark:hover:text-slate-400 transition-colors text-sm uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
