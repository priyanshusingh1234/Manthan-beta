"use client";

import React, { useState, useEffect } from 'react';
import { User, BarChart3 } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Image } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

// Module-level cache shared across all leaderboard entries
const lbAvatarCache: Record<string, string | null> = {};

// Resilient avatar — queries profiles table directly when API returns null,
// identical to what the public profile page does.
function AvatarImage({ src, name, userId }: { src: string | null; name: string; userId: string }) {
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(src);
    const [failed, setFailed] = useState(false);
    const initials = (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        if (src) { setResolvedSrc(src); setFailed(false); return; }
        if (!userId) return;

        if (userId in lbAvatarCache) { setResolvedSrc(lbAvatarCache[userId]); return; }

        let mounted = true;
        supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .maybeSingle()
            .then(({ data }) => {
                if (!mounted) return;
                const raw = data?.avatar_url || null;
                const isGoogle = (u: string | null) => !!u && u.includes('googleusercontent.com');
                const url = raw && !isGoogle(raw) ? raw : null;
                lbAvatarCache[userId] = url;
                setResolvedSrc(url);
            })
            .catch(() => { /* non-fatal */ });

        return () => { mounted = false; };
    }, [src, userId]);

    const fallback = (
        <View className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[10px] font-black flex-row">
            {initials}
        </View>
    );

    if (!resolvedSrc || failed) return fallback;

    // Next.js <Image> proxies via /_next/image — bypasses ISP blocks on the Supabase domain.
    return (
        <Image
            source={{ uri: resolvedSrc }}
            alt={name}
            onError={() => setFailed(true)}
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800"
        />
    );
}


export default function TestLeaderboard({ testId }: { testId: string }) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userStats, setUserStats] = useState<any>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                const headers: any = {};
                if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

                const res = await fetch(`/api/test/leaderboard?testId=${testId}`, { headers });
                const data = await res.json();
                console.log('[TestLeaderboard] raw response:', JSON.stringify(data));
                if (data.error) throw new Error(data.error);
                setLeaderboard(data.leaderboard || []);
                setUserStats(data.userStats);
            } catch (err: any) {
                console.error("Leaderboard fetch failed:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [testId]);

    if (loading) return (
        <View className="w-full space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
                <View key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
            ))}
        </View>
    );

    if (error) return (
        <View className="w-full p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-3xl text-center space-y-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-red-500">Leaderboard Error</Text>
            <Text className="text-xs text-red-400 font-mono">{error}</Text>
            <Text className="text-[9px] text-red-300">testId: {testId}</Text>
        </View>
    );

    if (leaderboard.length === 0) {
        return (
            <View className="w-full p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recorded stats yet</Text>
                <Text className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">testId: {testId}</Text>
            </View>
        );
    }

    const isTop10 = userStats && leaderboard.some(e => e.userId === userStats.userId);

    return (
        <View className="w-full space-y-4">
            <View className="grid gap-2.5">
                {leaderboard.map((entry, idx) => (
                    <Link 
                        key={entry.userId}
                        href={`/user/${entry.username || entry.userId}`}
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.97] ${
                            idx === 0 
                                ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-500/30 shadow-md'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        } ${entry.userId === userStats?.userId ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-950' : ''}`}
                    >
                        {/* LEFT: rank + avatar + name */}
                        <View className="flex items-center gap-2.5 min-w-0 flex-row">
                            <View className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] ${
                                idx === 0 ? 'bg-amber-500 text-white' :
                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                idx === 2 ? 'bg-amber-700 text-white' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                                {entry.rank}
                            </View>
                            
                            {/* Avatar */}
                            <View className="relative w-9 h-9 shrink-0">
                                <AvatarImage
                                    src={entry.avatar}
                                    name={entry.name}
                                    userId={entry.userId}
                                />
                            </View>

                            {/* Name + School */}
                            <View className="flex flex-col min-w-0">
                                <Text className="text-xs font-black tracking-tight flex items-center gap-1 text-slate-900 dark:text-white flex-row">
                                    <Text className="truncate max-w-[90px] sm:max-w-[140px]">{entry.name}</Text>
                                    {entry.userId === userStats?.userId && <Text className="shrink-0 text-[7px] bg-indigo-600 text-white px-1 py-0.5 rounded-full uppercase leading-none">You</Text>}
                                </Text>
                                <Text className="text-[9px] font-bold text-slate-400 truncate max-w-[110px]">
                                    {entry.school || 'Scholar'}
                                </Text>
                            </View>
                        </View>

                        {/* RIGHT: score */}
                        <View className="shrink-0 text-right pl-2">
                            <View className="text-sm font-black italic text-indigo-600 dark:text-indigo-400">
                                {entry.score}<Text className="text-[9px] text-slate-400 font-bold">/{entry.maxScore}</Text>
                            </View>
                            <View className="text-[8px] font-black text-emerald-500 uppercase">
                                {entry.accuracy}% · {Math.floor(entry.timeTaken / 60)}m
                            </View>
                        </View>
                    </Link>
                ))}

                {/* Personal Rank Section */}
                {userStats && (
                    <View className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                        {!isTop10 && (
                            <View className="mb-4">
                                <View className="p-4 bg-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-500/10 flex items-center justify-between flex-row">
                                    <View className="flex items-center gap-4 flex-row">
                                        <View className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center font-black flex-row">
                                            #{userStats.rank || '??'}
                                        </View>
                                        <View className="flex flex-col">
                                            <Text className="text-sm font-black italic uppercase">Current Standing</Text>
                                            <Text className="text-[10px] opacity-70">Keep pushing for the Top 10!</Text>
                                        </View>
                                    </View>
                                    <View className="text-right">
                                        <Text className="text-lg font-black">{userStats.score} / {userStats.maxScore}</Text>
                                        <View className="text-[10px] font-bold opacity-60 uppercase">{userStats.accuracy}% Accuracy</View>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Link 
                            href={`/stats?testId=${testId}`} 
                            className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all shadow-sm flex-row"
                        >
                            <BarChart3 className="w-4 h-4" />
                            See Your Full Analytics
                        </Link>
                    </View>
                )}
            </View>
        </View>
    );
}
