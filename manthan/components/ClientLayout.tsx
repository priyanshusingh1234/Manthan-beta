"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';

const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isAndroid, setIsAndroid] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsAndroid(/android|mobile|iphone|ipad|ipod/.test(ua));
    }
  }, []);

  // Hide BottomNav on homepage only
  const showBottomNav = isAndroid && pathname !== '/';

  return (
    <>
      <Header isAndroid={isAndroid} />
      {children}
      {showBottomNav && <BottomNav />}
    </>
  );
}