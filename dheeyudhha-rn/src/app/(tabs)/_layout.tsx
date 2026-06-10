import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Logo from '@/components/ui/Logo';
import NotificationBell from '@/components/ui/NotificationBell';
import CustomTabBar from '@/components/CustomTabBar';

import TopNav from '@/components/TopNav';
import DailyEggDrop from '@/components/DailyEggDrop';

export default function TabsLayout() {
  return (
    <>
      <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <TopNav />,
        sceneStyle: { paddingBottom: 85 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="posts"    options={{ title: 'Community' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'League' }} />
      <Tabs.Screen name="chat"     options={{ title: 'Chat' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hidden tabs so they retain the layout's header and bottom nav */}
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />
      <Tabs.Screen name="arena" options={{ href: null, title: 'Arena' }} />
      <Tabs.Screen name="checker-feed" options={{ href: null, title: 'Checker Feed' }} />
    </Tabs>
      <DailyEggDrop />
    </>
  );
}
