import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Image } from 'react-native';
import { Bell, CheckCheck, Trash2, X, UserPlus, CheckCircle2, XCircle, Zap, BookOpen, Sparkles, Swords, MessageSquare, ArrowRight, Users, BarChart3, AtSign } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';

export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('All');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    // Get auth token and user
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setToken(session.access_token);
                setUser(session.user);
            }
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
            setToken(sess?.access_token ?? null);
            setUser(sess?.user ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
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
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [token]);

    // Stable ref so the realtime callback always calls latest fetchNotifications
    const fetchNotificationsRef = useRef(fetchNotifications);
    useEffect(() => { fetchNotificationsRef.current = fetchNotifications; }, [fetchNotifications]);

    // Track the active channel so we never double-subscribe
    const channelRef = useRef<any>(null);

    // Subscribe ONCE per user session — do NOT put token in deps.
    // Token changes (e.g. silent refresh) update fetchNotificationsRef, not the channel.
    useEffect(() => {
        if (!user?.id) return;

        // Initial fetch
        fetchNotificationsRef.current();

        // Tear down any existing channel before creating a new one
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        // Generate a uniquely named channel every time the effect runs.
        // This prevents the "cannot add callbacks after subscribe" crash which happens
        // when React double-renders and tries to reuse the same channel name before
        // removeChannel (which is async) has finished cleaning it up.
        const channelName = `bell-notif-${user.id}-${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => fetchNotificationsRef.current())
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
        setNotifications([]);
        setUnreadCount(0);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        await fetch(`${API_URL}/api/notifications`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    return (
        <View className="relative z-50">
            <TouchableOpacity
                onPress={() => {
                    if (isMobile) {
                        router.push('/notifications' as any);
                        return;
                    }
                    setOpen(!open);
                }}
                className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800/80 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
            >
                <Bell size={20} className="text-slate-700 dark:text-slate-200" />
                {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full items-center justify-center px-1 border-2 border-white">
                        <Text className="text-white text-[9px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade">
                <TouchableOpacity className="flex-1" onPress={() => setOpen(false)}>
                    <View className="absolute top-14 right-4 w-[350px] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        
                        <View className="bg-indigo-700 p-5 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <Bell size={20} color="white" />
                                <Text className="text-white font-black text-lg">Notifications</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={markAllRead} className="p-1.5 rounded-lg bg-white/10">
                                        <CheckCheck size={16} color="white" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setOpen(false)} className="p-1.5 rounded-lg bg-white/10">
                                    <X size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
                            {['All', 'Unread', 'Help Requests'].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-full border ${filter === f ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`text-[11px] font-black ${filter === f ? 'text-white' : 'text-slate-500'}`}>{f.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView className="max-h-[400px] bg-white dark:bg-slate-950">
                            <View className="items-center justify-center py-16 px-10 gap-4">
                                <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center border-2 border-slate-100">
                                    <Sparkles size={32} color="#cbd5e1" />
                                </View>
                                <View className="items-center">
                                    <Text className="text-slate-800 font-black text-sm uppercase">Status: Clear</Text>
                                    <Text className="text-slate-400 text-[10px] font-bold">No new notifications in this sector.</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 flex-row items-center justify-between">
                            <TouchableOpacity onPress={clearAll} className="flex-row items-center gap-1.5">
                                <Trash2 size={12} color="#94a3b8" />
                                <Text className="text-[10px] font-black text-slate-400 uppercase">Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setOpen(false); router.push('/notifications' as any); }} className="flex-row items-center gap-1.5">
                                <Text className="text-[10px] font-black text-indigo-600 uppercase">See All</Text>
                                <ArrowRight size={12} color="#4f46e5" />
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
