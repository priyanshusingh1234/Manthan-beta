import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import {
    Bell, CheckCheck, Trash2, UserPlus, CheckCircle2,
    XCircle, Zap, BookOpen, Sparkles, ChevronLeft,
    ChevronRight, Users, BarChart3, AtSign, Flame
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CoopNotifCard from '@/components/CoopNotifCard';

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    href: string | null;
    actor_id: string | null;
    actor_name: string | null;
    actor_avatar: string | null;
    read: boolean;
    created_at: string;
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotifIconBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
    const dim = size === 'sm' ? 'w-5 h-5 rounded-lg' : 'w-12 h-12 rounded-2xl';
    const iconDim = size === 'sm' ? 10 : 20;

    const baseStyle = `${dim} items-center justify-center shadow-sm shrink-0`;

    if (type === 'new_follower' || type === 'follow_request') {
        return (
            <View className={`${baseStyle} bg-pink-100 dark:bg-pink-950/30 text-pink-600`}>
                <UserPlus size={iconDim} color="#db2777" />
            </View>
        );
    }
    if (type === 'ai_confirmed_correct' || type === 'answer_approved') {
        return (
            <View className={`${baseStyle} bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600`}>
                <CheckCircle2 size={iconDim} color="#059669" />
            </View>
        );
    }
    if (type === 'ai_confirmed_wrong' || type === 'answer_flagged') {
        return (
            <View className={`${baseStyle} bg-red-100 dark:bg-red-950/30 text-red-600`}>
                <XCircle size={iconDim} color="#dc2626" />
            </View>
        );
    }
    if (type === 'points_earned') {
        return (
            <View className={`${baseStyle} bg-amber-100 dark:bg-amber-950/30 text-amber-600`}>
                <Zap size={iconDim} color="#d97706" />
            </View>
        );
    }
    if (type === 'new_question') {
        return (
            <View className={`${baseStyle} bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600`}>
                <BookOpen size={iconDim} color="#4f46e5" />
            </View>
        );
    }
    if (type === 'coop_challenge') {
        return (
            <View className={`${baseStyle} bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600`}>
                <Users size={iconDim} color="#4f46e5" />
            </View>
        );
    }
    if (type === 'weekly_report') {
        return (
            <View className={`${baseStyle} bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600`}>
                <BarChart3 size={iconDim} color="#0891b2" />
            </View>
        );
    }
    if (type === 'post_mention') {
        return (
            <View className={`${baseStyle} bg-blue-100 dark:bg-blue-950/30 text-blue-600`}>
                <AtSign size={iconDim} color="#2563eb" />
            </View>
        );
    }
    if (type === 'streak_friend') {
        return (
            <View className={`${dim} bg-orange-500 rounded-2xl items-center justify-center shrink-0 shadow`}>
                <Flame size={iconDim} color="white" fill="white" />
            </View>
        );
    }
    return (
        <View className={`${baseStyle} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
            <Sparkles size={iconDim} color="#64748b" />
        </View>
    );
}

const FILTERS = ['All', 'Unread', 'Help', 'Answers', 'Points'] as const;
type Filter = typeof FILTERS[number];

export default function NotificationsScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState<Filter>('All');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { router.replace('/login'); return; }
            setToken(session.access_token);
            setUser(session.user);
        });
    }, [router]);

    const fetchNotifications = useCallback(async (isSilent = false) => {
        if (!token) return;
        if (!isSilent) setLoading(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error("Notifications fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // Stable ref so the realtime callback always calls latest fetchNotifications
    const fetchNotificationsRef = useRef(fetchNotifications);
    useEffect(() => { fetchNotificationsRef.current = fetchNotifications; }, [fetchNotifications]);

    // Track active channel — ensures we never call .on() after .subscribe()
    const channelRef = useRef<any>(null);

    // Subscribe ONCE per user.id — token changes update the ref, not the channel
    useEffect(() => {
        if (!user?.id) return;

        fetchNotificationsRef.current();

        // Tear down stale channel before creating a new one
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelName = `notif-page-${user.id}-${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => fetchNotificationsRef.current(true))
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAllRead = async () => {
        if (!token) return;
        setNotifications(n => n.map(x => ({ ...x, read: true })));
        setUnreadCount(0);
        
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        await fetch(`${API_URL}/api/notifications`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
    };

    const clearAll = async () => {
        if (!token) return;
        
        Alert.alert(
            "Clear Notifications",
            "Clear all notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        setNotifications([]);
                        setUnreadCount(0);
                        
                        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
                        await fetch(`${API_URL}/api/notifications`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                }
            ]
        );
    };

    const handleNotifClick = async (notif: Notification) => {
        if (!notif.read && token) {
            setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
            setUnreadCount(c => Math.max(0, c - 1));
            
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            fetch(`${API_URL}/api/notifications`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: notif.id })
            });
        }
        
        if (notif.href) {
            // Translate Next.js Web URLs to mobile equivalent
            let targetHref = notif.href;
            if (targetHref.startsWith('/questions/')) {
                targetHref = targetHref.replace('/questions/', '/solve/');
            }
            router.push(targetHref as any);
        }
    };

    const handleFollowRequest = async (notif: Notification, action: 'accept' | 'reject') => {
        if (!token) return;
        
        // Optimistic UI updates
        setNotifications(n => n.filter(x => x.id !== notif.id));
        if (!notif.read) setUnreadCount(c => Math.max(0, c - 1));

        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        
        // Delete notification
        fetch(`${API_URL}/api/notifications`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: notif.id, delete: true })
        });

        // Submit accept/reject action
        await fetch(`${API_URL}/api/follows/request`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ followerId: notif.actor_id, action })
        });
    };

    const filtered = notifications.filter(n => {
        if (activeFilter === 'Unread') return !n.read;
        if (activeFilter === 'Help') return n.type === 'coop_challenge';
        if (activeFilter === 'Answers') return ['answer_approved', 'answer_flagged', 'ai_confirmed_correct', 'ai_confirmed_wrong'].includes(n.type);
        if (activeFilter === 'Points') return n.type === 'points_earned';
        return true;
    });

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Sticky Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                    >
                        <ChevronLeft size={20} color={isDark ? '#cbd5e1' : '#0f172a'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Notifications
                    </Text>
                </View>
                <View className="flex-row gap-1">
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={markAllRead}
                            className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                        >
                            <CheckCheck size={18} color="#6366f1" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={clearAll}
                        className="w-10 h-10 rounded-full items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                    >
                        <Trash2 size={18} color={isDark ? '#64748b' : '#94a3b8'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Horizontal Filter Tabs */}
            <View className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 py-3 px-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {FILTERS.map(f => {
                        const isActive = activeFilter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                className={`px-4 py-2 rounded-full border mr-2 flex-row items-center gap-1.5 ${
                                    isActive
                                        ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white shadow-sm'
                                        : 'bg-slate-100 border-slate-100 dark:bg-slate-900 dark:border-slate-800'
                                }`}
                            >
                                <Text className={`text-xs font-black uppercase tracking-wider ${
                                    isActive ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                    {f}
                                </Text>
                                {f === 'Unread' && unreadCount > 0 && (
                                    <View className="bg-indigo-500 rounded-full px-1.5 py-0.5">
                                        <Text className="text-white text-[8px] font-black">{unreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">
                        Finding updates...
                    </Text>
                </View>
            ) : filtered.length === 0 ? (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                >
                    <View className="items-center py-20">
                        <View className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <Bell size={40} color={isDark ? '#475569' : '#cbd5e1'} />
                        </View>
                        <Text className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">
                            No {activeFilter === 'All' ? '' : activeFilter.toLowerCase()} notifications
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs text-center max-w-[240px] leading-relaxed">
                            Activities like challenges, follows, and reports appear here.
                        </Text>
                    </View>
                </ScrollView>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                >
                    {filtered.map(notif => {
                        const isCoopChallenge = notif.type === 'coop_challenge';
                        const isDuelChallenge = isCoopChallenge && notif.href?.startsWith('/duel/');
                        const isStreakFriend = notif.type === 'streak_friend';
                        const isFollowRequest = notif.type === 'follow_request';

                        if (isDuelChallenge) {
                            return (
                                <View key={notif.id} className="mb-4">
                                    <TouchableOpacity
                                        onPress={() => handleNotifClick(notif)}
                                        activeOpacity={0.8}
                                        className={`p-4 rounded-3xl flex-row gap-4 items-center border relative overflow-hidden ${
                                            !notif.read 
                                                ? 'bg-orange-50/40 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/40' 
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                        }`}
                                    >
                                        {!notif.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
                                        <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 items-center justify-center shadow-sm shrink-0">
                                            <Text className="text-lg">⚔️</Text>
                                        </View>
                                        <View className="flex-1 min-w-0">
                                            <View className="flex-row justify-between items-baseline gap-1 mb-0.5">
                                                <Text className={`text-xs truncate flex-1 ${
                                                    !notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    {notif.title}
                                                </Text>
                                                <Text className="text-[9px] text-slate-400 font-bold shrink-0">{timeAgo(notif.created_at)}</Text>
                                            </View>
                                            <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal" numberOfLines={2}>
                                                {notif.body}
                                            </Text>
                                        </View>
                                        <ChevronRight size={16} color={isDark ? '#475569' : '#cbd5e1'} />
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        if (isCoopChallenge) {
                            return (
                                <View key={notif.id} className="mb-4">
                                    <CoopNotifCard notif={notif} compact={false} onNavigate={() => handleNotifClick(notif)} />
                                </View>
                            );
                        }

                        if (isStreakFriend) {
                            return (
                                <View key={notif.id} className="mb-4">
                                    <TouchableOpacity
                                        onPress={() => handleNotifClick(notif)}
                                        activeOpacity={0.8}
                                        className={`rounded-3xl overflow-hidden relative border ${
                                            !notif.read ? 'border-orange-400' : 'border-transparent'
                                        }`}
                                    >
                                        {/* Gradient Background */}
                                        <View className="absolute inset-0 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600" />
                                        <View className="relative p-4 flex-row gap-3 items-center">
                                            {/* Avatar Flame */}
                                            <View className="relative shrink-0">
                                                {notif.actor_avatar ? (
                                                    <Image source={{ uri: notif.actor_avatar }} className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30" />
                                                ) : (
                                                    <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                                                        <Flame size={20} color="white" fill="white" />
                                                    </View>
                                                )}
                                                <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full items-center justify-center shadow">
                                                    <Flame size={12} color="#f97316" fill="#f97316" />
                                                </View>
                                            </View>

                                            {/* Content */}
                                            <View className="flex-1 min-w-0">
                                                <Text className="text-white font-black text-xs leading-tight" numberOfLines={1}>
                                                    {notif.title}
                                                </Text>
                                                <Text className="text-white/80 text-[10px] mt-0.5 leading-normal" numberOfLines={2}>
                                                    {notif.body}
                                                </Text>
                                                <View className="flex-row items-center gap-2 mt-2">
                                                    <View className="bg-white px-3 py-1 rounded-full shadow-sm">
                                                        <Text className="text-orange-600 font-black text-[9px]">🔥 SOLVE NOW</Text>
                                                    </View>
                                                    <Text className="text-[9px] text-white/60 font-bold">{timeAgo(notif.created_at)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        if (isFollowRequest) {
                            return (
                                <View key={notif.id} className="mb-4">
                                    <View className={`p-4 rounded-3xl border relative ${
                                        !notif.read 
                                            ? 'bg-pink-50/30 dark:bg-pink-950/10 border-pink-100 dark:border-pink-900/40' 
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    }`}>
                                        {!notif.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500" />}
                                        <View className="flex-row gap-4 items-start">
                                            <View className="relative shrink-0">
                                                {notif.actor_avatar ? (
                                                    <View>
                                                        <Image source={{ uri: notif.actor_avatar }} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                                        <View className="absolute -bottom-1 -right-1">
                                                            <NotifIconBadge type={notif.type} size="sm" />
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <NotifIconBadge type={notif.type} />
                                                )}
                                            </View>

                                            <View className="flex-1 min-w-0">
                                                <View className="flex-row justify-between items-baseline gap-1 mb-0.5">
                                                    <Text className={`text-xs truncate flex-1 ${
                                                        !notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                        {notif.title}
                                                    </Text>
                                                    <Text className="text-[9px] text-slate-400 font-bold shrink-0">{timeAgo(notif.created_at)}</Text>
                                                </View>
                                                <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-3" numberOfLines={2}>
                                                    {notif.body}
                                                </Text>
                                                
                                                <View className="flex-row gap-2">
                                                    <TouchableOpacity 
                                                        onPress={() => handleFollowRequest(notif, 'accept')}
                                                        className="px-4 py-2 bg-indigo-600 rounded-xl shadow-sm"
                                                    >
                                                        <Text className="text-white text-[10px] font-black uppercase">Accept</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        onPress={() => handleFollowRequest(notif, 'reject')}
                                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                                                    >
                                                        <Text className="text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">Reject</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        }

                        // Default Card Style
                        return (
                            <View key={notif.id} className="mb-4">
                                <TouchableOpacity
                                    onPress={() => handleNotifClick(notif)}
                                    activeOpacity={0.8}
                                    className={`p-4 rounded-3xl border flex-row gap-4 items-center relative ${
                                        !notif.read 
                                            ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40' 
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    }`}
                                >
                                    {!notif.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                                    <View className="relative shrink-0">
                                        {notif.actor_avatar ? (
                                            <View>
                                                <Image source={{ uri: notif.actor_avatar }} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                                <View className="absolute -bottom-1 -right-1">
                                                    <NotifIconBadge type={notif.type} size="sm" />
                                                </View>
                                            </View>
                                        ) : (
                                            <NotifIconBadge type={notif.type} />
                                        )}
                                    </View>

                                    <View className="flex-1 min-w-0">
                                        <View className="flex-row justify-between items-baseline gap-1 mb-0.5">
                                            <Text className={`text-xs truncate flex-1 ${
                                                !notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {notif.title}
                                            </Text>
                                            <Text className="text-[9px] text-slate-400 font-bold shrink-0">{timeAgo(notif.created_at)}</Text>
                                        </View>
                                        <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal" numberOfLines={2}>
                                            {notif.body}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color={isDark ? '#475569' : '#cbd5e1'} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}
