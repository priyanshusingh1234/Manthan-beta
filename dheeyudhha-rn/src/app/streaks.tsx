import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { Flame, Trophy, Zap, Star, TrendingUp, ChevronLeft, Calendar, Crown, Medal, Users, CheckCircle, Circle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

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

function StreakRing({ current, longest, isDark }: { current: number; longest: number; isDark: boolean }) {
    const pct = longest > 0 ? Math.min(current / longest, 1) : current > 0 ? 1 : 0;
    const r = 56, circ = 2 * Math.PI * r;
    return (
        <View className="items-center justify-center relative" style={{ width: 144, height: 144 }}>
            <Svg width={144} height={144} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Defs>
                    <LinearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#f97316" />
                        <Stop offset="100%" stopColor="#ef4444" />
                    </LinearGradient>
                </Defs>
                <SvgCircle cx={72} cy={72} r={r} fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth={10} />
                <SvgCircle cx={72} cy={72} r={r} fill="none" stroke="url(#streakGrad)" strokeWidth={10}
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round" />
            </Svg>
            <View className="items-center justify-center z-10">
                <Flame size={28} color={current > 0 ? '#f97316' : (isDark ? '#475569' : '#cbd5e1')} fill={current > 0 ? '#f97316' : 'none'} />
                <Text className="text-4xl font-black text-slate-900 dark:text-white leading-none mt-1">{current}</Text>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">day streak</Text>
            </View>
        </View>
    );
}

function DailyProgress({ solved, goal, isDark }: { solved: number; goal: number; isDark: boolean }) {
    return (
        <View className="flex-row gap-3 items-center justify-center mt-2">
            {Array.from({ length: goal }).map((_, i) => (
                <View key={i} className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                    i < solved
                        ? 'bg-orange-500 border-orange-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                }`}>
                    {i < solved ? <CheckCircle size={20} color="white" /> : <Circle size={20} color={isDark ? '#475569' : '#cbd5e1'} />}
                </View>
            ))}
        </View>
    );
}

function WeekHeatmap({ attempts, isDark }: { attempts: any[]; isDark: boolean }) {
    const days = calendarDays(7).reverse();
    const attemptsByDate = attempts.reduce((acc, a) => {
        const d = new Date(new Date(a.created_at).getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <View className="w-full mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Text className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 text-center">Week Activity</Text>
            <View className="flex-row items-center justify-between w-full px-2">
                {days.map((d) => {
                    const count = attemptsByDate[d] || 0;
                    const dateObj = new Date(d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    let bgClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                    if (count >= 2) bgClass = 'bg-orange-500 border-orange-600 dark:border-orange-400';
                    else if (count === 1) bgClass = 'bg-orange-300 dark:bg-orange-700 border-orange-400 dark:border-orange-600';

                    return (
                        <View key={d} className="items-center gap-1.5">
                            <View className={`w-7 h-7 rounded-md border ${bgClass}`} />
                            <Text className="text-[9px] font-bold text-slate-400 uppercase">{dayName[0]}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ── Friends Streak Board ─────────────────────────────────────────────────────
type FriendStreak = {
    id: string; name: string; username: string; avatar: string | null;
    streak: number; goalMetToday: boolean; rank: number;
};

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown size={16} color="#eab308" fill="#eab308" />;
    if (rank === 2) return <Medal size={16} color="#94a3b8" fill="#94a3b8" />;
    if (rank === 3) return <Medal size={16} color="#d97706" fill="#d97706" />;
    return <Text className="text-[11px] font-black text-slate-400 w-4 text-center">#{rank}</Text>;
}

function FriendsStreakBoard({ myId, myStreak, myName, myUsername, myAvatar, router }: {
    myId: string; myStreak: number; myName: string; myUsername: string; myAvatar: string | null; router: any;
}) {
    const [friends, setFriends] = useState<FriendStreak[]>([]);
    const [loading, setLoading] = useState(true);
    const today = todayIST();

    useEffect(() => {
        const load = async () => {
            const { data: followRows } = await supabase.from('follows').select('following_id').eq('follower_id', myId);
            if (!followRows || followRows.length === 0) { setLoading(false); return; }
            const followingIds = followRows.map((r: any) => r.following_id);

            const { data: profiles } = await supabase.from('profiles')
                .select('id, full_name, username, avatar_url, streak_count, daily_solve_count, daily_solve_date')
                .in('id', followingIds);

            if (!profiles) { setLoading(false); return; }

            const friendList: FriendStreak[] = profiles.map((p: any) => ({
                id: p.id,
                name: p.full_name || `@${p.username}` || 'User',
                username: p.username || '',
                avatar: p.avatar_url || null,
                streak: Number(p.streak_count) || 0,
                goalMetToday: p.daily_solve_date === today && (Number(p.daily_solve_count) || 0) >= 2,
                rank: 0,
            }));

            friendList.push({
                id: myId, name: myName, username: myUsername, avatar: myAvatar,
                streak: myStreak, goalMetToday: false, rank: 0,
            });

            friendList.sort((a, b) => b.streak - a.streak);
            friendList.forEach((f, i) => { f.rank = i + 1; });

            setFriends(friendList);
            setLoading(false);
        };
        load();
    }, [myId, myStreak, myName, myUsername, myAvatar, today]);

    const myEntry = friends.find(f => f.id === myId);

    if (loading) return <View className="items-center justify-center h-20"><Flame size={20} color="#fb923c" /></View>;
    if (friends.length <= 1) return (
        <View className="items-center gap-2 py-6">
            <Users size={32} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-400">Follow friends to see their streaks here!</Text>
        </View>
    );

    return (
        <View className="space-y-2 mt-2">
            {myEntry && (
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 mb-2">
                    <Flame size={16} color="#f97316" fill="#f97316" />
                    <Text className="text-sm font-black text-orange-700 dark:text-orange-400">
                        You're #{myEntry.rank} among friends with a {myEntry.streak}-day streak
                    </Text>
                </View>
            )}

            {friends.map((friend) => {
                const isMe = friend.id === myId;
                return (
                    <TouchableOpacity
                        key={friend.id}
                        onPress={() => { if (friend.username) router.push(`/user/${friend.username}`) }}
                        className={`flex-row items-center px-3 py-2.5 rounded-2xl ${isMe ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30' : 'border border-transparent'}`}
                    >
                        <View className="w-6 items-center justify-center mr-2"><RankIcon rank={friend.rank} /></View>
                        <View className="relative mr-3">
                            {friend.avatar ? (
                                <Image source={{ uri: friend.avatar }} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900" />
                            ) : (
                                <View className="w-10 h-10 rounded-full bg-indigo-400 items-center justify-center border-2 border-white dark:border-slate-900">
                                    <Text className="text-white font-black">{friend.name[0]?.toUpperCase()}</Text>
                                </View>
                            )}
                            {friend.goalMetToday && (
                                <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900 items-center justify-center">
                                    <Text style={{ fontSize: 6 }}>🔥</Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-1 min-w-0">
                            <Text className={`text-sm font-bold truncate ${isMe ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`} numberOfLines={1}>
                                {friend.name}{isMe ? ' (you)' : ''}
                            </Text>
                            {friend.goalMetToday && <Text className="text-[10px] font-bold text-orange-500">✅ Goal met today</Text>}
                        </View>
                        <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${friend.streak > 0 ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <Flame size={14} color={friend.streak > 0 ? '#f97316' : '#94a3b8'} fill={friend.streak > 0 ? '#f97316' : 'none'} />
                            <Text className={`text-sm font-black ${friend.streak > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-slate-400'}`}>{friend.streak}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function StreakScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [profile, setProfile] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!s) { router.replace('/login' as any); return; }
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
    }, []);

    if (loading || !profile || !session) return (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950"><Flame size={32} color="#f97316" /></View>
    );

    const streak = Number(profile.streak_count) || 0;
    const longest = Number(profile.streak_longest) || streak;
    const today = todayIST();
    const dailySolveDate = profile.daily_solve_date || null;
    const solvedToday = dailySolveDate === today ? (Number(profile.daily_solve_count) || 0) : 0;
    const goalMetToday = solvedToday >= 2;

    const totalAttempts = attempts.length;
    const accuracy = totalAttempts > 0 ? Math.round((attempts.filter(a => a.is_correct).length / totalAttempts) * 100) : 0;

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
        <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center gap-3 px-4 py-3">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center">
                    <ChevronLeft size={20} color={isDark ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900 dark:text-white">My Streak</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Hero card */}
                <View className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 mb-5 ${goalMetToday ? 'border-orange-200 dark:border-orange-800/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <View className="items-center gap-4">
                        <StreakRing current={streak} longest={longest} isDark={isDark} />
                        <Text className={`text-sm font-bold text-center ${statusColor}`}>{statusMsg}</Text>
                        <View className="w-full">
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-2">Today's Goal — {solvedToday}/2 questions</Text>
                            <DailyProgress solved={Math.min(solvedToday, 2)} goal={2} isDark={isDark} />
                        </View>
                        <WeekHeatmap attempts={attempts} isDark={isDark} />
                    </View>
                </View>

                {/* Friends Streak Board */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-5">
                    <View className="flex-row items-center gap-2 mb-3">
                        <Users size={16} color="#f97316" />
                        <Text className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Friends Streak Board</Text>
                    </View>
                    <FriendsStreakBoard myId={session.user.id} myStreak={streak} myName={myName} myUsername={myUsername} myAvatar={myAvatar} router={router} />
                </View>

                {/* Stats */}
                <View className="flex-row gap-3 mb-5">
                    {[
                        { icon: Trophy, label: 'Longest', value: longest, color: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                        { icon: Zap, label: 'Accuracy', value: `${accuracy}%`, color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                        { icon: Star, label: 'Solved', value: totalAttempts, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <View key={label} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 items-center">
                            <View className={`w-10 h-10 rounded-xl ${bg} items-center justify-center mb-2`}><Icon size={20} color={color} /></View>
                            <Text className="text-xl font-black text-slate-900 dark:text-white">{value}</Text>
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</Text>
                        </View>
                    ))}
                </View>

                {/* Milestones */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-5">
                    <Text className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Milestones</Text>
                    <View className="space-y-3">
                        {MILESTONES.map(({ label, target, emoji }) => {
                            const done = longest >= target;
                            return (
                                <View key={target} className={`flex-row items-center p-3 rounded-2xl border ${done ? 'border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-900/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                    <Text className="text-xl mr-3">{emoji}</Text>
                                    <View className="flex-1">
                                        <Text className={`text-sm font-bold ${done ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</Text>
                                        {!done && (
                                            <View className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
                                                <View className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(streak / target, 1) * 100}%` }} />
                                            </View>
                                        )}
                                    </View>
                                    {done ? <CheckCircle size={20} color="#f97316" className="ml-2" /> : <Text className="text-[10px] font-black text-slate-400 ml-2">{streak}/{target}</Text>}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
