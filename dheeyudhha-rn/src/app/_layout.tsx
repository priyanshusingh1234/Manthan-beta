import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

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

  useEffect(() => {
    if (!initialized) return;

    // Define routes that do not require authentication
    const unprotectedRoutes = ['login', 'signup', 'index'];
    const isUnprotected = unprotectedRoutes.includes(segments[0] as string);
    const inTabsGroup = segments[0] === '(tabs)';

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

