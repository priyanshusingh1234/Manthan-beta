'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, User, PlusCircle, Trophy, Mail, Info, FileQuestion, BookOpen, GraduationCap, Sparkles, HelpCircle, Shield, Bell, LucideIcon } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import NotificationBell from './NotificationBell';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
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

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
  };

  const UserAvatar: React.FC = () => (
    <span className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden border-[3px] border-white/40 hover:border-white transition-all shadow-lg hover:shadow-white/20">
      {user && user.user_metadata?.avatar_url ? (
        <Image
          src={user.user_metadata.avatar_url}
          alt="avatar"
          width={44}
          height={44}
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex items-center justify-center h-full w-full text-xl font-bold text-indigo-700 bg-white shadow-inner">
          {user?.user_metadata?.fullName?.[0]?.toUpperCase() ||
            user?.email?.[0]?.toUpperCase() ||
            'U'}
        </span>
      )}
    </span>
  );

  const getPageInfo = (): PageInfo | null => {
    if (!pathname || pathname === '/') return null;
    if (pathname.startsWith('/profile')) return { title: 'User Profile', icon: User };
    if (pathname.startsWith('/questions/create')) return { title: 'Create Custom Question', icon: PlusCircle };
    if (pathname.startsWith('/questions')) return { title: 'Solve Question', icon: FileQuestion };
    if (pathname.startsWith('/leaderboard')) return { title: 'Global Leaderboard', icon: Trophy };
    if (pathname.startsWith('/contact')) return { title: 'Contact Us', icon: Mail };
    if (pathname.startsWith('/about')) return { title: 'About Dheeyudha', icon: Info };
    if (pathname.startsWith('/teacher')) return { title: 'Teacher Profile', icon: GraduationCap };
    if (pathname.startsWith('/subject')) return { title: 'Subject Hub', icon: BookOpen };
    if (pathname.startsWith('/docs')) return { title: 'Documentation', icon: HelpCircle };
    if (pathname.startsWith('/privacy')) return { title: 'Privacy Policy', icon: Shield };
    if (pathname.startsWith('/notifications')) return { title: 'Notifications', icon: Bell };

    const fallbackTitle = pathname.split('/')[1] || '';
    return { title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1) || 'Page', icon: Sparkles };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="relative isolate z-50">
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

          {/* Mobile Centered Title */}
          <div className="flex md:hidden flex-1 justify-center px-2">
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold tracking-[0.15em] text-white drop-shadow-md">
                DHEEYUDHA
              </span>
              {pageInfo && (
                <div className="flex items-center gap-1 opacity-90">
                  <pageInfo.icon className="w-3 h-3 text-indigo-100" />
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase truncate max-w-[120px]">
                    {pageInfo.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top Right: Actions & Auth */}
          <div className="flex items-center gap-3 shrink-0">



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
                  {user?.user_metadata?.isTeacher && (
                    <Link
                      href="/questions/create"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>Post Question</span>
                    </Link>
                  )}

                  {/* Notification bell */}
                  <NotificationBell />

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
                        className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-popIn w-56 flex flex-col"
                        style={{ position: 'absolute', top: dropdownCoords.top, left: dropdownCoords.left, zIndex: 9999 }}
                      >
                        <div className="px-5 py-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
                          <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-1 shadow-sm">Account</p>
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="p-2 space-y-1 bg-white">
                          <Link
                            href="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                          >
                            <User className="h-5 w-5" />
                            <span>My Profile</span>
                          </Link>

                          <Link
                            href="/docs"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                          >
                            <HelpCircle className="h-5 w-5" />
                            <span>Help &amp; Docs</span>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-100 transition-all"
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
      <div className="hidden sm:block h-20 sm:h-24 md:h-28" />
    </header>
  );
}

export default Header;
