"use client";

import React, { useEffect, useState, ReactNode } from 'react';
import { ShoppingBag, Star, ChevronLeft, Sparkles, X, CheckCircle2, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface StoreItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    imageUrl?: string;
}

const STORE_ITEMS: StoreItem[] = [
    {
        id: 'avatar_glow',
        name: 'Mystic Avatar Glow',
        description: 'Adds a glowing, pulsing aura around your avatar on all profiles.',
        type: 'cosmetic',
        price: 100,
    },
    {
        id: 'banner_cyberpunk',
        name: 'Cyberpunk City Banner',
        description: 'A neon-lit futuristic city background for your public profile.',
        type: 'banner',
        price: 99,
        imageUrl: '/banners/cyberpunk.png'
    },
    {
        id: 'banner_library',
        name: 'Ancient Library Banner',
        description: 'A mystical ancient library background for the true scholar.',
        type: 'banner',
        price: 99,
        imageUrl: '/banners/library.png'
    },
    {
        id: 'banner_galactic',
        name: 'Galactic Arena Banner',
        description: 'A deep space nebula background for your public profile.',
        type: 'banner',
        price: 99,
        imageUrl: '/banners/galactic.png'
    }
];

// Native overlay styled popup
function NativePopup({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isPurchasing = false, success = false }: any) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={!isPurchasing ? onCancel : undefined}></div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-6 relative z-10 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {success ? (
                    <div className="flex flex-col items-center text-center py-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                        <button 
                            onClick={onConfirm}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-bold active:scale-95 transition-transform"
                        >
                            Awesome!
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col text-center">
                        <div className="absolute right-4 top-4">
                            {!isPurchasing && (
                                <button onClick={onCancel} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 pt-2">{title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">{message}</p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={onCancel}
                                disabled={isPurchasing}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={onConfirm}
                                disabled={isPurchasing}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-indigo-500/20 disabled:opacity-80 flex justify-center items-center gap-2"
                            >
                                {isPurchasing ? <span className="animate-pulse">Processing...</span> : confirmText}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfilePreviewModal({ isOpen, onClose, item, userProfile }: any) {
    if (!isOpen || !item || !userProfile) return null;

    const isGlow = item.id === 'avatar_glow';
    const isBanner = item.type === 'banner';
    const bannerUrl = isBanner ? item.imageUrl : userProfile.banner_url;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                
                {/* Mini Profile Card */}
                <div className="w-full relative bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    {/* Banner */}
                    <div className="h-40 w-full relative bg-slate-800 overflow-hidden">
                        {bannerUrl ? (
                            <img src={bannerUrl} alt="banner" className="w-full h-full object-cover opacity-90 scale-105" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-90" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    </div>
                    
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-xl p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center text-center -mt-10 relative z-10 mx-2">
                        <div className="relative shrink-0">
                            {isGlow && (
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-70 animate-pulse transition-opacity -mt-12"></div>
                            )}
                            {userProfile.avatar_url ? (
                                <img src={userProfile.avatar_url} className={`w-24 h-24 rounded-full object-cover shadow-xl relative -mt-12 bg-white dark:bg-slate-900 ${isGlow ? 'ring-4 ring-transparent shadow-indigo-500/50' : 'ring-4 ring-white dark:ring-slate-900'}`} alt="Avatar" />
                            ) : (
                                <div className={`w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-3xl font-bold text-indigo-500 dark:text-indigo-400 shadow-xl relative -mt-12 ${isGlow ? 'ring-4 ring-transparent shadow-indigo-500/50' : 'ring-4 ring-white dark:ring-slate-900'}`}>
                                    {String(userProfile.full_name?.[0] || 'S').toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-3">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                                {userProfile.full_name || 'Student'}
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                            </h2>
                            <p className="text-indigo-500 font-medium">@{userProfile.username || 'student'}</p>
                        </div>
                        
                        <div className="mt-6 w-full flex items-center justify-center gap-4">
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
                                <Star className="w-4 h-4 text-amber-500" /> {userProfile.total_points?.toLocaleString() || 0} pts
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-white/70 font-medium text-sm">This is how your public profile will look to others.</p>
                </div>
            </div>
        </div>
    );
}

export default function StorePage() {
    const [points, setPoints] = useState<number>(0);
    const [cosmetics, setCosmetics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);
    
    // Dialog state
    const [dialogState, setDialogState] = useState<{isOpen: boolean, item: StoreItem | null, isSuccess: boolean, message: string}>({
        isOpen: false,
        item: null,
        isSuccess: false,
        message: ''
    });

    useEffect(() => {
        const fetchPoints = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { data } = await supabase.from('profiles').select('total_points, full_name, username, avatar_url, banner_url').eq('id', session.user.id).single();
                setPoints(data?.total_points || 0);
                setUserProfile(data);
                
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

    const triggerBuyDialog = (item: StoreItem) => {
        if (cosmetics.includes(item.id)) return;
        if (points < item.price) {
            setDialogState({
                isOpen: true,
                item,
                isSuccess: false,
                message: "Not enough points! Keep battling to earn more."
            });
            return;
        }
        
        setDialogState({
            isOpen: true,
            item,
            isSuccess: false,
            message: `Do you want to unlock ${item.name} for ${item.price} points?`
        });
    };

    const executePurchase = async () => {
        const item = dialogState.item;
        if (!item) return;

        // If it was just an error message, close the dialog
        if (points < item.price) {
            setDialogState(prev => ({...prev, isOpen: false, item: null}));
            return;
        }

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
                setDialogState({
                    isOpen: true,
                    item,
                    isSuccess: true,
                    message: "Successfully purchased! Your avatar now has the mystic glow."
                });
            } else {
                setDialogState({
                    isOpen: true,
                    item,
                    isSuccess: false,
                    message: data.error || 'Purchase failed.'
                });
            }
        } catch (e) {
            setDialogState({
                isOpen: true,
                item,
                isSuccess: false,
                message: 'Something went wrong. Please check your connection.'
            });
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col pt-[max(env(safe-area-inset-top),_0.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
            
            <NativePopup 
                isOpen={dialogState.isOpen}
                title={dialogState.isSuccess ? 'Success!' : (points < (dialogState.item?.price||0) ? 'Not Enough Points' : 'Confirm Purchase')}
                message={dialogState.message}
                isPurchasing={!!purchasing}
                success={dialogState.isSuccess}
                confirmText={`Pay ${dialogState.item?.price||0} Pts`}
                onConfirm={dialogState.isSuccess || points < (dialogState.item?.price||0) ? () => setDialogState(prev => ({...prev, isOpen: false})) : executePurchase}
                onCancel={() => setDialogState(prev => ({...prev, isOpen: false}))}
            />

            <ProfilePreviewModal 
                isOpen={!!previewItem} 
                onClose={() => setPreviewItem(null)} 
                item={previewItem} 
                userProfile={userProfile} 
            />

            {/* Native Top Bar */}
            <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto w-full shrink-0">
                <Link href="/" className="p-2 -ml-2 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm">
                    <ChevronLeft className="w-6 h-6 text-slate-800 dark:text-slate-200" />
                </Link>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                     Points Store <ShoppingBag className="w-5 h-5 text-indigo-500" />
                </h1>
                <div className="w-10" />
            </div>

            <div className="w-full max-w-lg mx-auto px-4 pt-4 flex-1 flex flex-col gap-6 relative">
                
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/30 relative overflow-hidden shrink-0">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <h2 className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-3 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">Your Balance</h2>
                        {loading ? (
                             <div className="h-14 w-40 bg-white/20 animate-pulse rounded-2xl mb-1 mt-2"></div>
                        ) : (
                            <div className="flex items-center gap-2 text-5xl sm:text-6xl font-black text-white mb-2 tracking-tighter">
                                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-lg" fill="currentColor" />
                                {points.toLocaleString()}
                            </div>
                        )}
                        <p className="text-indigo-50 text-sm font-medium mt-1">Ready to upgrade your profile?</p>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2 ml-2">
                        <Sparkles className="w-5 h-5 text-indigo-500 drop-shadow-sm" /> Premium Cosmetics
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                        {STORE_ITEMS.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6 transition-all hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xl relative overflow-hidden group">
                                {cosmetics.includes(item.id) && <div className="absolute inset-0 border-[3px] border-emerald-500 rounded-[2.5rem] pointer-events-none z-10"></div>}
                                
                                {item.type === 'banner' ? (
                                    <div className="relative shrink-0 w-full sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Preview" />
                                    </div>
                                ) : (
                                    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 group-hover:scale-105 transition-transform duration-500">
                                        {/* The Actual Glow Preview */}
                                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-70 animate-pulse"></div>
                                        <img src="https://ui-avatars.com/api/?name=St&background=e2e8f0&color=475569" className="w-full h-full rounded-full object-cover relative bg-white border-4 border-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]" alt="Preview" />
                                    </div>
                                )}
                                
                                <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start w-full">
                                    <h4 className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-2 tracking-tight">{item.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">{item.description}</p>
                                    
                                    <div className="flex w-full sm:w-auto gap-3">
                                        <button
                                            onClick={() => setPreviewItem(item)}
                                            className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700"
                                            title="Live Preview"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        
                                        <button
                                            onClick={() => triggerBuyDialog(item)}
                                            disabled={purchasing === item.id || cosmetics.includes(item.id)}
                                            className={`flex-1 sm:w-48 px-6 py-3.5 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 transition-all active:scale-95 border-2
                                                ${cosmetics.includes(item.id)
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 cursor-default shadow-inner'
                                                    : points >= item.price 
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {cosmetics.includes(item.id) ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" /> Equipped
                                                </>
                                            ) : (
                                                <>
                                                    <Star className="w-5 h-5 text-inherit" />
                                                    {item.price.toLocaleString()} Pts
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
