import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Platform, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Trophy, BookOpen, Swords, Zap, Search, PlaySquare, Compass, Shield, CheckSquare, HelpCircle, Mail, User, Lock, PlusCircle, Skull } from 'lucide-react-native';
import NotificationBell from '@/components/ui/NotificationBell';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

const NAV_LINKS = [
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Streak 🔥', href: '/streaks', icon: Flame },
  { label: 'Checker', href: '/(tabs)/checker-feed', icon: CheckSquare },
  { label: 'BOSS 💀', href: '/(tabs)/boss', icon: Skull },
  { label: 'Gauntlet 📖', href: '/gauntlet', icon: BookOpen },
  { label: 'Duels ⚔️', href: '/duels', icon: Swords },
  { label: 'Arena', href: '/(tabs)/arena', icon: Zap },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Docs', href: '/docs', icon: HelpCircle },
  { label: 'Support', href: '/contact', icon: Mail },
  { label: 'Privacy', href: '/privacy', icon: Lock },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
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
        .select('avatar_url, is_teacher')
        .eq('id', session.user.id)
        .single();
      const url = profile?.avatar_url || session.user.user_metadata?.avatar_url;
      if (url && !url.includes('googleusercontent.com')) {
        setAvatarUrl(url);
      }
      setIsTeacher(profile?.is_teacher || session.user.user_metadata?.isTeacher || false);
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
          {isTeacher && (
            <TouchableOpacity
              onPress={() => router.push('/create-question' as any)}
              className="bg-indigo-100 dark:bg-indigo-950/40 p-1.5 rounded-full border border-indigo-200/50 dark:border-indigo-900/50 active:scale-95 shadow-sm"
            >
              <PlusCircle size={20} color="#4f46e5" />
            </TouchableOpacity>
          )}
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

      {/* Fixed Second Row: Search & Gauntlet */}
      <View className="flex-row items-center justify-between px-4 mt-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/search' as any)}
          className="flex-row items-center flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl mr-3"
        >
          <Search size={16} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
          <Text className="ml-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Search users, posts...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/gauntlet' as any)}
          className="flex-row items-center bg-indigo-600 px-4 py-2 rounded-xl shadow-sm"
        >
          <BookOpen size={16} color="#ffffff" />
          <Text className="ml-1.5 text-[13px] font-bold text-white">
            Gauntlet
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
