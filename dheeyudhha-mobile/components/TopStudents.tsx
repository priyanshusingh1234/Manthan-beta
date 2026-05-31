'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Loader2, ChevronRight, Star } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Image } from 'react-native';

interface Student {
    rank: number;
    avatar: string | null;
    name: string;
    username: string;
    points: number;
    streak: number;
    school: string;
    schoolColor: string;
    cosmetics?: string[];
}

const PODIUM = [
    { label: '2nd', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-300', height: 'h-16', crown: '🥈' },
    { label: '1st', gradient: 'from-yellow-300 to-amber-400', ring: 'ring-yellow-300', height: 'h-24', crown: '🥇' },
    { label: '3rd', gradient: 'from-orange-300 to-orange-400', ring: 'ring-orange-300', height: 'h-12', crown: '🥉' },
];

function Avatar({ student, size = 40 }: { student: Student; size?: number }) {
    const hasGlow = student.cosmetics?.includes('avatar_glow');
    
    return (
        <View className="relative shrink-0" style={{ width: size, height: size }}>
            {hasGlow && (
                <View className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-70 animate-pulse transition-opacity"></View>
            )}
            <View className={`relative w-full h-full rounded-full overflow-hidden ${hasGlow ? 'shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {student.avatar ? (
                    <Image source={{ uri: student.avatar }}
                        alt={student.name}
                        className="rounded-full object-cover w-full h-full"
                    />
                ) : (
                    <View
                        className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 flex-row"
                        style={{ fontSize: size * 0.4 }}
                    >
                        {String(student.name[0] || '?').toUpperCase()}
                    </View>
                )}
            </View>
        </View>
    );
}

export default function TopStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = useCallback(async () => {
        try {
            // Use the cached API endpoint (20-min Data Cache) instead of querying
            // Supabase directly — previously this bypassed the cache entirely.
            const res = await fetch('/api/leaderboard');
            if (!res.ok) return;
            const data = await res.json();
            const fetched: Student[] = (data.topBrains || []).map((p: any) => ({
                rank: p.rank,
                name: p.name || 'Student',
                username: p.username,
                school: p.school || 'Unknown',
                avatar: p.avatar || null,
                points: Number(p.points) || 0,
                streak: 0,
                schoolColor: 'bg-blue-500',
                cosmetics: p.cosmetics || [],
            }));
            setStudents(fetched);
            setLastUpdated(new Date());
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        // Reload when the user comes back to the tab — browser Cache-Control
        // handles not re-fetching until max-age expires (20 min)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') load();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [load]);

    const topScore = students.length > 0 ? students[0].points : 1;

    // Explicit podium mapping to ensure rank 1 is always in the middle slot
    const podiumStudents = [];
    if (students[1]) podiumStudents.push({ ...students[1], slotIndex: 0 }); // 2nd
    if (students[0]) podiumStudents.push({ ...students[0], slotIndex: 1 }); // 1st
    if (students[2]) podiumStudents.push({ ...students[2], slotIndex: 2 }); // 3rd

    return (
        <View className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/[0.06] dark:ring-white/[0.05] overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-5 pt-5 pb-8 relative overflow-hidden">
                {/* Background glows */}
                <View className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <View className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

                <View className="relative flex items-center justify-between mb-1 flex-row">
                    <View className="flex items-center gap-2 flex-row">
                        <View className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-row">
                            <Trophy className="h-4 w-4 text-yellow-300" />
                        </View>
                        <Text className="text-base font-black text-white tracking-tight">Top Students</Text>
                    </View>
                    <Link
                        href="/leaderboard"
                        className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-colors flex-row"
                    >
                        View All <ChevronRight className="w-3 h-3" />
                    </Link>
                </View>
                {lastUpdated && (
                    <Text className="relative text-[10px] text-white/50 ml-10">
                        Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}
            </View>

            {loading ? (
                <View className="flex flex-col items-center justify-center py-12 opacity-60">
                    <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                    <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500">Loading ranks...</Text>
                </View>
            ) : students.length === 0 ? (
                <View className="py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500 px-4">
                    <Star className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                    No students on the leaderboard yet. Be the first!
                </View>
            ) : (
                <>
                    {/* ── Podium (top 3) ─────────────────────────────────── */}
                    {podiumStudents.length >= 1 && (
                        <View className="flex items-end justify-center gap-3 px-4 -mt-6 mb-4 flex-row">
                            {podiumStudents.map((student) => {
                                const p = PODIUM[student.slotIndex];
                                const isFirst = student.slotIndex === 1;
                                return (
                                    <Link
                                        href={`/user/${student.username}`}
                                        key={student.rank}
                                        className="flex flex-col items-center gap-1 group"
                                    >
                                        {/* Crown emoji */}
                                        <Text className="text-xl leading-none">{p.crown}</Text>
                                        {/* Avatar with ring (Glow comes from within Avatar component now) */}
                                        <View className={`rounded-full ring-4 ${p.ring} shadow-lg group-hover:scale-105 transition-transform ${student.cosmetics?.includes('avatar_glow') ? 'ring-transparent' : ''}`}>
                                            <Avatar student={student} size={isFirst ? 52 : 42} />
                                        </View>
                                        {/* Name */}
                                        <Text className={`text-xs font-black text-slate-800 dark:text-slate-100 text-center truncate max-w-[70px] ${isFirst ? 'text-sm' : ''}`}>
                                            {(student.name || "Student").split(' ')[0]}
                                        </Text>
                                        {/* Points chip */}
                                        <Text className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${p.gradient} text-white shadow-sm`}>
                                            {student.points.toLocaleString()} pts
                                        </Text>
                                        {/* Podium block */}
                                        <View className={`w-14 ${p.height} rounded-t-xl bg-gradient-to-b ${p.gradient} opacity-30`} />
                                    </Link>
                                );
                            })}
                        </View>
                    )}

                    {/* ── Ranks 4+ ──────────────────────────────────────── */}
                    {students.length > 3 && (
                        <View className="px-4 pb-4 space-y-1">
                            <View className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />
                            {students.slice(3).map((student) => {
                                const percentage = topScore > 0 ? (student.points / topScore) * 100 : 0;
                                return (
                                    <Link
                                        href={`/user/${student.username}`}
                                        key={student.rank}
                                        className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex-row"
                                    >
                                        {/* Rank number */}
                                        <Text className="w-6 text-center text-xs font-black text-slate-400 dark:text-slate-500">
                                            {student.rank}
                                        </Text>

                                        {/* Avatar */}
                                        <View className="shrink-0">
                                            <Avatar student={student} size={32} />
                                        </View>

                                        {/* Info */}
                                        <View className="flex-1 min-w-0 flex-row">
                                            <View className="flex items-center gap-1.5 flex-row">
                                                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                                                    {student.name}
                                                </Text>
                                                {student.streak > 0 && (
                                                    <Text className="flex items-center gap-0.5 text-xs shrink-0 flex-row">
                                                        <Flame className="h-3 w-3 text-orange-500" />
                                                        <Text className="font-bold text-orange-600">{student.streak}</Text>
                                                    </Text>
                                                )}
                                            </View>
                                            {/* Progress bar */}
                                            <View className="mt-1 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <View
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </View>
                                        </View>

                                        {/* Points */}
                                        <View className="text-right shrink-0">
                                            <View className="text-sm font-black text-slate-700 dark:text-slate-300">{student.points.toLocaleString()}</View>
                                            <View className="text-[10px] text-slate-400 dark:text-slate-500">pts</View>
                                        </View>
                                    </Link>
                                );
                            })}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}
