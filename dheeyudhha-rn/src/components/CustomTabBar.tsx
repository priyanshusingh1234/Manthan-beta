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
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

const TAB_HEIGHT = 62;
const CENTER_RISE = 24; // px the center button floats above the nav bar

const TAB_CONFIG = [
  { name: 'index',       icon: Home,          label: 'Home' },
  { name: 'posts',       icon: MessageSquare, label: 'Community' },
  { name: 'clips',       icon: Play,          label: 'Clips', isCenter: true },
  { name: 'chat',        icon: MessageCircle, label: 'Chat' },
  { name: 'settings',    icon: Settings,      label: 'Settings' },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom || (Platform.OS === 'ios' ? 16 : 8);
  const [streakCount, setStreakCount] = useState(0);
  const [goalMet, setGoalMet] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const { data } = await supabase
        .from('profiles')
        .select('streak_count, daily_solve_count, daily_solve_date')
        .eq('id', session.user.id)
        .single();
      if (!data || cancelled) return;
      const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStreakCount(Number(data.streak_count) || 0);
      setGoalMet(data.daily_solve_date === today && (Number(data.daily_solve_count) || 0) >= 2);
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

  const glassBgColor = isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.94)';
  const borderTopColor = isDark ? '#1e293b' : '#e2e8f0';
  const activePillBg = isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff';
  const activePillBorder = isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.15)';
  const centerBtnBorder = isDark ? '#0f172a' : '#f8fafc';
  const tabLabelColor = isDark ? '#cbd5e1' : '#94a3b8';

  const activeRouteName = state.routes[state.index]?.name;

  // Hide tab bar on Clips screen for full immersion
  if (activeRouteName === 'clips') return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outerWrapper, { paddingBottom: bottomPad }]}
    >
      <View style={[styles.glassBackground, { backgroundColor: glassBgColor }]} />
      <View style={[styles.borderTop, { backgroundColor: borderTopColor }]} />

      <View style={[styles.row, { height: TAB_HEIGHT }]} pointerEvents="box-none">
        {TAB_CONFIG.map((tab) => {
          const routeIdx = state.routes.findIndex(r => r.name === tab.name);
          const isActive = state.index === routeIdx;
          const Icon = tab.icon;
          const isHome = tab.name === 'index';

          if (tab.isCenter) {
            return (
              <View key={tab.name} style={styles.centerSlot} pointerEvents="box-none">
                <TouchableOpacity
                  onPress={() => navigateTo(tab.name)}
                  activeOpacity={0.82}
                  style={[
                    styles.centerBtn,
                    { marginTop: -CENTER_RISE, borderColor: centerBtnBorder },
                    isActive && styles.centerBtnActive,
                  ]}
                >
                  <View style={styles.centerBtnInner}>
                    <Icon size={26} color="white" strokeWidth={2.2} />
                  </View>
                  <View style={styles.centerRing} />
                </TouchableOpacity>

                <Text style={[styles.centerLabel, isActive && styles.centerLabelActive, !isActive && { color: isDark ? '#a855f7' : '#9333ea', opacity: isDark ? 0.8 : 0.65 }]}>
                  {tab.label}
                </Text>
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
              {isHome && streakCount > 0 && (
                <TouchableOpacity onPress={() => router.push('/streaks' as any)} style={[styles.streakBadge, goalMet ? styles.streakOn : styles.streakOff]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Flame size={8} color={goalMet ? 'white' : (isDark ? '#cbd5e1' : '#94a3b8')} fill={goalMet ? 'white' : 'none'} />
                  <Text style={[styles.streakNum, goalMet ? styles.streakNumOn : styles.streakNumOff, !goalMet && { color: isDark ? '#cbd5e1' : '#94a3b8' }]}>
                    {streakCount}
                  </Text>
                </TouchableOpacity>
              )}

              {isActive && <View style={[styles.activePill, { backgroundColor: activePillBg, borderColor: activePillBorder }]} />}

              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <Icon
                  size={isActive ? 23 : 21}
                  color={isActive ? '#2563eb' : (isDark ? '#cbd5e1' : '#94a3b8')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              <Text style={[styles.label, isActive ? styles.labelOn : [styles.labelOff, { color: tabLabelColor }]]}>
                {tab.label}
              </Text>

              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_HEIGHT,
    position: 'relative',
  },
  iconBox: {
    padding: 5,
    borderRadius: 12,
  },
  iconBoxActive: {
    transform: [{ translateY: -3 }],
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
  },
  labelOn: {
    color: '#2563eb',
    fontWeight: '700',
  },
  labelOff: {
    fontWeight: '500',
    opacity: 0.75,
  },
  activePill: {
    position: 'absolute',
    top: 8,
    width: 42,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  streakBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
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
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  centerBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    shadowColor: '#a855f7',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    overflow: 'hidden',
  },
  centerBtnActive: {
    shadowOpacity: 0.7,
    shadowRadius: 20,
    transform: [{ scale: 1.06 }],
  },
  centerBtnInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  centerLabelActive: {
    fontWeight: '800',
    opacity: 1,
  },
});
