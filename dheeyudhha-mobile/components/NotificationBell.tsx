import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, X, UserPlus, CheckCircle2, XCircle, Zap, BookOpen, Sparkles, Swords, MessageSquare, Loader2, ArrowRight, Users, BarChart3, AtSign } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'expo-router';
import { useRouter } from '@/lib/next-navigation';
import CoopNotifCard from './CoopNotifCard';

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    href: string | null;
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
    return `${d}d ago`;
}

function NotifIconSmall({ type }: { type: string }) {
    const base = 'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border border-white dark:border-slate-800 shadow-sm';
    if (type === 'new_follower') return <View className={`${base} bg-pink-100 text-pink-600`}><UserPlus className="w-2.5 h-2.5" /></View>;
    if (type === 'ai_confirmed_correct' || type === 'answer_approved') return <View className={`${base} bg-emerald-100 text-emerald-600`}><CheckCircle2 className="w-2.5 h-2.5" /></View>;
    if (type === 'ai_confirmed_wrong' || type === 'answer_flagged') return <View className={`${base} bg-red-100 text-red-600`}><XCircle className="w-2.5 h-2.5" /></View>;
    if (type === 'points_earned') return <View className={`${base} bg-amber-100 text-amber-600`}><Zap className="w-2.5 h-2.5" /></View>;
    if (type === 'new_question') return <View className={`${base} bg-indigo-100 text-indigo-600`}><BookOpen className="w-2.5 h-2.5" /></View>;
    if (type === 'coop_challenge') return <View className={`${base} bg-indigo-100 text-indigo-600`}><Users className="w-2.5 h-2.5" /></View>;
    if (type === 'weekly_report') return <View className={`${base} bg-cyan-100 text-cyan-600`}><BarChart3 className="w-2.5 h-2.5" /></View>;
    if (type === 'social_comment') return <View className={`${base} bg-blue-100 text-blue-600`}><MessageSquare className="w-2.5 h-2.5" /></View>;
    if (type === 'post_mention') return <View className={`${base} bg-blue-100 text-blue-600`}><AtSign className="w-2.5 h-2.5" /></View>;
    if (type.startsWith('war_')) return <View className={`${base} bg-orange-100 text-orange-600`}><Swords className="w-2.5 h-2.5" /></View>;
    return <View className={`${base} bg-slate-100 text-slate-500`}><Bell className="w-2.5 h-2.5" /></View>;
}

