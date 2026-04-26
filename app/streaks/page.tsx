'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Flame, Trophy, Zap, Star, TrendingUp, ChevronLeft, CheckCircle, Circle, Calendar, Crown, Medal, Users } from 'lucide-react';
import Link from 'next/link';

// ── helpers ─────────────────────────────────────────────────────────────────
function getIST() { return new Date(Date.now() + 5.5 * 60 * 60 * 1000); }
function todayIST() { return getIST().toISOString().slice(0, 10); }

function calendarDays(n: number): string[] {
    const days: string[] = [];
    const now = getIST();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

// ── Streak ring ──────────────────────────────────────────────────────────────
function StreakRing({ current, longest }: { current: number; longest: number }) {
    const pct = longest > 0 ? Math.min(current / longest, 1) : current > 0 ? 1 : 0;
    const r = 56, circ = 2 * Math.PI * r;
    return (
        <div className="relative flex items-center justify-center" style={{ width: 144, height: 144 }}>
            <svg width={144} height={144} className="absolute rotate-[-90deg]">
                <circle cx={72} cy={72} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} className="dark:stroke-slate-800" />
                <circle cx={72} cy={72} r={r} fill="none" stroke="url(#streakGrad)" strokeWidth={10}
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }} />
                <defs>
                    <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="flex flex-col items-center gap-0.5 z-10">
                <Flame className={`w-7 h-7 ${current > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-300 dark:text-slate-600'}`} fill={current > 0 ? '#f97316' : 'none'} />
                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{current}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">day streak</span>
            </div>
        </div>
    );
}

// ── Daily progress dots ──────────────────────────────────────────────────────
function DailyProgress({ solved, goal }: { solved: number; goal: number }) {
    return (
        <div className="flex gap-3 items-center justify-center">
            {Array.from({ length: goal }).map((_, i) => (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    i < solved
                        ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                    {i < solved ? <CheckCircle className="w-5 h-5 text-white" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                </div>
            ))}
        </div>
    );
}

// ── Activity heatmap ─────────────────────────────────────────────────────────
function Heatmap({ activeDays }: { activeDays: Set<string> }) {
    const days = calendarDays(35);
    const today = todayIST();
    const firstDate = new Date(days[0] + 'T00:00:00');
    const startOffset = firstDate.getDay();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-7 gap-0.5">
                {dayNames.map((d, i) => <div key={i} className="text-[9px] font-black text-slate-400 text-center mb-0.5">{d}</div>)}
                {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} />)}
                {days.map(day => {
                    const isActive = activeDays.has(day);
                    const isToday = day === today;
                    return (
                        <div key={day} title={day}
                            className={`aspect-square rounded-sm transition-all ${
                                isToday
                                    ? isActive ? 'bg-orange-500 ring-2 ring-orange-400 ring-offset-1' : 'ring-2 ring-orange-300 dark:ring-orange-700 rounded-sm'
                                    : isActive ? 'bg-orange-400' : 'bg-slate-100 dark:bg-slate-800'
                            }`} />
                    );
                })}
            </div>
            <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" /><span className="text-[9px] text-slate-400">None</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-orange-400" /><span className="text-[9px] text-slate-400">Active</span></div>
            </div>
        </div>
    );
}

// ── Friends Streak Board ─────────────────────────────────────────────────────
type FriendStreak = {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    streak: number;
    goalMetToday: boolean;
    rank: number;
};

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" fill="#eab308" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" fill="#94a3b8" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" fill="#d97706" />;
    return <span className="text-[11px] font-black text-slate-400 w-4 text-center">#{rank}</span>;
}

