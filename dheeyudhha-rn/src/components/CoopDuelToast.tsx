import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react-native';
import CoopNotifCard from './CoopNotifCard';

const { width } = Dimensions.get('window');

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  created_at: string;
}

export default function CoopDuelToast() {
  const [activeNotif, setActiveNotif] = useState<NotificationPayload | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const translateY = useSharedValue(-150);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('coop-duel-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationPayload;
          if (newNotif.type === 'coop_challenge' || newNotif.type === 'duel_challenge') {
            showToast(newNotif);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentUserId]);

  const showToast = (notif: NotificationPayload) => {
    setActiveNotif(notif);
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Stay on screen longer so they can accept/reject
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, 15000); // 15 seconds
  };

  const hideToast = () => {
    translateY.value = withTiming(-250, { duration: 400 }, (isFinished) => {
      if (isFinished) {
        runOnJS(setActiveNotif)(null);
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!activeNotif) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.toastContainer, animatedStyle]}>
        <View className="shadow-lg shadow-black/20 w-full relative pt-4">
          <TouchableOpacity 
            onPress={hideToast}
            className="absolute top-0 right-2 z-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
            style={{ marginTop: 2, marginRight: 2 }}
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
          
          <CoopNotifCard 
            notif={activeNotif} 
            compact={true} 
            onNavigate={hideToast} 
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below status bar
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    width: width - 32,
    maxWidth: 400,
  }
});
