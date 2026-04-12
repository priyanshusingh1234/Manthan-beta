'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Loader2, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';

interface Student {
    rank: number;
    avatar: string | null;
    name: string;
    username: string;
    points: number;
    streak: number;
    school: string;
    schoolColor: string;
}

const PODIUM = [
    { label: '2nd', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-300', height: 'h-16', crown: '🥈' },
    { label: '1st', gradient: 'from-yellow-300 to-amber-400', ring: 'ring-yellow-300', height: 'h-24', crown: '🥇' },
    { label: '3rd', gradient: 'from-orange-300 to-orange-400', ring: 'ring-orange-300', height: 'h-12', crown: '🥉' },
];

function Avatar({ student, size = 40 }: { student: Student; size?: number }) {
    if (student.avatar) {
        return (
            <Image
                src={student.avatar}
                alt={student.name}
                width={size}
                height={size}
                className="rounded-full object-cover bg-slate-100 dark:bg-slate-800"
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <div
            className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {String(student.name[0] || '?').toUpperCase()}
        </div>
    );
}

export default function TopStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, username, school, avatar_url, total_points')
                .eq('is_teacher', false)
                .not('username', 'is', null)
                .neq('username', '')
                .order('total_points', { ascending: false })
                .order('id', { ascending: true })
                .limit(10);

            if (!error && data) {
                const fetched = data.map((p, i) => ({
                    id: p.id,
                    rank: i + 1,
                    name: p.full_name || p.username || 'Student',
                    username: p.username,
                    school: p.school || 'Unknown',
                    avatar: p.avatar_url || null,
                    points: Number(p.total_points) || 0,
                    streak: 0,
                    schoolColor: 'bg-blue-500',
                }));
                setStudents(fetched);
                setLastUpdated(new Date());
            }
        } catch {
            // silent — polling will retry
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Always load fresh on mount
        load();

        // Listen for profile point changes via Realtime  
        const profileChannel = supabaseRealtime
            .channel('topstudents-profiles')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
            }, () => setTimeout(load, 600))
            .subscribe();

        // Refresh when user returns to this tab (e.g. after doing a quiz)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') load();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Fallback poll every 30s
        const interval = setInterval(load, 30_000);

        return () => {
            supabaseRealtime.removeChannel(profileChannel);
            document.removeEventListener('visibilitychange', handleVisibility);
            clearInterval(interval);
        };
    }, [load]);

    const topScore = students.length > 0 ? students[0].points : 1;

    // Explicit podium mapping to ensure rank 1 is always in the middle slot
    const podiumStudents = [];
    if (students[1]) podiumStudents.push({ ...students[1], slotIndex: 0 }); // 2nd
    if (students[0]) podiumStudents.push({ ...students[0], slotIndex: 1 }); // 1st
    if (students[2]) podiumStudents.push({ ...students[2], slotIndex: 2 }); // 3rd

    return (
        <aside className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/[0.06] dark:ring-white/[0.05] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-5 pt-5 pb-8 relative overflow-hidden">
                {/* Background glows */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-yellow-300" />
                        </div>
                        <h3 className="text-base font-black text-white tracking-tight">Top Students</h3>
                    </div>
                    <Link
                        href="/leaderboard"
                        className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-colors"
                    >
                        View All <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                {lastUpdated && (
                    <p className="relative text-[10px] text-white/50 ml-10">
                        Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                    <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Loading ranks...</p>
                </div>
            ) : students.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500 px-4">
                    <Star className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                    No students on the leaderboard yet. Be the first!
                </div>
            ) : (
                <>
                    {/* ── Podium (top 3) ─────────────────────────────────── */}
                    {podiumStudents.length >= 1 && (
                        <div className="flex items-end justify-center gap-3 px-4 -mt-6 mb-4">
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
                                        <span className="text-xl leading-none">{p.crown}</span>
                                        {/* Avatar with ring */}
                                        <div className={`rounded-full ring-4 ${p.ring} shadow-lg group-hover:scale-105 transition-transform`}>
                                            <Avatar student={student} size={isFirst ? 52 : 42} />
                                        </div>
                                        {/* Name */}
                                        <p className={`text-xs font-black text-slate-800 dark:text-slate-100 text-center truncate max-w-[70px] ${isFirst ? 'text-sm' : ''}`}>
                                            {(student.name || "Student").split(' ')[0]}
                                        </p>
                                        {/* Points chip */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${p.gradient} text-white shadow-sm`}>
                                            {student.points.toLocaleString()} pts
                                        </span>
                                        {/* Podium block */}
                                        <div className={`w-14 ${p.height} rounded-t-xl bg-gradient-to-b ${p.gradient} opacity-30`} />
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Ranks 4+ ──────────────────────────────────────── */}
                    {students.length > 3 && (
                        <div className="px-4 pb-4 space-y-1">
                            <div className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />
                            {students.slice(3).map((student) => {
                                const percentage = topScore > 0 ? (student.points / topScore) * 100 : 0;
                                return (
                                    <Link
                                        href={`/user/${student.username}`}
                                        key={student.rank}
                                        className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                                    >
                                        {/* Rank number */}
                                        <span className="w-6 text-center text-xs font-black text-slate-400 dark:text-slate-500">
                                            {student.rank}
                                        </span>

                                        {/* Avatar */}
                                        <div className="shrink-0">
                                            <Avatar student={student} size={32} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                                                    {student.name}
                                                </span>
                                                {student.streak > 0 && (
                                                    <span className="flex items-center gap-0.5 text-xs shrink-0">
                                                        <Flame className="h-3 w-3 text-orange-500" />
                                                        <span className="font-bold text-orange-600">{student.streak}</span>
                                                    </span>
                                                )}
                                            </div>
                                            {/* Progress bar */}
                                            <div className="mt-1 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-300">{student.points.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500">pts</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </aside>
    );
}
