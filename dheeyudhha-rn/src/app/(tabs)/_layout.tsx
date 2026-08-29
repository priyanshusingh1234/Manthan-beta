import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Logo from '@/components/ui/Logo';
import NotificationBell from '@/components/ui/NotificationBell';
import CustomTabBar from '@/components/CustomTabBar';
import { ScrollProvider } from '@/context/ScrollContext';

import TopNav from '@/components/TopNav';
import DailyEggDrop from '@/components/DailyEggDrop';
import CompleteProfileModal from '@/components/CompleteProfileModal';

export default function TabsLayout() {
  return (
    <ScrollProvider>
      <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <TopNav />,
        sceneStyle: { paddingBottom: 85 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home', sceneStyle: { paddingBottom: 0 } }} />
      <Tabs.Screen name="posts"    options={{ title: 'Community', sceneStyle: { paddingBottom: 0 } }} />
      <Tabs.Screen name="clips"       options={{ title: 'Clips', headerShown: false, sceneStyle: { paddingBottom: 0 } }} />
      <Tabs.Screen name="chat"     options={{ title: 'Chat' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hidden tabs so they retain the layout's header and bottom nav */}
      <Tabs.Screen name="leaderboard" options={{ href: null, title: 'Leaderboard' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />
      <Tabs.Screen name="arena" options={{ href: null, title: 'Arena' }} />

    </Tabs>
      <DailyEggDrop />
      <CompleteProfileModal />
    </ScrollProvider>
  );
}
