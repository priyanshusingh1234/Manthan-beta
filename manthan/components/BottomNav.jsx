
"use client";
import React from 'react';
import { Home, Settings, Sword, Trophy, Rss } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';



export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-end bg-gradient-to-t from-white via-white/90 to-white/70 border-t border-gray-200 shadow-2xl h-20 md:hidden px-2">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center transition-all duration-200 ${pathname === '/' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-500'} w-12`}
      >
        <Home size={pathname === '/' ? 28 : 24} strokeWidth={pathname === '/' ? 2.5 : 2} />
        <span className={`text-xs mt-1 ${pathname === '/' ? 'font-bold' : ''}`}>Home</span>
      </Link>
      {/* Leaderboard */}
      <Link
        href="/leaderboard"
        className={`flex flex-col items-center justify-center transition-all duration-200 ${pathname === '/leaderboard' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-500'} w-12`}
      >
        <Trophy size={pathname === '/leaderboard' ? 28 : 24} strokeWidth={pathname === '/leaderboard' ? 2.5 : 2} />
        <span className={`text-xs mt-1 ${pathname === '/leaderboard' ? 'font-bold' : ''}`}>Leaderboard</span>
      </Link>
      {/* War (center) */}
      <Link
        href="/war"
        className={`flex flex-col items-center justify-center rounded-full w-16 h-16 -mt-10 shadow-xl border-4 border-white transition-all duration-200 ${pathname === '/war' ? 'bg-orange-500 text-white scale-110' : 'bg-blue-600 text-white hover:bg-orange-400 scale-100'}`}
        style={{ zIndex: 2 }}
      >
        <Sword size={32} strokeWidth={2.5} />
        <span className="text-xs mt-1 font-bold">War</span>
      </Link>
      {/* Feed */}
      <Link
        href="/feed"
        className={`flex flex-col items-center justify-center transition-all duration-200 ${pathname === '/feed' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-500'} w-12`}
      >
        <Rss size={pathname === '/feed' ? 28 : 24} strokeWidth={pathname === '/feed' ? 2.5 : 2} />
        <span className={`text-xs mt-1 ${pathname === '/feed' ? 'font-bold' : ''}`}>Feed</span>
      </Link>
      {/* Settings */}
      <Link
        href="/settings"
        className={`flex flex-col items-center justify-center transition-all duration-200 ${pathname === '/settings' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-500'} w-12`}
      >
        <Settings size={pathname === '/settings' ? 28 : 24} strokeWidth={pathname === '/settings' ? 2.5 : 2} />
        <span className={`text-xs mt-1 ${pathname === '/settings' ? 'font-bold' : ''}`}>Settings</span>
      </Link>
    </nav>
  );
}
