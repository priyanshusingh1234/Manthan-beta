import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import { Flame, X } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

type Notif = {
  id: string;
  title: string;
  body: string;
  actor_name: string | null;
  actor_avatar: string | null;
  href: string | null;
};

export default function StreakFriendToast() {
  const router = useRouter();
  const [notif, setNotif] = useState<Notif | null>(null);
  
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const channelName = `streak_toast_${session.user.id}_${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${session.user.id}` 
          }, 
          (payload) => {
            const newRow = payload.new;
            if (newRow.type === 'streak_friend' && mounted) {
              setNotif(newRow as any);
              translateY.value = withSpring(50, { damping: 12, stiffness: 100 });
              opacity.value = withTiming(1, { duration: 300 });

              // Auto dismiss after 4s
              setTimeout(() => {
                if (mounted) dismiss();
              }, 4000);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    init();

    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const dismiss = () => {
    translateY.value = withTiming(-150, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setNotif)(null);
    });
  };

  const handlePress = () => {
    if (notif?.href) {
      router.push(notif.href as any);
    }
    dismiss();
  };

  if (!notif) return null;

  return (
    <Animated.View 
      style={[{ position: 'absolute', top: 0, left: 16, right: 16, zIndex: 999, transform: [{ translateY }], opacity }]}
    >
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex-row items-center p-3"
      >
        <View className="w-12 h-12 rounded-xl bg-orange-500 items-center justify-center mr-3 relative overflow-hidden">
          {notif.actor_avatar ? (
            <Image source={{ uri: notif.actor_avatar }} className="w-full h-full" />
          ) : (
            <Flame size={24} color="white" fill="white" />
          )}
        </View>
        
        <View className="flex-1 mr-2">
          <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
            {notif.title}
          </Text>
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={2}>
            {notif.body}
          </Text>
        </View>

        <TouchableOpacity onPress={dismiss} className="p-2 -mr-2">
          <X size={16} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
