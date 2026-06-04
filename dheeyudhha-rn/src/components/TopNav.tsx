import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Platform, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Trophy, BookOpen, Swords, Zap, Search, PlaySquare, Compass, Shield, CheckSquare, HelpCircle, Mail, User, Lock } from 'lucide-react-native';
import NotificationBell from '@/components/ui/NotificationBell';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

const NAV_LINKS = [
  { label: 'Streak 🔥', href: '/streaks', icon: Flame },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Gauntlet 📖', href: '/gauntlet', icon: BookOpen },
  { label: 'Duels ⚔️', href: '/duels', icon: Swords },
  { label: 'Arena', href: '/(tabs)/arena', icon: Zap },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Clips', href: '/clips', icon: PlaySquare },
  { label: 'Feed', href: '/feed', icon: Compass },
  { label: 'Checker', href: '/(tabs)/checker-feed', icon: Shield },
  { label: 'Solved', href: '/solved', icon: CheckSquare },
  { label: 'Docs', href: '/docs', icon: HelpCircle },
  { label: 'Support', href: '/contact', icon: Mail },
  { label: 'Privacy', href: '/privacy', icon: Lock },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  
  // Safe area padding for the status bar
  const paddingTop = Platform.OS === 'android' ? Math.max(insets.top, 16) : insets.top;

  useEffect(() => {
    // Fetch user avatar for the profile button
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', session.user.id)
        .single();
      const url = profile?.avatar_url || session.user.user_metadata?.avatar_url;
      if (url && !url.includes('googleusercontent.com')) {
        setAvatarUrl(url);
      }
    };
    load();
  }, []);

  return (
    <View 
      className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-100 dark:border-slate-800 z-50 pb-3" 
      style={{ paddingTop }}
    >
      {/* Top Row: Title & Actions */}
      <View className="flex-row items-center justify-between px-4 mt-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dheeyudha</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <NotificationBell isMobile={true} />
          {/* Profile Avatar Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
            className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <User size={16} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Row: Sliding Horizontal Links */}
      <View className="mt-3">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4"
          contentContainerStyle={{ paddingRight: 32, alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {NAV_LINKS.map((nav) => {
            const normalizedHref = nav.href.replace('/(tabs)', '');
            const isActive = pathname === normalizedHref || pathname === nav.href || pathname.startsWith(`${normalizedHref}/`);
            
            // Replicate web colors
            let bgClass = 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800';
            let textClass = 'text-slate-600 dark:text-slate-300';
            let iconColor = colorScheme === 'dark' ? '#cbd5e1' : '#475569'; // slate-600 / slate-300

            if (isActive) {
              if (nav.href === '/streaks') {
                bgClass = 'bg-orange-500 border-orange-500 shadow-sm';
                textClass = 'text-white';
                iconColor = '#fff';
              } else {
                bgClass = 'bg-blue-600 border-blue-600 shadow-sm';
                textClass = 'text-white';
                iconColor = '#fff';
              }
            } else {
              if (nav.href === '/streaks') {
                bgClass = 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50';
                textClass = 'text-orange-600 dark:text-orange-400';
                iconColor = colorScheme === 'dark' ? '#fb923c' : '#f97316'; // orange-400 / orange-500
              }
            }

            return (
              <TouchableOpacity 
                key={nav.label}
                activeOpacity={0.7}
                onPress={() => router.push(nav.href as any)}
                className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 border ${bgClass}`}
              >
                <nav.icon size={14} color={iconColor} />
                <Text className={`ml-1.5 text-[11px] font-bold ${textClass}`}>
                  {nav.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

