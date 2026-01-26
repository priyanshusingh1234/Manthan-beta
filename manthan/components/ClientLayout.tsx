"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';

const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsAndroid(/android|mobile|iphone|ipad|ipod/.test(ua));
    }
  }, []);

  // Show BottomNav on all pages for Android/mobile devices
  const showBottomNav = isAndroid;

  return (
    <>
      <Header isAndroid={isAndroid} />
      {children}
      {showBottomNav && <BottomNav />}
    </>
  );
}