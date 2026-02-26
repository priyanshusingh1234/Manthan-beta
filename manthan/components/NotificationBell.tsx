'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, UserPlus, CheckCircle2, XCircle, Zap, BookOpen, Sparkles, Swords } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

function NotifIcon({ type }: { type: string }) {
    const base = 'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0';
    if (type === 'new_follower') return <div className={`${base} bg-pink-100 text-pink-600`}><UserPlus className="w-4 h-4" /></div>;
    if (type === 'ai_confirmed_correct' || type === 'answer_approved') return <div className={`${base} bg-emerald-100 text-emerald-600`}><CheckCircle2 className="w-4 h-4" /></div>;
    if (type === 'ai_confirmed_wrong' || type === 'answer_flagged') return <div className={`${base} bg-red-100 text-red-600`}><XCircle className="w-4 h-4" /></div>;
    if (type === 'points_earned') return <div className={`${base} bg-amber-100 text-amber-600`}><Zap className="w-4 h-4" /></div>;
    if (type === 'new_question') return <div className={`${base} bg-indigo-100 text-indigo-600`}><BookOpen className="w-4 h-4" /></div>;
    if (type === 'coop_challenge') return <div className={`${base} bg-indigo-100 text-indigo-600`}><Swords className="w-4 h-4" /></div>;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
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
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: notif.id })
            });
        }
        setOpen(false);
        if (notif.href) router.push(notif.href);
    };

    if (!token) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                id="notification-bell-btn"
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
                className="relative w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800/80 md:bg-white/15 md:dark:bg-white/15 hover:bg-slate-300/50 dark:hover:bg-slate-700 md:hover:bg-white/25 md:dark:hover:bg-white/25 border border-slate-200 dark:border-slate-700 md:border-white/20 md:dark:border-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 md:text-white md:dark:text-white transition-all shadow-sm md:shadow-md active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-slate-50 dark:border-slate-950 md:border-white md:dark:border-white shadow-md animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    id="notification-panel"
                    className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[1000] overflow-hidden animate-popIn"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-black text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} title="Mark all read" className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 transition-colors">
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={clearAll} title="Clear all" className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 dark:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                        {loading && notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                                <div className="w-6 h-6 border-2 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs mt-1 opacity-70">Follow teachers and solve questions to get updates</p>
                            </div>
                        ) : (
                            notifications.map(notif =>
                                notif.type === 'coop_challenge' ? (
                                    <CoopNotifCard
                                        key={notif.id}
                                        notif={notif}
                                        compact
                                        onNavigate={() => {
                                            handleNotifClick(notif);
                                            setOpen(false);
                                        }}
                                    />
                                ) : (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                    >
                                        <NotifIcon type={notif.type} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${notif.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-slate-100'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                                        </div>
                                        {!notif.read && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        )}
                                    </button>
                                )
                            )
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 text-center">
                            <Link
                                href="/notifications"
                                onClick={() => setOpen(false)}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                View all notifications →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
