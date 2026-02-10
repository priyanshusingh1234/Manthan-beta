
"use client";
import React from 'react';
import { Home, Settings, Sword, Trophy, Rss } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';



export default function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/war', icon: Sword, label: 'War', isCenter: true },
    { href: '/feed', icon: Rss, label: 'Feed' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-safe md:hidden"
      style={{ 
        height: 'calc(4rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map(({ href, icon: Icon, label, isCenter }) => {
        const isActive = pathname === href;
        
        if (isCenter) {
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center gap-1
                rounded-full w-14 h-14 -mt-6 
                shadow-lg border-4 border-white
                transition-all duration-300 ease-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
                ${isActive 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white scale-105 shadow-orange-300' 
                  : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-orange-400 hover:to-orange-500 hover:scale-105 active:scale-95'
                }
              `}
              style={{ zIndex: 2 }}
            >
              <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          );
        }
        
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`
              flex flex-col items-center justify-center gap-1 
              min-w-[44px] min-h-[44px] px-2 py-1
              rounded-lg
              transition-all duration-200 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
              ${isActive 
                ? 'text-blue-600 scale-105' 
                : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50 active:scale-95'
              }
            `}
          >
            <Icon 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2} 
              aria-hidden="true"
              className="transition-transform"
            />
            <span className={`text-[10px] leading-none transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
