"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if device is mobile based on screen size or user agent
      const checkMobile = () => {
        const isMobileUA = /android|mobile|iphone|ipad|ipod/i.test(window.navigator.userAgent);
        const isMobileScreen = window.innerWidth < 768; // md breakpoint
        setIsMobile(isMobileUA || isMobileScreen);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Show BottomNav on all mobile devices (Android, iOS, or small screens)
  const showBottomNav = isMobile;
  const pathname = usePathname();
  const hideSidebar = pathname === '/login' || pathname === '/signup';

  return (
    <>
      {!hideSidebar && <DesktopSidebar />}
      <div className={hideSidebar ? 'lg:pl-0' : 'lg:pl-64'}>
        <Header isMobile={isMobile} />
        {children}
        {showBottomNav && <BottomNav />}
      </div>
    </>
  );
}