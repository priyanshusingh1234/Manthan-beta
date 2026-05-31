"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Award, ArrowUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';

export default function ClientRankBanner() {
    const [userRankInfo, setUserRankInfo] = useState<{ rank: number, points: number } | null>(null);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user || !mounted) return;
            fetch(`/api/user-rank/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.rank && mounted) {
                        supabase.from('profiles').select('total_points').eq('id', user.id).single()
                        .then(({ data: profile }) => {
                            if (profile && mounted) {
                                setUserRankInfo({ rank: data.rank, points: profile.total_points });
                            }
                        });
                    }
                })
                .catch(err => console.error(err));
        });
        return () => { mounted = false; };
    }, []);

    if (!userRankInfo) return null;

    return (
        <View className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center flex-row">
            <View className="pointer-events-auto bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-700 w-full max-w-sm rounded-full p-2 flex items-center justify-between shadow-2xl animate-slideUp flex-row">
                <View className="flex items-center gap-3 flex-row">
                    <View className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black shadow-inner border border-indigo-400 flex-row">
                        #{userRankInfo.rank}
                    </View>
                    <View className="flex flex-col">
                        <Text className="text-white font-bold text-sm leading-tight">Your Rank</Text>
                        <Text className="text-slate-300 text-[10px] font-medium leading-tight">
                            {userRankInfo.points.toLocaleString()} pts • {userRankInfo.rank <= 50 ? 'Top 50!' : 'Keep grinding!'}
                        </Text>
                    </View>
                </View>
                {userRankInfo.rank > 50 && (
                    <Link href="/questions" className="mr-1 bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-black hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-md flex-row">
                        Rank Up <ArrowUp className="w-3 h-3" />
                    </Link>
                )}
                {userRankInfo.rank <= 50 && (
                    <View className="mr-3 text-amber-400">
                        <Award className="w-6 h-6" />
                    </View>
                )}
            </View>
        </View>
    );
}
