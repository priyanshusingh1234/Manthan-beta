"use client";
import React, { useState, useEffect } from 'react';
import { Home, Compass, LucideIcon, ShieldAlert, MessageSquare, FileText, Settings, Flame } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabaseClient';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isCenter?: boolean;
}

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [streakCount, setStreakCount] = useState(0);
  const [goalMet, setGoalMet] = useState(false);

  useEffect(() => {
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
      setStreakCount(Number(data.streak_count) || 0);
      setGoalMet(data.daily_solve_date === today && (Number(data.daily_solve_count) || 0) >= 2);
    };
    load();
    window.addEventListener('streak_earned', load);
    return () => { cancelled = true; window.removeEventListener('streak_earned', load); };
  }, []);

  const handleNavClick = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
    }
  };

  if (pathname?.startsWith('/store') || pathname?.startsWith('/clips') || (pathname?.startsWith('/posts/') && pathname !== '/posts/create')) return null;

  const navItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/my-school', icon: ShieldAlert, label: 'Faction', isCenter: true },
    { href: '/feed', icon: Compass, label: 'Feed' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-[100] transform-gpu bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-white/60 dark:border-slate-800/80 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_20px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* Glass gradient overlay for extra shine */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-slate-800/20 to-white/10 dark:to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between px-2 h-16 max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <div key={item.href} className="relative -top-8 group">
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  aria-label="War"
                  className={`
                    flex flex-col items-center justify-center
                    w-16 h-16 rounded-full
                    bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600
                    text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/50
                    border-[6px] border-[#f8fafc] dark:border-slate-950 
                    transform transition-all duration-300 ease-out
                    hover:scale-105 active:scale-95 hover:shadow-indigo-500/50 
                    active:shadow-inner
                  `}
                >
                  <Icon size={24} strokeWidth={2.5} className="drop-shadow-md" />
                  {/* Ripple/Pulse effect */}
                  <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse active:hidden" />
                </Link>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-900/50 dark:text-indigo-400/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  My Faction
                </div>
              </div>
            );
          }

          // Streak badge on Home tab
          const isHome = item.href === '/';

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`
                relative flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-300 group
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
              `}
            >
              {/* Active Indicator Background */}
              {isActive && (
                <div className="absolute top-2 w-10 h-8 bg-blue-50 dark:bg-blue-900/40 rounded-xl -z-10 transition-all duration-300 transform scale-100 opacity-100 border border-blue-100/50 dark:border-blue-800/50" />
              )}

              {/* Streak pill above Home icon */}
              {isHome && streakCount > 0 && (
                <Link href="/streaks"
                  onClick={e => e.stopPropagation()}
                  className={`absolute top-1 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black z-10 transition-all ${
                    goalMet
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                  <Flame className="w-2.5 h-2.5" fill={goalMet ? 'white' : 'none'} />
                  <span>{streakCount}</span>
                </Link>
              )}

              <div className={`
                relative p-1.5 rounded-xl transition-all duration-300 transform
                ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}
              `}>
                <Icon
                  size={isActive ? 24 : 22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}
                />
              </div>

              <span className={`
                text-[10px] font-medium leading-none transition-all duration-300
                ${isActive ? 'opacity-100 translate-y-0 font-bold' : 'opacity-60 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}
              `}>
                {item.label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_8px_currentColor]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;