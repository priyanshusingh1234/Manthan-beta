"use client";
import React from 'react';
import { Home, Compass, LucideIcon, ShieldAlert, MessageSquare, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isCenter?: boolean;
}

const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const handleNavClick = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
    }
  };

  if (pathname?.startsWith('/store')) return null;

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