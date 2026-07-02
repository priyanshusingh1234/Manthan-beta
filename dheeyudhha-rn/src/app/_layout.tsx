import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '@/lib/pushUtils';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import StreakCompletedOverlay from '@/components/StreakCompletedOverlay';
import LevelUpModal from '@/components/LevelUpModal';
import LeagueUpModal from '@/components/LeagueUpModal';
import StreakLostOverlay from '@/components/StreakLostOverlay';
import StreakFriendToast from '@/components/StreakFriendToast';
import CoopDuelToast from '@/components/CoopDuelToast';
import LoginBonusModal from '@/components/LoginBonusModal';
import LeagueDropModal from '@/components/LeagueDropModal';

// Prevent splash screen from hiding while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

Sentry.init({
  dsn: 'https://346970e695a67d691e625f0c43b7a077@o4511544803393536.ingest.us.sentry.io/4511544829673472',
  debug: __DEV__, // Will print useful logs in dev, quiet in prod
});

function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const [processedNotificationId, setProcessedNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if ((fontsLoaded || error) && initialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, error, initialized]);

  useEffect(() => {
    // Load theme from AsyncStorage on startup
    AsyncStorage.getItem('app_theme').then((theme) => {
      if (theme === 'dark' || theme === 'light') {
        setColorScheme(theme);
      }
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register push notifications once user is signed in
  useEffect(() => {
    if (!session?.user || Platform.OS === 'web') return;

    // Register FCM token with Supabase
    registerForPushNotificationsAsync().catch(console.error);

    // Handle notifications received while app is OPEN (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Received in foreground:', notification.request.content.title);
    });

    const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      const href: string = data?.href || data?.url || data?.link || data?.deep_link || '';
      const actionId = response.actionIdentifier;
      
      // Extract challenge ID if it's a duel notification
      let challengeId = null;
      if (href.includes('challenge=')) {
        challengeId = href.split('challenge=')[1]?.split('&')[0];
      }

      // Handle custom action buttons (Accept / Decline)
      if (actionId === 'accept_duel' || actionId === 'decline_duel') {
        if (challengeId && session?.access_token) {
          const action = actionId === 'accept_duel' ? 'accept' : 'reject';
          try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            await fetch(`${API_URL}/api/coop/${challengeId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ action }),
            });
          } catch (e) {
            console.error('[Push] Failed to process action button API call', e);
          }
        }
        
        // If they declined, don't bother routing them to the question
        if (actionId === 'decline_duel') return;
      }

      // Handle inline chat reply
      if (actionId === 'reply' && response.userText) {
        const roomId = data?.roomId;
        if (roomId && session?.user?.id) {
          try {
            const content = response.userText.trim();
            // Insert directly into Supabase (optimistic)
            await supabase.from('chat_messages').insert({
              room_id: roomId,
              sender_id: session.user.id,
              content,
              message_type: 'text'
            });

            // Also hit the notify API if you want the other person to be notified
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
            await fetch(`${API_URL}/api/chat/notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                receiverId: data?.callerId || '', // The original sender of the push is callerId
                senderId: session.user.id,
                roomId,
                content: content.substring(0, 50)
              })
            }).catch(() => null);

          } catch (e) {
            console.error('[Push] Failed to send inline reply', e);
          }
        }
        // Don't route if it was a background reply
        if (!response.notification.request.content.data?.opensAppToForeground) {
          return;
        }
      }

      if (!href) return;

      // Translate web hrefs to mobile routes
      let targetRoute = href;
      if (href.startsWith('/questions/')) {
        targetRoute = href.replace('/questions/', '/solve/');
      } else if (href.startsWith('/posts/')) {
        targetRoute = href; // same on mobile
      } else if (href.startsWith('/duel/')) {
        targetRoute = href.replace('/duel/', '/arena/');
      } else if (href.startsWith('/chat/')) {
        targetRoute = href; // chat route
      }

      try {
        router.push(targetRoute as any);
      } catch (e) {
        console.warn('[Push] Could not navigate to:', targetRoute);
      }
    };

    // Handle notification TAPS (user tapped notification from tray while app running)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Handle cold-start taps (from lockscreen or killed state)
    if (
      lastNotificationResponse && 
      lastNotificationResponse.notification.request.identifier !== processedNotificationId
    ) {
      setProcessedNotificationId(lastNotificationResponse.notification.request.identifier);
      handleNotificationResponse(lastNotificationResponse);
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session?.user?.id, lastNotificationResponse]);

  useEffect(() => {
    if ((fontsLoaded || error) && initialized) {
      // Add a tiny delay to allow router.replace to finish its transition
      // before we drop the splash screen, preventing any flash of the wrong route.
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }
  }, [fontsLoaded, error, initialized]);

  useEffect(() => {
    if (!initialized) return;

    // Define routes that do not require authentication
    const unprotectedRoutes = ['login', 'signup', 'index'];
    const currentSegment = segments[0] || 'index';
    const isUnprotected = unprotectedRoutes.includes(currentSegment);

    if (session && isUnprotected) {
      // User is logged in but on an unprotected page (login, signup, or landing page), redirect to home
      router.replace('/(tabs)');
    } else if (!session && !isUnprotected) {
      // User is not logged in but trying to access protected routes, redirect to landing page
      router.replace('/');
    }
  }, [session, initialized, segments]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="coop/[id]" />
        <Stack.Screen 
          name="posts/[id]" 
          options={{ 
            headerShown: true, 
            title: 'Post', 
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' },
            headerTintColor: colorScheme === 'dark' ? '#cbd5e1' : '#0f172a'
          }} 
        />
        <Stack.Screen 
          name="arena/[slug]" 
          options={{ headerShown: false }} 
        />
      </Stack>
      <StreakCompletedOverlay />
      <StreakLostOverlay />
      <StreakFriendToast />
      <CoopDuelToast />
      <LevelUpModal />
      <LeagueUpModal />
      <LeagueDropModal />
      <LoginBonusModal />
    </>
  );
}

export default Sentry.wrap(RootLayout);