export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('All');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Get auth token
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setToken(session.access_token);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
            setToken(sess?.access_token ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [token]);

    // Poll every 30s when logged in
    useEffect(() => {
        if (!token) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        if (!token) return;
        setNotifications(n => n.map(x => ({ ...x, read: true })));
        setUnreadCount(0);
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
    };

    const clearAll = async () => {
        if (!token) return;
        setNotifications([]);
        setUnreadCount(0);
        await fetch('/api/notifications', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    const handleNotifClick = async (notif: Notification) => {
        if (!notif.read && token) {
            setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
            setUnreadCount(c => Math.max(0, c - 1));
            fetch('/api/notifications', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: notif.id })
            });
        }
        setOpen(false);
        if (notif.href) router.push(notif.href);
    };

    const filtered = notifications.filter(n => {
        if (filter === 'Unread') return !n.read;
        if (filter === 'Help Requests') return n.type === 'coop_challenge';
        return true;
    });

    if (!token) return null;

    return (
        <View className="relative" ref={panelRef}>
            {/* Bell Button */}
            <View
                id="notification-bell-btn"
                onPress={() => { 
                    if (isMobile) {
                        router.push('/notifications');
                        return;
                    }
                    setOpen(o => !o); 
                    if (!open) fetchNotifications(); 
                }}
                className="relative w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800/80 md:bg-white/15 md:dark:bg-white/15 hover:bg-slate-300/50 dark:hover:bg-slate-700 md:hover:bg-white/25 md:dark:hover:bg-white/25 border border-slate-200 dark:border-slate-700 md:border-white/20 md:dark:border-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 md:text-white md:dark:text-white transition-all shadow-sm md:shadow-md active:scale-95 flex-row"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <Text className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-slate-50 dark:border-slate-950 md:border-white md:dark:border-white shadow-sm flex-row">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                )}
            </View>

            {/* Dropdown panel */}
            <View className={`absolute top-14 right-0 w-[350px] sm:w-[400px] bg-white dark:bg-slate-950 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-2 border-indigo-100 dark:border-slate-800 overflow-hidden z-50 animate-in zoom-in-95 origin-top-right ${open ? 'block' : 'hidden'}`}>
                {/* Header */}
                <View className="bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-800 p-5 sm:p-6">
                    <View className="flex items-center justify-between flex-row">
                        <Text className="text-white font-black text-lg sm:text-xl flex items-center gap-2 flex-row">
                            <Bell className="w-5 h-5 sm:w-6 h-6" /> Notifications
                        </Text>
                        <View className="flex items-center gap-2 flex-row">
                            {unreadCount > 0 && (
                                <View onPress={markAllRead} title="Mark all read" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                    <CheckCheck className="w-4 h-4" />
                                </View>
                            )}
                            <View onPress={() => setOpen(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <X className="w-4 h-4" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <View className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex-row">
                    {['All', 'Unread', 'Help Requests'].map(f => (
                        <View
                            key={f}
                            onPress={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all whitespace-nowrap ${filter === f
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/20'
                                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            {f.toUpperCase()}
                        </View>
                    ))}
                </View>

                <View className="max-h-[400px] sm:max-h-[450px] overflow-y-auto no-scrollbar bg-white dark:bg-slate-950 divide-y divide-slate-50 dark:divide-slate-900/50">
                    {loading && notifications.length === 0 ? (
                        <View className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking transmissions...</Text>
                        </View>
                    ) : filtered.length === 0 ? (
                        <View className="flex flex-col items-center justify-center py-16 px-10 text-center gap-4">
                            <View className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 flex-row">
                                <Sparkles className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                            </View>
                            <View>
                                <Text className="text-slate-800 dark:text-slate-200 font-black text-sm mb-1 uppercase tracking-tight">Status: Clear</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold leading-relaxed">No new notifications in this sector.</Text>
                            </View>
                        </View>
                    ) : (
                        filtered.map(n => (
                            n.type === 'coop_challenge' && n.href?.startsWith('/duel/') ? (
                                // ── Duel notification — simple clickable card ──
                                <View
                                    key={n.id}
                                    onPress={() => handleNotifClick(n)}
                                    className={`px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 relative group ${!n.read ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                                >
                                    {!n.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
                                    <View className="flex gap-3 items-start flex-row">
                                        <View className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0 shadow-sm flex-row">
                                            <Swords className="w-4 h-4 text-white" />
                                        </View>
                                        <View className="flex-1 min-w-0 flex-row">
                                            <Text className={`text-xs mb-0.5 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ${!n.read ? 'font-black text-slate-900 dark:text-slate-100' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                                {n.title}
                                            </Text>
                                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.body}</Text>
                                            <Text className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-wider">{timeAgo(n.created_at)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : n.type === 'coop_challenge' ? (
                                <View key={n.id} className="border-b border-slate-50 dark:border-slate-100 dark:border-slate-900">
                                    <CoopNotifCard 
                                        notif={n} 
                                        compact 
                                        onNavigate={() => {
                                            handleNotifClick(n);
                                        }}
                                    />
                                </View>
                            ) : (
                                <View
                                    key={n.id}
                                    onPress={() => handleNotifClick(n)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-900/50 relative group ${!n.read ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                                >
                                    {!n.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                                    <View className="flex gap-4 flex-row">
                                        <View className="relative shrink-0">
                                            {n.actor_avatar? (
                                                <View className="relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <Image src={n.actor_avatar} alt="" className="w-10 h-10 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                                    <View className="absolute -bottom-1 -right-1 overflow-hidden shrink-0">
                                                        <NotifIconSmall type={n.type} />
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="relative">
                                                    <View className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm border-2 border-white dark:border-slate-800 flex-row">
                                                        {n.actor_name?.[0]?.toUpperCase() || 'M'}
                                                    </View>
                                                    <View className="absolute -bottom-1 -right-1 overflow-hidden shrink-0">
                                                        <NotifIconSmall type={n.type} />
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-1 min-w-0 flex-row">
                                            <Text className={`text-xs mb-0.5 line-clamp-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors ${!n.read ? 'font-black text-slate-900 dark:text-slate-100' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                                {n.title}
                                            </Text>
                                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.body}</Text>
                                            <Text className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1.5 uppercase tracking-wider">{timeAgo(n.created_at)}</Text>
                                        </View>
                                    </View>
                                </View>
                            )
                        ))
                    )}
                </View>

                {/* Footer */}
                <View className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-row">
                    <View
                        onPress={clearAll}
                        className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1.5 flex-row"
                    >
                        <Trash2 className="w-3 h-3 sm:w-3.5 h-3.5" /> Clear All
                    </View>
                    <View
                        onPress={() => { setOpen(false); router.push('/notifications'); }}
                        className="text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 group flex-row"
                    >
                        See All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </View>
                </View>
            </View>
        </View>
    );
}
