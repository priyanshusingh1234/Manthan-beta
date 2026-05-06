"use client";
import React, { useEffect, useState } from 'react';
import { supabase, supabaseRealtime } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import GlobalChatListener from '@/components/GlobalChatListener';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ActivityTracker } from '@/lib/activityTracker';
import CongratsBadgeModal from '@/components/CongratsBadgeModal';
import GlobalCallListener from '@/components/GlobalCallListener';
import GlobalPrefetcher from '@/components/GlobalPrefetcher';
import { CallProvider } from '@/components/CallProvider';


import CompleteProfileOverlay from '@/components/CompleteProfileOverlay';
import StreakToast from '@/components/StreakToast';
import StreakLostOverlay from '@/components/StreakLostOverlay';
import { Toaster } from 'react-hot-toast';
import AchievementUnlockOverlay from '@/components/AchievementUnlockOverlay';

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
        try { sessionStorage.setItem('pendingNotifNav', path); } catch { }
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
    } catch { }

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

    await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[NativePush] Foreground/Background push received:', notification);
      const data = notification.data || {};

      if (data.type === 'incoming_call') {
        try {
          const { IncomingCallKit } = await import('@capgo/capacitor-incoming-call-kit');
          const roomId = data.roomId || data.deep_link?.split('/chat/')?.[1]?.split('?')?.[0] || String(Date.now());
          const callerName = data.callerName || data.title || notification.title || 'Scholar';
          await IncomingCallKit.showIncomingCall({
            callId: roomId,
            callerName,
            hasVideo: false,
            appName: 'Dheeyudha',
            android: {
              showFullScreen: true,
              isHighPriority: true,
            }
          });
        } catch (e) {
          console.error('[CallKit] Failed to show incoming call from push', e);
        }
      }
    });

    // This fires when user TAPS a notification or clicks an action button
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NativePush] Notification tapped/action:', action);

      const data = action.notification?.data || {};
      const url = data.url || data.href || data.link || data.deep_link;

      // ── Duel action buttons ──────────────────────────────────────────────
      if (action.actionId === 'accept_duel') {
        // Navigate to the duel page directly
        const path = normalizeInAppPath(data.action_1_url || url || '/duels');
        if (path) safeNavigate(path, navigate);
        return;
      } else if (action.actionId === 'decline_duel') {
        // Just dismiss — no navigation needed
        return;
      }

      // ── Call action buttons ──────────────────────────────────────────────
      if (action.actionId === 'answer') {
        if (url && url.includes('/chat/')) {
          const path = normalizeInAppPath(url);
          if (path) safeNavigate(`${path}?incoming=1&autoAccept=1`, navigate);
          return;
        }
      } else if (action.actionId === 'decline') {
        const roomIdMatch = url?.match(/\/chat\/([^?]+)/);
        if (roomIdMatch && roomIdMatch[1]) {
          const roomId = roomIdMatch[1];
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('chat_messages').insert({
                room_id: roomId,
                sender_id: user.id,
                content: '__CALL_ENDED__: Call declined from notification',
                message_type: 'text'
              }).then(() => {
                supabaseRealtime.channel(`room-${roomId}`).send({
                  type: 'broadcast',
                  event: 'call-ended',
                  payload: { roomId }
                }).catch(() => { });
              });
            }
          });
          return;
        }
      }

      navigateFromPayload(action);
    });

    // ── Handle deep links from FCM data messages (cold-start tap) ──
    // FCM can launch the app with a URL via the data payload
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('[NativePush] appUrlOpen:', url);
      const path = normalizeInAppPath(url);
      if (path) safeNavigate(path, navigate);
    });

    // ── Handle Incoming Android Shares (WhatsApp, etc.) ──
    try {
      const { ShareTarget } = await import('@capgo/capacitor-share-target');
      ShareTarget.addListener('shareReceived', (data) => {
        console.log('[NativePush] shareReceived:', data);
        const text = data.text || data.url || data.title || '';
        if (text) {
          // Send them to the posts page and trigger the compose modal with the shared text
          safeNavigate(`/posts?share=${encodeURIComponent(text)}`, navigate);
        }
      });
    } catch (e) {
      console.log('ShareTarget not supported/installed', e);
    }

    // ── Check permissions and register ──
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'General',
        description: 'General notifications',
        importance: 4,
        visibility: 1,
        vibration: true,
      });
      await PushNotifications.createChannel({
        id: 'duels',
        name: '⚔️ Duels & Battles',
        description: 'Duel challenges, war declarations, and battle results',
        importance: 5,       // IMPORTANCE_HIGH — heads-up notification
        visibility: 1,       // VISIBILITY_PUBLIC — show on lock screen
        vibration: true,
        sound: 'battle',     // res/raw/battle.mp3 in the Android project
        lights: true,
        lightColor: '#f97316', // orange
      });
      await PushNotifications.createChannel({
        id: 'social',
        name: '👥 Social',
        description: 'Follows, comments, mentions, streaks, and chats',
        importance: 4,
        visibility: 1,
        vibration: true,
        sound: 'default',
        lights: true,
        lightColor: '#3b82f6', // blue
      });
      await PushNotifications.createChannel({
        id: 'academic',
        name: '📚 Academic',
        description: 'Answer reviews, new questions, and AI feedback',
        importance: 4,
        visibility: 1,
        vibration: true,
        sound: 'default',
        lights: true,
        lightColor: '#6366f1', // indigo
      });
      await PushNotifications.createChannel({
        id: 'alerts',
        name: '🏆 Rewards & Alerts',
        description: 'Points earned, weekly reports, and achievements',
        importance: 4,
        visibility: 1,
        vibration: true,
        sound: 'default',
        lights: true,
        lightColor: '#f59e0b', // amber
      });
      await PushNotifications.createChannel({
        id: 'calls',
        name: '📞 Calls',
        description: 'Incoming and missed voice calls',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'ringtone',
        lights: true,
        lightColor: '#6366f1',
      });
      await PushNotifications.registerActionTypes({
        types: [
          {
            id: 'incoming_call',
            actions: [
              { id: 'answer',  title: 'Answer',  foreground: true },
              { id: 'decline', title: 'Decline', foreground: false, destructive: true },
            ]
          },
          {
            // Duel challenge — Accept/Decline buttons on Android lock screen
            id: 'duel_challenge',
            actions: [
              { id: 'accept_duel',  title: '⚔️ Accept',  foreground: true },
              { id: 'decline_duel', title: '❌ Decline', foreground: false, destructive: true },
            ]
          }
        ]
      });
      await PushNotifications.register();
    }

    // Call Kit Permissions
    try {
      const { IncomingCallKit } = await import('@capgo/capacitor-incoming-call-kit');
      await IncomingCallKit.requestPermissions();
      await IncomingCallKit.requestFullScreenIntentPermission();
    } catch (e) {
      console.log('[CallKit] Setup skipped or failed:', e);
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
        await StatusBar.setOverlaysWebView({ overlay: true });
        // Inverse logic: Dark background needs LIGHT icons, Light background needs DARK icons
        await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' } as any);
        // On Android, we set background to transparent to allow the app background to show through the status bar
        await StatusBar.setBackgroundColor({ color: 'transparent' });
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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user && !user.user_metadata?.username) setNeedsOnboarding(true);

      if (user && Capacitor.isNativePlatform()) {
        initNativePush(user.id, (path) => router.push(path));
      }
      if (user) {
        ActivityTracker.restoreFromCloud();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        // Trigger weekly report check/generation max once a week to stop popup spam
        const lastCheck = localStorage.getItem('last_weekly_report_check');
        const now = Date.now();
        if (!lastCheck || now - parseInt(lastCheck) > 7 * 24 * 60 * 60 * 1000) {
          localStorage.setItem('last_weekly_report_check', now.toString());
          fetch('/api/report/generate-notification', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }).catch(() => { });
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user && !session.user.user_metadata?.username) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }

      if (session?.user && Capacitor.isNativePlatform()) {
        initNativePush(session.user.id, (path) => router.push(path));
      }
      if (session?.user) {
        ActivityTracker.restoreFromCloud();

        const meta = session.user.user_metadata || {};
        const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');

        // ── Block Google avatars at the source ──────────────────────────────────
        // On a fresh Google OAuth login, Supabase automatically writes the Google
        // profile photo into avatar_url. We nullify it in auth metadata immediately
        // so it is never seen by upsertProfile, profile/sync, or any other code.
        // This runs only once per login session (SIGNED_IN), not on every page load.
        if (event === 'SIGNED_IN' && isGoogleUrl(meta.avatar_url) && session.access_token) {
          supabase.auth.updateUser({
            data: { avatar_url: null, picture: null }
          }).catch(() => { /* non-fatal */ });
        }

        // ── Local cache: avatar_url only, never a Google URL ────────────
        const effectiveAvatar = meta.avatar_url && !isGoogleUrl(meta.avatar_url)
          ? meta.avatar_url
          : null; // Google-only users show initials on their own posts too — consistent UX
        const freshCache = { ...meta, avatar_url: effectiveAvatar };
        try { localStorage.setItem('dheeyudha_user_meta_cache', JSON.stringify(freshCache)); } catch { }
        window.dispatchEvent(new Event('user_metadata_updated'));

        // ── Sync DB on login AND on initial page load (INITIAL_SESSION) ──
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session.access_token) {
          // v3: key bumped — forces one sync with the Google-URL-block patch for all active sessions.
          const syncKey = 'profile_sync_last_v3';
          const lastSync = parseInt(sessionStorage.getItem(syncKey) || '0');
          const now = Date.now();
          if (now - lastSync > 60 * 60 * 1000) { // once per hour
            sessionStorage.setItem(syncKey, now.toString());
            fetch('/api/profile/sync', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` }
            }).catch(() => { });
          }
        }
      }
      if (session?.access_token) {
        const lastCheck = localStorage.getItem('last_weekly_report_check');
        const now = Date.now();
        if (!lastCheck || now - parseInt(lastCheck) > 7 * 24 * 60 * 60 * 1000) {
          localStorage.setItem('last_weekly_report_check', now.toString());
          fetch('/api/report/generate-notification', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }).catch(() => { });
        }
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
      if (!actualSrc.includes(realUrl)) return;

      // Public Supabase Storage URLs (/storage/v1/object/public/...) must NOT
      // be proxied — browser image requests carry no apikey/auth headers so
      // Supabase returns 400. These URLs are already publicly accessible and
      // do not need the ISP-bypass proxy.
      if (actualSrc.includes('/storage/v1/object/public/')) return;

      img.src = actualSrc.replace(realUrl, proxyUrl);
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

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/update-password';
  const isLandingPage = pathname === '/';
  const isTrailerPage = pathname === '/trailer';
  const isSearchPage = pathname === '/search';
  const isTestArena = pathname === '/tests';
  const isIndividualTest = pathname?.startsWith('/tests/') || pathname?.startsWith('/test/') || pathname?.startsWith('/arena/') || false;
  const isChatPage = pathname?.startsWith('/chat');
  const isStorePage = pathname?.startsWith('/store');

  const isSinglePostPage = pathname?.startsWith('/posts/') && pathname !== '/posts';
  const hideMainSidebar = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null) || isTrailerPage || isSearchPage || isIndividualTest || isChatPage || isSinglePostPage;
  const hideBottomNav = isAuthPage || isAuthenticated === false || (isLandingPage && isAuthenticated === null) || isTrailerPage || isIndividualTest || isChatPage || isStorePage || isSinglePostPage;

  if (needsOnboarding) {
    return <CompleteProfileOverlay onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <CallProvider>
      {!hideMainSidebar && <DesktopSidebar />}
      <div
        className={`${hideMainSidebar ? 'lg:pl-0' : 'lg:pl-64'} ${showBottomNav && !hideBottomNav ? 'pb-20' : ''}`}
        style={showBottomNav && !hideBottomNav ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' } : undefined}
      >
        {!hideMainSidebar && !isIndividualTest && !isChatPage && !isStorePage && <Header isMobile={isMobile} />}
        {children}
        {showBottomNav && !hideBottomNav && <BottomNav />}
      </div>
      {isAuthenticated && <PushNotificationPrompt />}
      {isAuthenticated && <CongratsBadgeModal />}
      {isAuthenticated && <GlobalChatListener />}
      <GlobalCallListener />
      <GlobalPrefetcher isAuthenticated={isAuthenticated} />
      {isAuthenticated && <StreakToast />}
      {isAuthenticated && <StreakLostOverlay />}
      {isAuthenticated && <AchievementUnlockOverlay />}
    </CallProvider>
  );
}