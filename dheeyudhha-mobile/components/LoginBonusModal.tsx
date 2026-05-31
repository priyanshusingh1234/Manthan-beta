'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Gift, CheckCircle, X, Shield, Star, Coins } from 'lucide-react-native';
import { useRouter } from '@/lib/next-navigation';
import toast from 'react-hot-toast';

export default function LoginBonusModal({ onClose }: { onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [claimedToday, setClaimedToday] = useState(false);
    const [currentDay, setCurrentDay] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const meta = session.user.user_metadata || {};
            const day = Number(meta.loginBonusDay) || 0;
            setCurrentDay(day);

            const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
            const todayStr = nowIST.toISOString().slice(0, 10);
            if (meta.lastLoginClaimDate === todayStr) {
                setClaimedToday(true);
            }
        };
        load();
    }, []);

    const handleClaim = async () => {
        if (claimedToday) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch('/api/login-bonus/claim', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success(`Claimed ${data.pointsAwarded} points!`);
                setClaimedToday(true);
                setCurrentDay(data.newDay);
                if (data.completed) {
                    toast.success("7-Day Pioneer Badge Unlocked! 🏆");
                    setTimeout(() => {
                        window.location.reload(); // Hard reload to update UI state
                    }, 2000);
                }
                // Trigger event to update header points if needed
                window.dispatchEvent(new Event('user_metadata_updated'));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to claim bonus");
        } finally {
            setLoading(false);
        }
    };

    const days = [1, 2, 3, 4, 5, 6, 7];

    return (
        <View className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 flex-row" onPress={onClose}>
            <View className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative" onPress={e => e.stopPropagation()}>
                <View onPress={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-10">
                    <X size={20} />
                </View>

                <View className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center relative overflow-hidden">
                    <View className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></View>
                    <View className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-300 opacity-20 rounded-full blur-xl"></View>
                    <Gift size={48} className="mx-auto text-white mb-3" />
                    <Text className="text-2xl font-black text-white tracking-tight">7-Day Login Bonus</Text>
                    <Text className="text-indigo-100 font-medium mt-1">Claim your daily reward to grow faster!</Text>
                </View>

                <View className="p-6">
                    <View className="grid grid-cols-4 gap-3 mb-4">
                        {days.slice(0, 4).map(day => (
                            <DayCard key={day} day={day} currentDay={currentDay} claimedToday={claimedToday} />
                        ))}
                    </View>
                    <View className="grid grid-cols-3 gap-3 mb-6">
                        {days.slice(4, 7).map(day => (
                            <DayCard key={day} day={day} currentDay={currentDay} claimedToday={claimedToday} isLarge={day === 7} />
                        ))}
                    </View>

                    <View
                        onPress={handleClaim}
                        disabled={claimedToday || loading}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                            claimedToday
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white transform hover:-translate-y-1 hover:shadow-indigo-500/30'
                        }`}
                    >
                        {loading ? 'Claiming...' : claimedToday ? 'Come Back Tomorrow!' : 'Claim Reward Now'}
                    </View>
                </View>
            </View>
        </View>
    );
}

function DayCard({ day, currentDay, claimedToday, isLarge = false }: { day: number, currentDay: number, claimedToday: boolean, isLarge?: boolean }) {
    const isClaimed = day <= currentDay;
    const isNext = day === currentDay + 1 && !claimedToday;
    
    return (
        <View className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
            isClaimed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                : isNext
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500 shadow-sm transform -translate-y-1'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400'
        }`}>
            {isClaimed && (
                <View className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5 shadow-sm z-10">
                    <CheckCircle size={14} />
                </View>
            )}
            <View className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Day {day}</View>
            
            {day === 7 ? (
                <Shield className={`w-8 h-8 mb-1 ${isClaimed ? 'text-green-500' : isNext ? 'text-indigo-500' : 'text-slate-300'}`} />
            ) : (
                <View className="flex items-center gap-1 flex-row">
                    <Coins size={16} className={isClaimed ? 'text-green-500' : isNext ? 'text-orange-400' : 'text-slate-300'} />
                    <Text className={`text-lg font-black ${isClaimed ? '' : isNext ? 'text-slate-800 dark:text-white' : ''}`}>
                        {day * 5}
                    </Text>
                </View>
            )}
            
            {day === 7 && <View className="text-[10px] font-bold text-center mt-1 leading-tight text-indigo-600 dark:text-indigo-400">Pioneer<br/>Badge</View>}
        </View>
    );
}
