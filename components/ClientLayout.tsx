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
import { StatusBar } from '@capacitor/status-bar';
import { ActivityTracker } from '@/lib/activityTracker';
import CongratsBadgeModal from '@/components/CongratsBadgeModal';


let nativePushInitialized = false;

function normalizeInAppPath(input?: string | null): string | null {
  if (!input) return null;
  try {
    if (input.startsWith('/')) return input;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const parsed = new URL(input);
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return path.startsWith('/') ? path : `/${path}`;
    }
    return input.startsWith('/') ? input : `/${input}`;
  } catch {
    return input.startsWith('/') ? input : `/${input}`;
  }
}

function safeNavigate(path: string, navigate: (path: string) => void) {
  try {
    navigate(path);
  } catch {
    if (typeof window !== 'undefined') {
      window.location.assign(path);
    }
    return;
  }

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (current !== path) {
        window.location.assign(path);
      }
    }, 300);
  }
}

// Dynamic import for PushNotifications to avoid SSR issues
const initNativePush = async (userId: string, navigate: (path: string) => void) => {
  if (!Capacitor.isNativePlatform()) return;
  if (nativePushInitialized) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    nativePushInitialized = true;

    const navigateFromPayload = (payload: any) => {
      const data = payload?.notification?.data || payload?.data || {};

      const rawUrl =
        payload?.url ||
        payload?.href ||
        payload?.link ||
        payload?.notification?.url ||
        payload?.notification?.link ||
        data?.url ||
        data?.href ||
        data?.link ||
        data?.deep_link ||
        payload?.notification?.data?.url ||
        payload?.notification?.data?.href ||
        payload?.notification?.data?.link ||
        payload?.notification?.data?.deep_link ||
        null;

      const path = normalizeInAppPath(rawUrl);
      if (path) {
        // Persist across cold-start: if navigate fails (too early), session storage will pick it up
        try { sessionStorage.setItem('pendingNotifNav', path); } catch {}
        safeNavigate(path, navigate);
      }
    };

    // ── Check for a pending navigation from a previous cold-start tap ──
    try {
      const pending = sessionStorage.getItem('pendingNotifNav');
      if (pending) {
        sessionStorage.removeItem('pendingNotifNav');
        // Slight delay so router is ready
        setTimeout(() => safeNavigate(pending, navigate), 500);
      }
    } catch {}

    // ── Register listeners BEFORE calling register() so no events are missed ──
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[NativePush] Token:', token.value);
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: {
            endpoint: token.value,
            keys: { auth: 'native', p256dh: 'native' }
          }
        })
      });
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[NativePush] Registration error:', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NativePush] Foreground notification received:', notification);
    });

    // This fires when user TAPS a notification (app in foreground or background)
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NativePush] Notification tapped:', JSON.stringify(action));
      navigateFromPayload(action);
    });

    // ── Handle deep links from FCM data messages (cold-start tap) ──
    // FCM can launch the app with a URL via the data payload
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('[NativePush] appUrlOpen:', url);
      const path = normalizeInAppPath(url);
      if (path) safeNavigate(path, navigate);
    });

    // ── Check permissions and register ──
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

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
    nativePushInitialized = false;
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform();
    const root = document.documentElement;

    root.classList.add('native-platform');
    root.classList.add(platform === 'android' ? 'native-android' : 'native-ios');

    return () => {
      root.classList.remove('native-platform', 'native-android', 'native-ios');
    };
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

  // Handle Capacitor Status Bar UI
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupUI = async () => {
      try {
        const isDark = document.documentElement.classList.contains('dark');
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' } as any);
        await StatusBar.setBackgroundColor({ color: isDark ? '#0f172a' : '#ffffff' });
      } catch (e) {
        console.error('Failed to setup status bar:', e);
      }
    };

    setupUI();

    // Listen for theme changes using MutationObserver on html tag
    const observer = new MutationObserver(setupUI);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user && Capacitor.isNativePlatform()) {
        initNativePush(user.id, (path) => router.push(path));
      }
      if (user) {
        ActivityTracker.restoreFromCloud();
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
        initNativePush(session.user.id, (path) => router.push(path));
      }
      if (session?.user) {
        ActivityTracker.restoreFromCloud();
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
  }, [router]);

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
  const isSearchPage = pathname === '/search';
  const isTestArena = pathname === '/tests';
  const isIndividualTest = pathname?.startsWith('/tests/') || pathname?.startsWith('/test/') || false;

  const hideMainSidebar = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null) || isTrailerPage || isSearchPage || isIndividualTest;
  const hideBottomNav = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null) || isTrailerPage || isIndividualTest;


  return (
    <>
      {!hideMainSidebar && <DesktopSidebar />}
      <div className={`${hideMainSidebar ? 'lg:pl-0' : 'lg:pl-64'} ${showBottomNav && !hideBottomNav ? 'pb-[calc(4rem+env(safe-area-inset-bottom))]' : ''}`}>
        {!hideMainSidebar && !isIndividualTest && <Header isMobile={isMobile} />}
        {children}
        {showBottomNav && !hideBottomNav && <BottomNav />}
      </div>
      {isAuthenticated && <PushNotificationPrompt />}
      {isAuthenticated && <CongratsBadgeModal />}

    </>
  );
}