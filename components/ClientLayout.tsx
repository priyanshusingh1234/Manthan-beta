"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Dynamic import for PushNotifications to avoid SSR issues
const initNativePush = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Register listeners
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[NativePush] Token:', token.value);
      // Save this token to the database
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: {
            endpoint: token.value,
            // Mark as native for server-side distinction
            keys: { auth: 'native', p256dh: 'native' }
          }
        })
      });
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[NativePush] Registration error:', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NativePush] Received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[NativePush] Action performed:', notification);
    });

    // Check permissions and register
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Alerts',
        description: 'Important notifications like follows and challenges',
        importance: 5,
        visibility: 1,
        vibration: true
      });
      await PushNotifications.register();
    }

  } catch (err) {
    console.error('[NativePush] Init error:', err);
  }
};

const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

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

  // Handle Capacitor Back Button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optional: Perform a custom action or just let it stay on the home page
        // If we don't call App.exitApp(), the app won't close.
        console.log('No back history, staying on current page.');
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user && Capacitor.isNativePlatform()) {
        initNativePush(user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        // Trigger weekly report check/generation
        fetch('/api/report/generate-notification', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }).catch(() => { });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user && Capacitor.isNativePlatform()) {
        initNativePush(session.user.id);
      }
      if (session?.access_token) {
        fetch('/api/report/generate-notification', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }).catch(() => { });
      }
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