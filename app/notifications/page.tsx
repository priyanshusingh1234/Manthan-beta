'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    Bell, CheckCheck, Trash2, UserPlus, CheckCircle2, 
    XCircle, Zap, BookOpen, Sparkles, ArrowLeft, 
    Users, BarChart3, Loader2, ChevronRight, AtSign, Flame 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import CoopNotifCard from '@/components/CoopNotifCard';

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

// ... timeAgo helper remains same ...
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
    const dim = size === 'sm' ? 'w-5 h-5' : 'w-11 h-11';
    const iconDim = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
    const rounded = size === 'sm' ? 'rounded-lg' : 'rounded-2xl';

    if (type === 'new_follower') return <div className={`${dim} ${rounded} bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 shadow-sm`}><UserPlus className={iconDim} /></div>;
    if (type === 'ai_confirmed_correct' || type === 'answer_approved') return <div className={`${dim} ${rounded} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm`}><CheckCircle2 className={iconDim} /></div>;
    if (type === 'ai_confirmed_wrong' || type === 'answer_flagged') return <div className={`${dim} ${rounded} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-sm`}><XCircle className={iconDim} /></div>;
    if (type === 'points_earned') return <div className={`${dim} ${rounded} bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm`}><Zap className={iconDim} /></div>;
    if (type === 'new_question') return <div className={`${dim} ${rounded} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm`}><BookOpen className={iconDim} /></div>;
    if (type === 'coop_challenge') return <div className={`${dim} ${rounded} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm`}><Users className={iconDim} /></div>;
    if (type === 'weekly_report') return <div className={`${dim} ${rounded} bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm`}><BarChart3 className={iconDim} /></div>;
    if (type === 'post_mention') return <div className={`${dim} ${rounded} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm`}><AtSign className={iconDim} /></div>;
    if (type === 'streak_friend') return <div className={`${dim} ${rounded} bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30`}><Flame className={iconDim} fill="white" /></div>;
    return <div className={`${dim} ${rounded} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-sm`}><Sparkles className={iconDim} /></div>;
}

const FILTERS = ['All', 'Unread', 'Help', 'Answers', 'Points'];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { router.push('/login'); return; }
            setToken(session.access_token);
            setUser(session.user);
        });
    }, [router]);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
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

    useEffect(() => {
        if (!token || !user) return;
        fetchNotifications();
        const channel = supabase
            .channel(`notif-page-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
            () => fetchNotifications())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [token, user, fetchNotifications]);

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
        if (!token || !window.confirm('Clear all notifications?')) return;
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
        if (notif.href) router.push(notif.href);
    };

    const filtered = notifications.filter(n => {
        if (activeFilter === 'Unread') return !n.read;
        if (activeFilter === 'Help') return n.type === 'coop_challenge';
        if (activeFilter === 'Answers') return ['answer_approved', 'answer_flagged', 'ai_confirmed_correct', 'ai_confirmed_wrong'].includes(n.type);
        if (activeFilter === 'Points') return n.type === 'points_earned';
        return true;
    });

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">Notifications</h1>
                </div>
                <div className="flex gap-1">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-colors">
                            <CheckCheck className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Horizontal Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${activeFilter === f
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-lg'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            {f.toUpperCase()}
                            {f === 'Unread' && unreadCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] rounded-full">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finding updates...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-32"
                        >
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
                                <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No {activeFilter === 'All' ? '' : activeFilter.toLowerCase()} notifications</h3>
                            <p className="text-slate-400 text-sm max-w-[240px] mx-auto leading-relaxed">Activities like challenges, follows, and reports appear here.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-px">
                            {filtered.map(notif => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group"
                                >
                                    {notif.type === 'coop_challenge' && notif.href?.startsWith('/duel/') ? (
                                        <button
                                            onClick={() => handleNotifClick(notif)}
                                            className={`w-full text-left p-4 flex gap-4 items-start relative transition-colors ${!notif.read ? 'bg-orange-50/30 dark:bg-orange-950/10' : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                        >
                                            {!notif.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-full" />}
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                                <span className="text-xl">⚔️</span>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className={`text-[13px] leading-tight flex-1 ${!notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>{notif.title}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight shrink-0">{timeAgo(notif.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{notif.body}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 self-center shrink-0" />
                                        </button>
                                    ) : notif.type === 'coop_challenge' ? (
                                        <div className="py-2">
                                            <CoopNotifCard notif={notif} compact={false} onNavigate={() => handleNotifClick(notif)} />
                                        </div>
                                    ) : notif.type === 'streak_friend' ? (
                                        // ── Special streak_friend card ─────────────────────
                                        <button
                                            onClick={() => handleNotifClick(notif)}
                                            className="w-full text-left"
                                        >
                                            <div className={`relative m-1 rounded-2xl overflow-hidden transition-all ${
                                                !notif.read ? 'ring-2 ring-orange-400/60' : 'opacity-90'
                                            }`}>
                                                {/* Gradient background */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600" />
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"  %3E%3Crect width=\"1\" height=\"1\" fill=\"rgba(255,255,255,0.05)\"/%3E%3C/svg%3E')]" />

                                                <div className="relative p-4 flex gap-3 items-start">
                                                    {/* Avatar + flame overlay */}
                                                    <div className="relative shrink-0">
                                                        {notif.actor_avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={notif.actor_avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30 shadow-lg" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                                <Flame className="w-6 h-6 text-white" fill="white" />
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                                                            <Flame className="w-3 h-3 text-orange-500" fill="#f97316" />
                                                        </div>
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-black text-white leading-tight">
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-[11px] text-white/80 mt-0.5 leading-normal line-clamp-2">
                                                            {notif.body}
                                                        </p>
                                                        <div className="mt-2.5 flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-white text-orange-600 font-black text-[11px] rounded-full shadow-sm">
                                                                🔥 Solve Now
                                                            </span>
                                                            <span className="text-[10px] text-white/60 font-bold">{timeAgo(notif.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleNotifClick(notif)}
                                            className={`w-full text-left p-4 flex gap-4 items-start relative transition-colors ${!notif.read ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                        >
                                            <div className="relative shrink-0">
                                                {notif.actor_avatar? (
                                                    <div className="relative">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={notif.actor_avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                                        <div className="absolute -bottom-1 -right-1 ring-2 ring-white dark:ring-slate-950 rounded-[6px] overflow-hidden">
                                                            <NotifIconBadge type={notif.type} size="sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <NotifIconBadge type={notif.type} />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className={`text-[13px] leading-tight flex-1 ${!notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight shrink-0">{timeAgo(notif.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                                                    {notif.body}
                                                </p>
                                            </div>

                                            <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </div>

                                            {!notif.read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                                            )}
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