function FriendsStreakBoard({ myId, myStreak, myName, myUsername, myAvatar }: {
    myId: string; myStreak: number; myName: string; myUsername: string; myAvatar: string | null;
}) {
    const [friends, setFriends] = useState<FriendStreak[]>([]);
    const [loading, setLoading] = useState(true);
    const today = todayIST();

    useEffect(() => {
        const load = async () => {
            // 1. Get IDs of people I follow
            const { data: followRows } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', myId);

            if (!followRows || followRows.length === 0) { setLoading(false); return; }
            const followingIds = followRows.map(r => r.following_id);

            // 2. Fetch their profiles (streak data)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, streak_count, daily_solve_count, daily_solve_date')
                .in('id', followingIds);

            if (!profiles) { setLoading(false); return; }

            const friendList: FriendStreak[] = profiles.map(p => ({
                id: p.id,
                name: p.full_name || `@${p.username}` || 'User',
                username: p.username || '',
                avatar: p.avatar_url || null,
                streak: Number(p.streak_count) || 0,
                goalMetToday: p.daily_solve_date === today && (Number(p.daily_solve_count) || 0) >= 2,
                rank: 0,
            }));

            // Add self
            friendList.push({
                id: myId,
                name: myName,
                username: myUsername,
                avatar: myAvatar,
                streak: myStreak,
                goalMetToday: false, // will be overridden by parent's real data
                rank: 0,
            });

            // Sort by streak desc
            friendList.sort((a, b) => b.streak - a.streak);
            friendList.forEach((f, i) => { f.rank = i + 1; });

            setFriends(friendList);
            setLoading(false);
        };
        load();
    }, [myId, myStreak, myName, myUsername, myAvatar, today]);

    const myEntry = friends.find(f => f.id === myId);

    if (loading) return (
        <div className="flex items-center justify-center h-20">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
        </div>
    );

    if (friends.length <= 1) return (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-400">Follow friends to see their streaks here!</p>
            <Link href="/search" className="text-xs font-black text-orange-500 hover:underline">Find People →</Link>
        </div>
    );

    return (
        <div className="space-y-1.5">
            {/* My rank banner */}
            {myEntry && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 mb-3">
                    <Flame className="w-4 h-4 text-orange-500" fill="#f97316" />
                    <span className="text-sm font-black text-orange-700 dark:text-orange-400">
                        You're #{myEntry.rank} among friends with a {myEntry.streak}-day streak
                    </span>
                </div>
            )}

            {friends.map((friend, idx) => {
                const isMe = friend.id === myId;
                return (
                    <Link
                        key={friend.id}
                        href={friend.username ? `/user/${friend.username}` : '#'}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                            isMe
                                ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                        }`}
                    >
                        {/* Rank */}
                        <div className="w-5 flex items-center justify-center shrink-0">
                            <RankIcon rank={friend.rank} />
                        </div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {friend.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={friend.avatar} alt={friend.name}
                                    className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-black text-sm border-2 border-white dark:border-slate-900">
                                    {friend.name[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            {/* Goal met indicator */}
                            {friend.goalMetToday && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                    <span className="text-[6px]">🔥</span>
                                </div>
                            )}
                        </div>

                        {/* Name + info */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isMe ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                {friend.name}{isMe ? ' (you)' : ''}
                            </p>
                            {friend.goalMetToday && (
                                <p className="text-[10px] font-bold text-orange-500">✅ Goal met today</p>
                            )}
                        </div>

                        {/* Streak count */}
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                            friend.streak > 0
                                ? 'bg-orange-100 dark:bg-orange-900/20'
                                : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                            <Flame className={`w-3.5 h-3.5 ${friend.streak > 0 ? 'text-orange-500' : 'text-slate-400'}`}
                                fill={friend.streak > 0 ? '#f97316' : 'none'} />
                            <span className={`text-sm font-black ${friend.streak > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-slate-400'}`}>
                                {friend.streak}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function StreakPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!s) { router.push('/login'); return; }
            setSession(s);
            const [{ data: prof }, { data: atts }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', s.user.id).single(),
                supabase.from('question_attempts').select('created_at, is_correct').eq('user_id', s.user.id).order('created_at', { ascending: false }).limit(500),
            ]);
            setProfile(prof);
            setAttempts(atts || []);
            setLoading(false);
        };
        load();
    }, [router]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
    );
    if (!profile || !session) return null;

    // ── Derived stats ───────────────────────────────────────────────────────
    const streak = Number(profile.streak_count) || 0;
    const longest = Number(profile.streak_longest) || streak;
    const today = todayIST();
    const dailySolveDate = profile.daily_solve_date || null;
    const solvedToday = dailySolveDate === today ? (Number(profile.daily_solve_count) || 0) : 0;
    const goalMetToday = solvedToday >= 2;

    const totalAttempts = attempts.length;
    const accuracy = totalAttempts > 0 ? Math.round((attempts.filter(a => a.is_correct).length / totalAttempts) * 100) : 0;

    const activeDays = new Set(attempts.map(a => {
        const d = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
    }));

    const last7 = calendarDays(7);
    const weeklyData = last7.map(day => ({
        day,
        label: new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
        count: attempts.filter(a => {
            const d = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000);
            return d.toISOString().slice(0, 10) === day;
        }).length,
    }));
    const maxWeekly = Math.max(...weeklyData.map(d => d.count), 1);

    let statusMsg = '';
    let statusColor = 'text-slate-500';
    if (streak === 0) {
        statusMsg = 'Solve 2 questions today to start your streak! 🔥';
    } else if (goalMetToday) {
        statusMsg = "Today's goal done! Streak safe. 🎉";
        statusColor = 'text-emerald-600 dark:text-emerald-400';
    } else {
        const rem = 2 - solvedToday;
        statusMsg = `Solve ${rem} more question${rem > 1 ? 's' : ''} to keep your streak alive!`;
        statusColor = 'text-orange-600 dark:text-orange-400';
    }

    const MILESTONES = [
        { label: '3-day streak', target: 3, emoji: '🌱' },
        { label: '7-day streak', target: 7, emoji: '🔥' },
        { label: '14-day streak', target: 14, emoji: '⚡' },
        { label: '30-day streak', target: 30, emoji: '🏆' },
        { label: '100-day streak', target: 100, emoji: '👑' },
    ];

    const myName = profile.full_name || session.user.user_metadata?.fullName || 'You';
    const myUsername = profile.username || '';
    const myAvatar = profile.avatar_url || null;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24">
            <main className="max-w-5xl mx-auto px-4 pt-5 space-y-5">

                {/* Back */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">My Streak</h1>
                </div>

                {/* Responsive: 1 col mobile / 2 col desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                    {/* ── LEFT ── */}
                    <div className="space-y-5">

                        {/* Hero card */}
                        <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border rounded-3xl shadow-sm p-8 ${goalMetToday ? 'border-orange-200 dark:border-orange-800/40' : 'border-slate-200 dark:border-slate-800'}`}>
                            {streak > 0 && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/5 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-400/5 rounded-full blur-2xl" />
                                </div>
                            )}
                            <div className="flex flex-col items-center gap-5 relative z-10">
                                <StreakRing current={streak} longest={longest} />
                                <p className={`text-sm font-bold text-center px-4 ${statusColor}`}>{statusMsg}</p>
                                <div className="w-full space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Today's Goal — {solvedToday}/2 questions</p>
                                    <DailyProgress solved={Math.min(solvedToday, 2)} goal={2} />
                                </div>
                            </div>
                        </div>

                        {/* ── Friends Streak Board ── */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-500" />
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Friends Streak Board</p>
                            </div>
                            <FriendsStreakBoard
                                myId={session.user.id}
                                myStreak={streak}
                                myName={myName}
                                myUsername={myUsername}
                                myAvatar={myAvatar}
                            />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: Trophy, label: 'Longest', value: longest, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                                { icon: Zap, label: 'Accuracy', value: `${accuracy}%`, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                                { icon: Star, label: 'Solved', value: totalAttempts, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            ].map(({ icon: Icon, label, value, color, bg }) => (
                                <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm">
                                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Milestones */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-3">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Milestones</p>
                            <div className="space-y-2">
                                {MILESTONES.map(({ label, target, emoji }) => {
                                    const done = longest >= target;
                                    return (
                                        <div key={target} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${done ? 'border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-900/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                            <span className="text-xl">{emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold ${done ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
                                                {!done && (
                                                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-1000" style={{ width: `${Math.min(streak / target, 1) * 100}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                            {done
                                                ? <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                                : <span className="text-[10px] font-black text-slate-400 shrink-0">{streak}/{target}</span>
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>{/* end LEFT */}

                    {/* ── RIGHT ── */}
                    <div className="space-y-5">

                        {/* Weekly bar chart */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">This Week</p>
                            </div>
                            <div className="flex items-end gap-2 h-32">
                                {weeklyData.map(({ day, label, count }) => (
                                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex items-end justify-center" style={{ height: 104 }}>
                                            <div
                                                className={`w-full rounded-t-xl transition-all duration-700 ${day === today ? 'bg-gradient-to-t from-orange-500 to-rose-500' : count > 0 ? 'bg-orange-200 dark:bg-orange-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}
                                                style={{ height: `${Math.max((count / maxWeekly) * 104, count > 0 ? 10 : 4)}px` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-black ${day === today ? 'text-orange-500' : 'text-slate-400'}`}>{label}</span>
                                        {count > 0 && <span className="text-[9px] font-bold text-slate-400">{count}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Heatmap */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">35-Day Activity</p>
                            </div>
                            <Heatmap activeDays={activeDays} />
                        </div>

                        {/* CTA */}
                        {!goalMetToday && (
                            <button onClick={() => router.push('/')}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-base shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Flame className="w-5 h-5" fill="white" />
                                Solve Questions Now
                            </button>
                        )}

                    </div>{/* end RIGHT */}

                </div>
            </main>
        </div>
    );
}
