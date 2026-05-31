import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { Image } from 'react-native';
import { usePathname, useRouter } from '@/lib/next-navigation';
import {
  Home,
  Search,
  Compass,
  MessageSquare,
  Bell,
  PlusCircle,
  User,
  MoreHorizontal,
  ChevronDown,
  Trophy,
  Shield,
  CheckSquare,
  Info,
  BarChart2,
  Swords,
  ShieldAlert,
  Share2,
  Zap,
  PlaySquare,
  BookOpen,
} from 'lucide-react-native';
import { Share } from 'react-native';
import TeacherBadge from '@/ticks/teacher';
import Logo from './Logo';
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
  const [isFirstSearch, setIsFirstSearch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = localStorage.getItem('dheeyudha_search_visited');
      if (!visited) setIsFirstSearch(true);
    }
  }, []);

  const HELP_LINKS = [
    { label: 'See Docs', href: '/docs' },
    { label: 'Ask', href: '/ask', soon: true },
    { label: 'Contact', href: '/contact' },
    { label: 'Child Safety', href: '/child-safety' },
    { label: 'About', href: '/about' },
  ];

  // Auth & Session management
  useEffect(() => {
    let mounted = true;

    const syncSessionAndCache = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      let finalUser = session?.user ?? null;
      if (finalUser && typeof window !== 'undefined') {
        try {
          const cachedMeta = localStorage.getItem('dheeyudha_user_meta_cache');
          if (cachedMeta) {
            const parsed = JSON.parse(cachedMeta);
            finalUser = { ...finalUser, user_metadata: { ...finalUser.user_metadata, ...parsed } };
          }
        } catch { /* ignore parse errors */ }
      }

      if (mounted) {
        setUser(finalUser);
        setToken(session?.access_token ?? null);
      }
    };

    syncSessionAndCache();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionAndCache();
    });

    const handleMetaUpdate = () => {
      syncSessionAndCache();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('user_metadata_updated', handleMetaUpdate);
      window.addEventListener('storage', (e) => {
        if (e.key === 'dheeyudha_user_meta_cache') handleMetaUpdate();
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('user_metadata_updated', handleMetaUpdate);
      }
    };
  }, []);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[Sidebar] Failed to fetch unread count:", err);
    }
  }, [token]);

  // Set up polling and realtime for notifications
  useEffect(() => {
    if (!token || !user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Set up Realtime subscription for instant updates
    const channel = supabase
      .channel(`sidebar-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Fallback polling (less frequent because of realtime)
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [token, user, fetchUnreadCount]);

  const NAV: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Clips', href: '/clips', icon: PlaySquare },
    { label: 'Community', href: '/posts', icon: MessageSquare },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'My Faction', href: '/my-school', icon: ShieldAlert },
    { label: 'Top Schools', href: '/top-schools', icon: Swords },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { label: 'Arena', href: '/tests', icon: Zap },
    { label: 'Gauntlet', href: '/gauntlet', icon: BookOpen },
    { label: 'Checker Feed', href: '/checker-feed', icon: Shield },
    { label: 'Solved', href: '/solved', icon: CheckSquare },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <View className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 z-50 transition-all duration-300 shadow-[2px_0_20px_rgba(0,0,0,0.02)]">
      {/* Header / Logo Area */}
      <View className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 group flex-row">
          <View className="shrink-0">
            <Logo width={28} height={28} />
          </View>
          <Text
            style={{ fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}
            className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 select-none"
          >
            dheeyudha
          </Text>
        </Link>
      </View>

      {/* Navigation */}
      <View className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 flex-row">
        <View className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) : false;

            if (item.soon) {
              return (
                <View
                  key={item.label}
                  title={`${item.label} (coming soon)`}
                  className="group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 flex-row"
                >
                  <Icon className="w-5 h-5 text-slate-400" strokeWidth={2} />
                  <Text className="flex-1 text-left flex-row">{item.label}</Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Soon
                  </Text>
                </View>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                className={`
                  group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} ${item.label === 'Search' && isFirstSearch && !isActive ? 'animate-pulse text-blue-500' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text className="flex-1 text-left flex-row">
                  {item.label}
                  {item.label === 'Search' && isFirstSearch && !isActive && (
                    <Text className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-md uppercase tracking-tighter shadow-sm animate-bounce inline-block">New</Text>
                  )}
                </Text>

                {/* Notification Badge */}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <Text className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full px-1 shadow-sm border border-white flex-row">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                )}

                {isActive && !item.badge && (
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </View>

        {/* Divider */}
        <View className="my-4 border-t border-slate-100/80 dark:border-slate-800/80 mx-2" />

        {/* Teacher / Action Area */}
        <View className="space-y-3">
          {user?.user_metadata?.isTeacher && (
            <Link
              href="/questions/create"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-200 group flex-row"
            >
              <View className="bg-white/20 rounded-full p-1">
                <PlusCircle className="w-4 h-4 text-white" />
              </View>
              <Text className="font-semibold text-sm">Create Question</Text>
            </Link>
          )}

          {!user?.user_metadata?.isTeacher && (
            <Link
              href="/teacher/apply"
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-200/50 hover:bg-gradient-to-r hover:from-amber-400/20 hover:to-orange-400/20 transition-all duration-200 flex-row"
            >
              <View className="bg-amber-100 rounded-lg p-1.5 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                <User className="w-4 h-4" />
              </View>
              <View className="flex flex-col items-start">
                <Text className="font-semibold text-sm text-amber-700 group-hover:text-amber-800">Become a Teacher</Text>
                <Text className="text-[10px] text-amber-600/70">Join the faculty</Text>
              </View>
            </Link>
          )}
        </View>

        {/* Share Action Area */}
        <View className="mt-3">
          <View
            onPress={async () => {
              try {
                await Share.share({
                  title: 'Join Dheeyudha',
                  text: 'Are you smart enough? Join me in the War of Intellect on Dheeyudha! 🧠🔥',
                  url: 'https://dheeyudha.com',
                  dialogTitle: 'Invite Friends',
                });
              } catch (e) {
                console.error('Error sharing', e);
              }
            }}
            className="group flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400/10 to-teal-400/10 border border-emerald-200/50 hover:bg-gradient-to-r hover:from-emerald-400/20 hover:to-teal-400/20 transition-all duration-200 flex-row"
          >
            <View className="bg-emerald-100 rounded-lg p-1.5 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
              <Share2 className="w-4 h-4" />
            </View>
            <View className="flex flex-col items-start">
              <Text className="font-semibold text-sm text-emerald-700 group-hover:text-emerald-800">Invite Friends</Text>
              <Text className="text-[10px] text-emerald-600/70">Earn points when they join</Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View className="mt-2">
          <View
            onPress={() => setHelpOpen((s) => !s)}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex-row"
          >
            <View className="flex items-center gap-3 flex-row">
              <Info className="w-5 h-5 text-slate-400" />
              <Text>Help & Resources</Text>
            </View>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${helpOpen ? 'rotate-180' : ''}`} />
          </View>

          <View className={`overflow-hidden transition-all duration-300 ease-in-out ${helpOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            <View className="pl-11 pr-2 space-y-1 border-l-2 border-slate-100 ml-5 py-1">
              {HELP_LINKS.map((link) => (
                <View key={link.label}>
                  {link.soon ? (
                    <View className="flex items-center justify-between text-xs py-1.5 px-2 text-slate-400 dark:text-slate-500 cursor-not-allowed flex-row">
                      <Text>{link.label}</Text>
                    </View>
                  ) : (
                    <Link
                      href={link.href}
                      className="flex items-center justify-between text-xs py-1.5 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors flex-row"
                    >
                      <Text>{link.label}</Text>
                    </Link>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* User Footer */}
      <View className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group flex-row"
        >
          <View className="relative h-10 w-10 shrink-0">
            <View className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-fuchsia-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></View>
            <View className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
              {(user?.user_metadata?.avatar_url || user?.user_metadata?.custom_avatar_url || user?.user_metadata?.picture) ? (
                <Image source={{ uri: user.user_metadata.avatar_url || user?.user_metadata?.custom_avatar_url || user.user_metadata.picture }} alt="Profile" className="object-cover h-full w-full" />
              ) : (
                <View className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm flex-row">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </View>
              )}
            </View>
            {user?.user_metadata?.isTeacher && (
              <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]">
                <TeacherBadge />
              </View>
            )}
          </View>

          <View className="flex-1 min-w-0 flex-row">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {user?.user_metadata?.fullName || 'Guest User'}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email || 'Sign in to sync'}
            </Text>
          </View>

          <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        </Link>
      </View>
    </View>
  );
}
