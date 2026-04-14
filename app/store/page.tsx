"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Star, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface StoreItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    type: string;
}

const STORE_ITEMS: StoreItem[] = [
    {
        id: 'avatar_glow',
        name: 'Mystic Avatar Glow',
        description: 'Adds a glowing, pulsing aura around your avatar on all profiles.',
        type: 'cosmetic',
        price: 100,
        icon: Sparkles,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    }
];

export default function StorePage() {
    const [points, setPoints] = useState<number>(0);
    const [cosmetics, setCosmetics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        const fetchPoints = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { data } = await supabase.from('profiles').select('total_points').eq('id', session.user.id).single();
                setPoints(data?.total_points || 0);
                
                // Get owned cosmetics from auth meta
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user?.user_metadata?.cosmetics) {
                    setCosmetics(userData.user.user_metadata.cosmetics);
                }
            }
            setLoading(false);
        };
        fetchPoints();
    }, []);

    const handlePurchase = async (item: StoreItem) => {
        if (cosmetics.includes(item.id)) return;
        if (points < item.price) {
            alert("Not enough points! Keep battling to earn more.");
            return;
        }
        
        const confirmBuy = window.confirm(`Buy ${item.name} for ${item.price} points?`);
        if (!confirmBuy) return;

        setPurchasing(item.id);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/store/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ itemId: item.id, price: item.price })
            });

            const data = await res.json();
            if (data.success) {
                setPoints(data.newPoints);
                setCosmetics(data.cosmetics);
                alert(`Successfully purchased ${item.name}! It is now equipped.`);
            } else {
                alert(data.error || 'Purchase failed');
            }
        } catch (e) {
            alert('Something went wrong!');
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Native Top Bar with Safe Area */}
            <div 
                className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-all"
                style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
            >
                <div className="flex items-center justify-between px-4 h-[3.5rem] max-w-[90rem] mx-auto w-full">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                        <ChevronLeft className="w-6 h-6 text-slate-800 dark:text-slate-200" />
                    </Link>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-indigo-500" /> Store
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </div>

            <div 
                className="w-full max-w-[90rem] mx-auto px-4 pt-6 md:px-8 xl:px-12 flex-1 relative"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}
            >
                
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-[2rem] p-6 shadow-xl shadow-indigo-500/20 mb-8 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <h2 className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Your Balance</h2>
                        {loading ? (
                             <div className="h-12 w-32 bg-white/20 animate-pulse rounded-xl mb-1"></div>
                        ) : (
                            <div className="flex items-center gap-2 text-4xl sm:text-5xl font-black text-white mb-1 tracking-tight">
                                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 drop-shadow-md" fill="currentColor" />
                                {points.toLocaleString()}
                            </div>
                        )}
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Keep dominating battles to earn more!</p>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" /> Avatar Cosmetics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {STORE_ITEMS.map(item => (
                                <ItemCard 
                                    key={item.id} 
                                    item={item} 
                                    points={points} 
                                    owned={cosmetics.includes(item.id)}
                                    purchasing={purchasing} 
                                    onBuy={() => handlePurchase(item)} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ItemCard({ item, points, owned, purchasing, onBuy }: { item: StoreItem, points: number, owned: boolean, purchasing: string | null, onBuy: () => void }) {
    const canAfford = points >= item.price;
    const isBuying = purchasing === item.id;
    const Icon = item.icon;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
            {owned && <div className="absolute inset-0 border-2 border-emerald-500 rounded-[2rem] pointer-events-none"></div>}
            
            <div className={`w-20 h-20 ${item.bg} rounded-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-10 h-10 ${item.color}`} />
            </div>
            
            <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2">{item.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex-1 font-medium">{item.description}</p>
            
            <button
                onClick={onBuy}
                disabled={isBuying || owned}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2
                    ${owned
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 cursor-default'
                        : canAfford 
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md hover:shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    }
                `}
            >
                {owned ? (
                    'Equipped'
                ) : isBuying ? (
                    <span className="animate-pulse">Processing...</span>
                ) : (
                    <>
                        <Star className="w-5 h-5 text-inherit" />
                        {item.price.toLocaleString()} Points
                    </>
                )}
            </button>
        </div>
    );
}
