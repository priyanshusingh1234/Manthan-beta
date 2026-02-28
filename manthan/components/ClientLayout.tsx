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

  // Global Image Proxy for ISP Block Bypassing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!realUrl) return;

    const proxyUrl = window.location.origin + '/api/supabase-proxy';

    const redirectImage = (img: HTMLImageElement) => {
      // Decode URL if Next.js optimized it, and check against Supabase
      const actualSrc = decodeURIComponent(img.src);
      if (actualSrc.includes(realUrl)) {
        img.src = actualSrc.replace(realUrl, proxyUrl);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IMG') {
              redirectImage(node as HTMLImageElement);
            } else if (node.nodeType === 1) { // Element node
              const imgs = (node as Element).querySelectorAll('img');
              imgs.forEach(redirectImage);
            }
          });
        }

        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const target = mutation.target as HTMLImageElement;
          if (target.nodeName === 'IMG') {
            redirectImage(target);
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    // Clean up initial ones immediately
    document.querySelectorAll('img').forEach(redirectImage);

    return () => observer.disconnect();
  }, []);

  // Show BottomNav on all mobile devices (Android, iOS, or small screens)
  const showBottomNav = isMobile;
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  const isTrailerPage = pathname === '/trailer';

  // Hide the sidebar if:
  // 1. We are on an auth page
  // 2. We are definitely NOT authenticated
  // 3. We are on the landing page (home) AND we're still checking auth (prevents flash for logged-out users)
  // 4. We are on the trailer showcase page
  const hideSidebar = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null) || isTrailerPage;

  return (
    <>
      {!hideSidebar && <DesktopSidebar />}
      <div className={`${hideSidebar ? 'lg:pl-0' : 'lg:pl-64'} ${showBottomNav && !hideSidebar ? 'pb-24' : ''}`}>
        {!hideSidebar && <Header isMobile={isMobile} />}
        {children}
        {showBottomNav && !hideSidebar && <BottomNav />}
      </div>
      {isAuthenticated && <PushNotificationPrompt />}
    </>
  );
}