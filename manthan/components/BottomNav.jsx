import React from 'react';
import { Home, Settings, Sword, Trophy, Rss } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: <Home />, label: 'Home' },
  { href: '/war', icon: <Sword />, label: 'War' },
  { href: '/leaderboard', icon: <Trophy />, label: 'Leaderboard' },
  { href: '/feed', icon: <Rss />, label: 'Feed' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center bg-white border-t border-gray-200 shadow-lg h-16 md:hidden">
      {navItems.slice(0,2).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center text-gray-700 hover:text-blue-600">
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
      <Link href="/settings" className="flex flex-col items-center justify-center bg-blue-600 text-white rounded-full w-14 h-14 -mt-8 shadow-lg border-4 border-white">
        <Settings size={28} />
      </Link>
      {navItems.slice(2).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center text-gray-700 hover:text-blue-600">
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
