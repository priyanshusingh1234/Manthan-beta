import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
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

// Prevent splash screen from hiding while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
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

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, error]);

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

    // Handle notification TAPS (user tapped notification from tray)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      const href: string = data?.href || data?.url || data?.link || data?.deep_link || '';
      
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
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!initialized) return;

    // Define routes that do not require authentication
    const unprotectedRoutes = ['login', 'signup', 'index'];
    const isUnprotected = unprotectedRoutes.includes(segments[0] as string);

    if (session && isUnprotected && segments[0] !== 'index') {
      // User is logged in but on login/signup page, redirect them to home
      router.replace('/(tabs)');
    } else if (!session && !isUnprotected) {
      // User is not logged in but trying to access protected routes, redirect to login
      router.replace('/login');
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
    </>
  );
}
