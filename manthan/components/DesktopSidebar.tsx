
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  MessageSquare,
  Bell,
  PlusCircle,
  User,
  MoreHorizontal,
  Info,
  ChevronDown,
  Trophy,
  Shield,
} from 'lucide-react';
import Logo from './Logo';
import TeacherBadge from '@/ticks/teacher';
import { supabase } from '@/lib/supabaseClient';

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<any>;
  soon?: boolean;
  badge?: number;
};

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  const HELP_LINKS = [
    { label: 'See Docs', href: '/docs' },
    { label: 'Ask', href: '/ask', soon: true },
    { label: 'Contact', href: '/contact' },
    { label: 'About', href: '/about' },
  ];

  // Auth
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setToken(session?.access_token ?? null);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Poll unread notification count
  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token, fetchUnread]);

  const NAV: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { label: 'Checker Feed', href: '/checker-feed', icon: Shield },
    { label: 'Messages', icon: MessageSquare, soon: true },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 z-50 transition-all duration-300 shadow-[2px_0_20px_rgba(0,0,0,0.02)]">
      {/* Header / Logo Area */}
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-600 p-[1px] shadow-md group-hover:scale-105 transition-transform duration-300">
            <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center">
              <Logo width={28} height={28} />
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-fuchsia-600 transition-all duration-300">
            MANTHAN
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
        <div className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.href
              ? item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              : false;

            if (item.soon) {
              return (
                <div
                  key={item.label}
                  title={`${item.label} (coming soon)`}
                  className="group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed text-slate-500"
                >
                  <Icon className="w-5 h-5 text-slate-400" strokeWidth={2} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                title={item.label}
                className={`
                  group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="flex-1 text-left">{item.label}</span>

                {/* Notification badge */}
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-100/80 mx-2" />

        {/* Teacher / Action Area */}
        <div className="space-y-3">
          {user?.user_metadata?.isTeacher && (
            <Link
              href="/questions/create"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="bg-white/20 rounded-full p-1">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">Create Question</span>
            </Link>
          )}

          {!user?.user_metadata?.isTeacher && (
            <Link
              href="/teacher/apply"
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-200/50 hover:bg-gradient-to-r hover:from-amber-400/20 hover:to-orange-400/20 transition-all duration-200"
            >
              <div className="bg-amber-100 rounded-lg p-1.5 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm text-amber-700 group-hover:text-amber-800">Become a Teacher</span>
                <span className="text-[10px] text-amber-600/70">Join the faculty</span>
              </div>
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-2">
          <button
            onClick={() => setHelpOpen((s) => !s)}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-slate-400" />
              <span>Help &amp; Resources</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${helpOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${helpOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            <div className="pl-11 pr-2 space-y-1 border-l-2 border-slate-100 ml-5 py-1">
              {HELP_LINKS.map((link) => (
                <div key={link.label}>
                  {link.soon ? (
                    <div className="flex items-center justify-between text-xs py-1.5 px-2 text-slate-400 cursor-not-allowed">
                      <span>{link.label}</span>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className="flex items-center justify-between text-xs py-1.5 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <span>{link.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-100 group"
        >
          <div className="relative h-10 w-10 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-fuchsia-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
              {user?.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="Profile" width={40} height={40} className="object-cover h-full w-full" />
              ) : (
                <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {user?.user_metadata?.isTeacher && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]">
                <TeacherBadge />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {user?.user_metadata?.fullName || 'Guest User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'Sign in to sync'}
            </p>
          </div>

          <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        </Link>
      </div>
    </aside>
  );
}
