"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Show BottomNav on all mobile devices (Android, iOS, or small screens)
  const showBottomNav = isMobile;
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  
  // Hide the sidebar if:
  // 1. We are on an auth page
  // 2. We are definitely NOT authenticated
  // 3. We are on the landing page (home) AND we're still checking auth (prevents flash for logged-out users)
  const hideSidebar = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null);

  return (
    <>
      {!hideSidebar && <DesktopSidebar />}
      <div className={hideSidebar ? 'lg:pl-0' : 'lg:pl-64'}>
        {!hideSidebar && <Header isMobile={isMobile} />}
        {children}
        {showBottomNav && !hideSidebar && <BottomNav />}
      </div>
      {isAuthenticated && <PushNotificationPrompt />}
    </>
  );
}