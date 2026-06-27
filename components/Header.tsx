'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, User, PlusCircle, Trophy, Mail, Info, FileQuestion, BookOpen, GraduationCap, Sparkles, HelpCircle, Shield, Bell, LucideIcon, Moon, Sun, CheckSquare, Swords, Search, MessageSquare, Compass, Zap, Flame, PlaySquare, Gift, Skull } from 'lucide-react';
import { useTheme } from 'next-themes';
import LoginBonusModal from './LoginBonusModal';

import { supabase } from '@/lib/supabaseClient';
import NotificationBell from './NotificationBell';
import { User as SupabaseUser } from '@supabase/supabase-js';

// ── Streak pill shown next to NotificationBell ───────────────────────────────
function StreakPill() {
  const [streak, setStreak] = React.useState(0);
  const [goalMet, setGoalMet] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const { data } = await supabase
        .from('profiles')
        .select('streak_count, daily_solve_count, daily_solve_date')
        .eq('id', session.user.id)
        .single();
      if (!data || cancelled) return;
      const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStreak(Number(data.streak_count) || 0);
      setGoalMet(data.daily_solve_date === today && (Number(data.daily_solve_count) || 0) >= 2);
    };
    load();
    // Refresh after every solve (streak_earned event)
    const onEarned = () => load();
    window.addEventListener('streak_earned', onEarned);
    return () => { cancelled = true; window.removeEventListener('streak_earned', onEarned); };
  }, []);

  if (streak === 0 && !goalMet) return null;

  return (
    <Link href="/streaks" title="My streak">
      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-all active:scale-95 ${
        goalMet
          ? 'bg-orange-500/20 border border-orange-400/40 text-orange-300'
          : 'bg-white/10 border border-white/20 text-white/80'
      }`}>
        <Flame className={`w-3.5 h-3.5 ${goalMet ? 'text-orange-400 animate-pulse' : 'text-white/60'}`} fill={goalMet ? '#fb923c' : 'none'} />
        <span>{streak}</span>
      </span>
    </Link>
  );
}

interface HeaderProps {
  isMobile?: boolean;
}

interface PageInfo {
  title: string;
  icon: LucideIcon;
}

const Header: React.FC<HeaderProps> = ({ isMobile = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isFirstSearch, setIsFirstSearch] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    const hide = () => setNavHidden(true);
    const show = () => setNavHidden(false);
    window.addEventListener('hide-nav', hide);
    window.addEventListener('show-nav', show);
    return () => {
      window.removeEventListener('hide-nav', hide);
      window.removeEventListener('show-nav', show);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const visited = localStorage.getItem('dheeyudha_search_visited');
      if (!visited) setIsFirstSearch(true);
    }
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
        } catch { /* ignore */ }
      }

      if (mounted) setUser(finalUser);
      
      // Still fetch the actual fresh user in background to ensure it wasn't externally updated
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (mounted && user) {
          if (typeof window !== 'undefined') {
              const cachedMeta = localStorage.getItem('dheeyudha_user_meta_cache');
              const finalMeta = cachedMeta ? { ...user.user_metadata, ...JSON.parse(cachedMeta) } : user.user_metadata;
              setUser({ ...user, user_metadata: finalMeta });
          } else {
              setUser(user);
          }
        }
      });
    };

    syncSessionAndCache();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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
      listener?.subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('user_metadata_updated', handleMetaUpdate);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedInsideHost = dropdownRef.current && dropdownRef.current.contains(event.target as Node);
      const clickedInsidePortal = portalRef.current && portalRef.current.contains(event.target as Node);
      if (!clickedInsideHost && !clickedInsidePortal) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen, dropdownOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    function updatePosition() {
      const btn = avatarButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const dropdownWidth = 224; // 14rem for the new dropdown
      const left = Math.max(8, rect.right - dropdownWidth);
      const top = rect.bottom + window.scrollY + 12; // Gap of 12px
      setDropdownCoords({ top, left });
    }

    if (dropdownOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [dropdownOpen]);

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }
  if (navHidden) return null;

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
  };

  const UserAvatar: React.FC = () => {
    const [cachedMeta, setCachedMeta] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const c = localStorage.getItem('dheeyudha_user_meta_cache');
            return c ? JSON.parse(c) : null;
        }
        return null;
    });

    useEffect(() => {
        const h = () => {
            const c = localStorage.getItem('dheeyudha_user_meta_cache');
            if (c) setCachedMeta(JSON.parse(c));
        };
        window.addEventListener('user_metadata_updated', h);
        return () => window.removeEventListener('user_metadata_updated', h);
    }, []);

    const avatarUrl = cachedMeta?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.custom_avatar_url || user?.user_metadata?.picture;
    const fullName = cachedMeta?.fullName || user?.user_metadata?.fullName;

    return (
        <span className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden border-[3px] border-white/40 hover:border-white transition-all shadow-lg hover:shadow-white/20">
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <span className="flex items-center justify-center h-full w-full text-xl font-bold text-indigo-700 bg-white shadow-inner">
                    {fullName?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        'U'}
                </span>
            )}
        </span>
    );
  };

  const getPageInfo = (): PageInfo | null => {
    if (!pathname || pathname === '/') return null;
    if (pathname.startsWith('/profile')) return { title: 'Profile', icon: User };
    if (pathname.startsWith('/questions/create')) return { title: 'Create Question', icon: PlusCircle };
    if (pathname.startsWith('/questions')) return { title: 'Solve Question', icon: FileQuestion };
    if (pathname.startsWith('/leaderboard')) return { title: 'Leaderboard', icon: Trophy };
    if (pathname.startsWith('/war')) return { title: 'Battle Room', icon: Shield };
    if (pathname.startsWith('/feed')) return { title: 'Community Feed', icon: Sparkles };
    if (pathname.startsWith('/contact')) return { title: 'Contact Support', icon: Mail };
    if (pathname.startsWith('/about')) return { title: 'About App', icon: Info };
    if (pathname.startsWith('/teacher')) return { title: 'Teacher Hub', icon: GraduationCap };
    if (pathname.startsWith('/subject')) return { title: 'Subjects', icon: BookOpen };
    if (pathname.startsWith('/docs')) return { title: 'Documentation', icon: HelpCircle };
    if (pathname.startsWith('/privacy')) return { title: 'Privacy Policy', icon: Shield };
    if (pathname.startsWith('/notifications')) return { title: 'Notifications', icon: Bell };
    if (pathname.startsWith('/chat')) return { title: 'Messages', icon: MessageSquare };
    if (pathname.startsWith('/duels') || pathname.startsWith('/duel')) return { title: 'My Duels', icon: Swords };
    if (pathname.startsWith('/gauntlet')) return { title: 'Chapter Gauntlet', icon: BookOpen };
    return null;
  };

  const pageInfo = getPageInfo();
  const showBonusButton = user && user.user_metadata?.loginBonusCompleted !== true;

  return (
    <>
      {bonusModalOpen && <LoginBonusModal onClose={() => setBonusModalOpen(false)} />}
      {/* Professional Mobile-Only Header */}
      <header className="md:hidden sticky top-0 z-[60] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pageInfo ? pageInfo.title : 'Dheeyudha'}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <NotificationBell isMobile={true} />
                </div>
                {user?.user_metadata?.isTeacher && (
                  <Link
                    href="/questions/create"
                    className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 rounded-full active:scale-95"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Link>
                )}
                <Link href="/profile" className="active:scale-95 transition-transform flex items-center justify-center">
                  <span className="inline-block h-9 w-9 rounded-full overflow-hidden border-[2px] border-slate-200 dark:border-slate-700 shadow-sm relative">
                    {(user?.user_metadata?.avatar_url || user?.user_metadata?.custom_avatar_url || user?.user_metadata?.picture) ? (
                      <Image src={user.user_metadata.avatar_url || user?.user_metadata?.custom_avatar_url || user.user_metadata.picture} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="flex items-center justify-center h-full w-full text-base font-bold text-indigo-600 bg-white">
                        {user?.user_metadata?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full active:scale-95">Sign In</Link>
            )}
          </div>
        </div>

        {/* Reddit-like Horizontal Links Slider */}
        {user && (
          <div className="mt-3 overflow-x-auto scrollbar-hide flex items-center gap-1.5 pb-1 snap-x">
            {showBonusButton && (
              <button
                onClick={() => setBonusModalOpen(true)}
                className="flex-shrink-0 snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all relative bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)] animate-pulse"
              >
                <Gift className="w-3.5 h-3.5 text-white" />
                <span>Daily Bonus</span>
              </button>
            )}
            {[
              { label: 'Streak 🔥', href: '/streaks', icon: Flame },
              { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
              { label: 'Gauntlet 📖', href: '/gauntlet', icon: BookOpen },
              { label: 'Duels ⚔️', href: '/duels', icon: Swords },
              { label: 'Arena', href: '/tests', icon: Zap },
              { label: 'Search', href: '/search', icon: Search },
              { label: 'Clips', href: '/clips', icon: PlaySquare },
              { label: 'Feed', href: '/feed', icon: Compass },
              { label: 'Checker', href: '/checker-feed', icon: Shield },
              { label: 'Solved', href: '/solved', icon: CheckSquare },
              { label: 'Docs', href: '/docs', icon: HelpCircle },
              { label: 'Support', href: '/contact', icon: Mail },
            ].map((nav) => {
              const active = pathname === nav.href;
              return (
                <Link
                  key={nav.label}
                  href={nav.href}
                  className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all relative ${
                    active
                      ? nav.href === '/streaks'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : nav.label === 'Search' && isFirstSearch
                        ? 'bg-blue-500/20 border-blue-400 text-blue-600 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : nav.href === '/streaks'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <nav.icon className={`w-3.5 h-3.5 ${nav.href === '/streaks' ? 'text-orange-500' : nav.label === 'Search' && isFirstSearch && !active ? 'text-blue-600' : ''}`} />
                  <span>{nav.label}</span>
                  {nav.label === 'Search' && isFirstSearch && !active && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border border-white dark:border-slate-900 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block relative isolate z-50">
        {/* Dynamic Main Header Background */}
        <div className="absolute inset-0 overflow-hidden -z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl pointer-events-none rounded-b-[2rem] border-b border-white/10">
          <div className="absolute inset-0 bg-transparent bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 via-blue-500/30 to-cyan-400/30 animate-gradient-slow blur-[2px]" />

          {/* Animated glowing orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="px-4 py-3 sm:px-6 lg:px-8 mx-auto xl:max-w-screen-2xl">
          <div className="flex items-center justify-between">

            {/* Top Left: Brand Name */}
            <Link href="/" className="shrink-0 hover:opacity-80 active:scale-95 transition-all duration-200">
              <span
                style={{ fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}
                className="text-[22px] font-semibold tracking-tight text-white select-none"
              >
                dheeyudha
              </span>
            </Link>

            {/* Top Center: Title & Page Info */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-slideUp overflow-hidden group hover:bg-white/15 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span className="text-sm sm:text-base font-extrabold tracking-[0.15em] text-white drop-shadow-md">
                DHEEYUDHA
              </span>
              {pageInfo && (
                <>
                  <span className="text-white/40 text-[10px] sm:text-xs font-bold px-0.5">•</span>
                  <pageInfo.icon className="w-5 h-5 text-indigo-100 animate-pulse hidden sm:block" />
                  <span className="text-[10px] sm:text-sm font-bold text-white tracking-widest uppercase truncate max-w-[200px] lg:max-w-[400px]">
                    {pageInfo.title}
                  </span>
                </>
              )}
            </div>

            {/* Mobile Centered Title (Removed) */}

            {/* Top Right: Actions & Auth */}
            <div className="flex items-center gap-3 shrink-0">

              {isMounted && (
                <div className="flex items-center gap-2">
                  {showBonusButton && (
                    <button
                      onClick={() => setBonusModalOpen(true)}
                      className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-full border text-sm font-black transition-all active:scale-95 bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse"
                      title="Daily Bonus"
                    >
                      <Gift className="w-4 h-4 text-white" />
                      <span>Bonus</span>
                    </button>
                  )}
                  <Link
                    href="/search"
                    className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 relative ${isFirstSearch ? 'animate-pulse bg-white/30 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}`}
                    title="Search Dheeyudha"
                  >
                    <Search className="w-5 h-5" />
                    {isFirstSearch && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full border border-white shadow-sm" />
                    )}
                  </Link>
                  <Link
                    href="/streaks"
                    className={`hidden md:flex items-center gap-1.5 px-3 h-10 rounded-full border text-sm font-black transition-all active:scale-95 ${
                      pathname === '/streaks'
                        ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                    title="My Streak"
                  >
                    <Flame className={`w-4 h-4 ${pathname === '/streaks' ? 'text-white' : 'text-orange-400'}`} fill={pathname === '/streaks' ? 'white' : '#fb923c'} />
                    <span>Streak</span>
                  </Link>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95"
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {user ? (
                <>
                  {/* Mobile Icons */}
                  {user?.user_metadata?.isTeacher && (
                    <Link
                      href="/questions/create"
                      className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-white bg-blue-500/40 border border-white/30 hover:bg-blue-500/60 transition-all shadow-md active:scale-95"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Link>
                  )}

                  <Link href="/profile" className="lg:hidden active:scale-95 transition-transform">
                    <UserAvatar />
                  </Link>

                  {/* Desktop Icons */}
                  <div className="hidden lg:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <NotificationBell isMobile={false} />
                    </div>

                    <div className="relative" ref={dropdownRef}>
                      <button
                        ref={avatarButtonRef}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="group flex items-center gap-2 outline-none"
                      >
                        <div className="relative transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                          <UserAvatar />
                          {/* Glow ring on hover */}
                          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping mix-blend-overlay" />
                        </div>
                      </button>

                      {/* Portal Dropdown Menu */}
                      {dropdownOpen && typeof window !== 'undefined' && createPortal(
                        <div
                          ref={portalRef}
                          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-popIn w-56 flex flex-col"
                          style={{ position: 'absolute', top: dropdownCoords.top, left: dropdownCoords.left, zIndex: 9999 }}
                        >
                          <div className="px-5 py-5 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-purple-50 dark:to-purple-950/30 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-1 shadow-sm">Account</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                            <Link
                              href="/profile"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition-all"
                            >
                              <User className="h-5 w-5" />
                              <span>My Profile</span>
                            </Link>

                            {!user?.user_metadata?.isTeacher && (
                              <Link
                                href="/duels"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-sm border border-transparent hover:border-orange-100 dark:hover:border-orange-900/40 transition-all"
                              >
                                <Swords className="h-5 w-5" />
                                <span>My Duels</span>
                              </Link>
                            )}

                            <Link
                              href="/docs"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition-all"
                            >
                              <HelpCircle className="h-5 w-5" />
                              <span>Help &amp; Docs</span>
                            </Link>

                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/50 transition-all"
                            >
                              <LogOut className="h-5 w-5" />
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="hidden sm:inline-block text-white font-semibold hover:text-blue-100 transition-colors px-4 py-2 text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden sm:inline-block text-indigo-900 bg-white hover:bg-blue-50 transition-all font-bold rounded-xl px-5 py-2.5 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] hover:-translate-y-[1px]"
                  >
                    Join Dheeyudha
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Header spacer */}
        <div className="md:hidden h-[calc(env(safe-area-inset-top)+100px)]" />
        <div className="hidden md:block h-20 sm:h-24 md:h-28" />
      </header>
    </>
  );
}

export default Header;
