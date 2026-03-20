'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, UserPlus, CheckCircle2, XCircle, Zap, BookOpen, Sparkles, ArrowLeft, Swords } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
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

function NotifIcon({ type }: { type: string }) {
    const base = 'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0';
    if (type === 'new_follower') return <div className={`${base} bg-pink-100 text-pink-600`}><UserPlus className="w-5 h-5" /></div>;
    if (type === 'ai_confirmed_correct' || type === 'answer_approved') return <div className={`${base} bg-emerald-100 text-emerald-600`}><CheckCircle2 className="w-5 h-5" /></div>;
    if (type === 'ai_confirmed_wrong' || type === 'answer_flagged') return <div className={`${base} bg-red-100 text-red-600`}><XCircle className="w-5 h-5" /></div>;
    if (type === 'points_earned') return <div className={`${base} bg-amber-100 text-amber-600`}><Zap className="w-5 h-5" /></div>;
    if (type === 'new_question') return <div className={`${base} bg-indigo-100 text-indigo-600`}><BookOpen className="w-5 h-5" /></div>;
    if (type === 'coop_challenge') return <div className={`${base} bg-indigo-100 text-indigo-600`}><Swords className="w-5 h-5" /></div>;
    return <div className={`${base} bg-slate-100 text-slate-600`}><Sparkles className="w-5 h-5" /></div>;
}

const FILTERS = ['All', 'Unread', 'Challenges', 'Followers', 'Answers', 'Points'];

function filterNotifications(notifications: Notification[], filter: string): Notification[] {
    if (filter === 'Unread') return notifications.filter(n => !n.read);
    if (filter === 'Challenges') return notifications.filter(n => n.type === 'coop_challenge');
    if (filter === 'Followers') return notifications.filter(n => n.type === 'new_follower');
    if (filter === 'Answers') return notifications.filter(n => ['answer_approved', 'answer_flagged', 'ai_confirmed_correct', 'ai_confirmed_wrong'].includes(n.type));
    if (filter === 'Points') return notifications.filter(n => n.type === 'points_earned');
    return notifications;
}

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

        // Subscribe to real-time notification changes
        const channel = supabase
            .channel(`notif-page-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [token, user, fetchNotifications]);

    const markAllRead = async () => {
        if (!token) return;
        const previousNotifications = notifications;
        const previousUnreadCount = unreadCount;
        setNotifications(n => n.map(x => ({ ...x, read: true })));
        setUnreadCount(0);
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (!res.ok) {
                setNotifications(previousNotifications);
                setUnreadCount(previousUnreadCount);
            }
        } catch (error) {
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
        }
    };

    const clearAll = async () => {
        if (!token || !window.confirm('Clear all notifications?')) return;
        const previousNotifications = notifications;
        setNotifications([]);
        setUnreadCount(0);
        try {
            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                alert('Failed to delete notifications. Please try again.');
                setNotifications(previousNotifications);
            }
        } catch (error) {
            alert('Failed to delete notifications. Please try again.');
            setNotifications(previousNotifications);
        }
    };

    const handleNotifClick = async (notif: Notification) => {
        if (!notif.read && token) {
            const previousNotifications = notifications;
            const previousUnreadCount = unreadCount;
            setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
            setUnreadCount(c => Math.max(0, c - 1));
            try {
                const res = await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationId: notif.id })
                });
                if (!res.ok) {
                    setNotifications(previousNotifications);
                    setUnreadCount(previousUnreadCount);
                }
            }
            catch (error) {
                setNotifications(previousNotifications);
                setUnreadCount(previousUnreadCount);
            }
        }
        if (notif.href) router.push(notif.href);
    };

    const filtered = filterNotifications(notifications, activeFilter);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors">
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Bell className="w-6 h-6 text-indigo-600" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{unreadCount} new</span>
                            )}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">Stay up to date with your activity</p>
                    </div>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                title="Mark all as read"
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors border border-indigo-100"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                title="Clear all"
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors border border-red-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeFilter === f
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            {f}
                            {f === 'Unread' && unreadCount > 0 && (
                                <span className="ml-1.5 bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 flex gap-4 animate-pulse">
                                <div className="w-11 h-11 rounded-2xl bg-slate-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded-lg w-full" />
                                    <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">
                            {activeFilter === 'Unread' ? 'All caught up!' : 'No notifications here'}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {activeFilter === 'Unread'
                                ? "You have no unread notifications."
                                : "Activity will appear here as you use Dheeyudha."}
                        </p>
                        {activeFilter !== 'All' && (
                            <button onClick={() => setActiveFilter('All')} className="mt-4 text-indigo-600 text-sm font-bold hover:underline">
                                View all notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(notif =>
                            notif.type === 'coop_challenge' ? (
                                <CoopNotifCard
                                    key={notif.id}
                                    notif={notif}
                                    compact={false}
                                    onNavigate={() => handleNotifClick(notif)}
                                />
                            ) : (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`w-full text-left bg-white rounded-3xl border transition-all hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 ${!notif.read ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'} p-5 flex gap-4 items-start`}
                                >
                                    <NotifIcon type={notif.type} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm leading-snug ${notif.read ? 'font-semibold text-slate-700' : 'font-black text-slate-900'}`}>
                                                {notif.title}
                                            </p>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] text-slate-400 font-medium">{timeAgo(notif.created_at)}</span>
                                                {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.body}</p>
                                        {notif.href && (
                                            <span className="text-xs text-indigo-500 font-bold mt-2 inline-block">View details →</span>
                                        )}
                                    </div>
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
