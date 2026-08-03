// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageSquare, Trophy, MessageCircle, Settings, Flame, Play } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import StreakCompletedOverlay from './StreakCompletedOverlay';
import LeaderboardToastOverlay from './LeaderboardToastOverlay';
import { useRouter, usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useScrollContext } from '@/context/ScrollContext';

const TAB_HEIGHT = 62;
const CENTER_RISE = 20;

const TAB_CONFIG = [
  { name: 'index',       icon: Home,          label: 'Home' },
  { name: 'posts',       icon: MessageSquare, label: 'Community' },
  { name: 'leaderboard', icon: Trophy,        label: 'Leaderboard', isCenter: true },
  { name: 'chat',        icon: MessageCircle, label: 'Chat' },
  { name: 'settings',    icon: Settings,      label: 'Settings' },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom || (Platform.OS === 'ios' ? 16 : 8);
  const [streakCount, setStreakCount] = useState(0);
  const [goalMet, setGoalMet] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  
  const isScrollableScreen = pathname === '/' || pathname === '/posts';
  
  const { footerTranslation } = useScrollContext();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: isScrollableScreen ? footerTranslation.value : 0 }],
    };
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      
      // Load Streak
      const { data } = await supabase
        .from('profiles')
        .select('streak_count, daily_solve_count, daily_solve_date')
        .eq('id', session.user.id)
        .single();
      
      if (data && !cancelled) {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        setStreakCount(Number(data.streak_count) || 0);
        setGoalMet(data.daily_solve_date === today && (Number(data.daily_solve_count) || 0) >= 2);
      }

      // Load Unread Chats
      const fetchUnreadChats = async () => {
        const { data: rooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', session.user.id);

        if (rooms && rooms.length > 0) {
          const roomIds = rooms.map(r => r.room_id);
          const { data: allMessages } = await supabase
            .from('chat_messages')
            .select('room_id, is_read, sender_id')
            .in('room_id', roomIds)
            .order('created_at', { ascending: false });
          
          if (!cancelled && allMessages) {
            const lastMsgMap = new Map();
            allMessages.forEach(m => {
              if (!lastMsgMap.has(m.room_id)) lastMsgMap.set(m.room_id, m);
            });
            let unreadCount = 0;
            lastMsgMap.forEach(m => {
              if (!m.is_read && m.sender_id !== session.user.id) {
                unreadCount++;
              }
            });
            setUnreadChats(unreadCount);
          }
        }
      };

      fetchUnreadChats();

      // Realtime listener for chat messages
      const chatSub = supabase
        .channel('tabbar-chats')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
          fetchUnreadChats();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, () => {
          fetchUnreadChats();
        })
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(chatSub);
      }
    };
    
    load();

    const sub = DeviceEventEmitter.addListener('streak_earned', (event) => {
      setStreakCount(event.streak);
      setGoalMet(true);
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const navigateTo = (name: string) => {
    if (name === 'clips') {
      router.push('/clips' as any);
      return;
    }
    const routeIdx = state.routes.findIndex(r => r.name === name);
    if (routeIdx === -1) return;
    const event = navigation.emit({ type: 'tabPress', target: state.routes[routeIdx].key, canPreventDefault: true });
    if (state.index !== routeIdx && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const glassBgColor = isDark ? 'rgba(9,9,11,0.96)' : 'rgba(255,255,255,0.96)';
  const borderTopColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  
  const activeColor = isDark ? '#ffffff' : '#000000';
  const inactiveColor = isDark ? '#8e8e93' : '#999999';

  const centerBtnBg = isDark ? '#1C1C1E' : '#000000';
  const centerBtnBorder = isDark ? '#09090b' : '#ffffff';

  const activeRouteName = state.routes[state.index]?.name;

  // Hide tab bar on Clips screen for full immersion
  if (activeRouteName === 'clips') return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper, 
        { paddingBottom: bottomPad },
        isScrollableScreen ? { position: 'absolute', bottom: 0, left: 0, right: 0 } : {},
        animatedStyle
      ]}
    >
      <View style={[styles.glassBackground, { backgroundColor: glassBgColor }]} />
      <View style={[styles.borderTop, { backgroundColor: borderTopColor }]} />

      <View style={[styles.row, { height: TAB_HEIGHT }]} pointerEvents="box-none">
        {TAB_CONFIG.map((tab) => {
          const routeIdx = state.routes.findIndex(r => r.name === tab.name);
          const isActive = state.index === routeIdx;
          const Icon = tab.icon;
          const isHome = tab.name === 'index';
          const isChat = tab.name === 'chat';

          if (tab.isCenter) {
            return (
              <View key={tab.name} style={styles.centerSlot} pointerEvents="box-none">
                <TouchableOpacity
                  onPress={() => navigateTo(tab.name)}
                  activeOpacity={0.82}
                  style={[
                    styles.centerBtn,
                    { marginTop: -CENTER_RISE, borderColor: centerBtnBorder, backgroundColor: centerBtnBg },
                    isActive && styles.centerBtnActive,
                  ]}
                >
                  <View style={styles.centerBtnInner}>
                    <Icon size={24} color="#ffffff" strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigateTo(tab.name)}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <View style={styles.iconContainer}>
                {isHome && streakCount > 0 && (
                  <TouchableOpacity onPress={() => router.push('/streaks' as any)} style={[styles.streakBadge, goalMet ? styles.streakOn : styles.streakOff]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Flame size={8} color={goalMet ? 'white' : (isDark ? '#cbd5e1' : '#94a3b8')} fill={goalMet ? 'white' : 'none'} />
                    <Text style={[styles.streakNum, goalMet ? styles.streakNumOn : styles.streakNumOff, !goalMet && { color: isDark ? '#cbd5e1' : '#94a3b8' }]}>
                      {streakCount}
                    </Text>
                  </TouchableOpacity>
                )}

                {isChat && unreadChats > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unreadChats > 99 ? '99+' : unreadChats}</Text>
                  </View>
                )}

                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <Icon
                    size={24}
                    color={isActive ? activeColor : inactiveColor}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: isActive ? activeColor : inactiveColor }, isActive && styles.labelOn]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <StreakCompletedOverlay />
        <LeaderboardToastOverlay />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
  },
  glassBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT + 60,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
    paddingBottom: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_HEIGHT,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  iconBox: {
    padding: 2,
    marginBottom: 4,
  },
  iconBoxActive: {
    transform: [{ scale: 1.05 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  labelOn: {
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unreadText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  streakBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 20,
    zIndex: 10,
    gap: 2,
  },
  streakOn:  { backgroundColor: '#f97316' },
  streakOff: { backgroundColor: '#f1f5f9' },
  streakNum: { fontSize: 9, fontWeight: '800' },
  streakNumOn:  { color: 'white' },
  streakNumOff: { },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    overflow: 'visible',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centerBtnActive: {
    transform: [{ scale: 0.95 }],
  },
  centerBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
