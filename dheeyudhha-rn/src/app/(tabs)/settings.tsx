import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Share2,
  Phone,
  Mail,
  MoreVertical,
  User,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  Info,
  UserX,
  Trash2,
  Lock,
  Globe,
  ArrowLeft,
  ChevronLeft,
  VolumeX,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  Zap,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenKey = 'main' | 'profile' | 'notifications' | 'child-safety' | 'privacy' | 'terms' | 'help' | 'delete-confirm' | 'security';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Color scheme
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('main');
  
  // App States
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Privacy States
  const [isPrivate, setIsPrivate] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  
  // Notification States
  const [muteAll, setMuteAll] = useState(false);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Delete Account States
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Security States
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
          const meta = user.user_metadata || {};
          setIsPrivate(!!meta.isPrivate);

          // Fetch from database
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('is_private')
            .eq('id', user.id)
            .single();

          if (dbProfile) {
            setIsPrivate(!!dbProfile.is_private);
          }
        }
      } catch (e) {
        console.error('Failed to load settings data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleTheme = async (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    setColorScheme(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleToggleClick = () => {
    const newValue = !isPrivate;
    setPendingToggle(newValue);
    setShowConfirmModal(true);
  };

  const confirmToggle = async () => {
    if (pendingToggle === null) return;
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update auth metadata
        await supabase.auth.updateUser({
          data: { isPrivate: pendingToggle }
        });

        // Update database profile
        await supabase
          .from('profiles')
          .update({ is_private: pendingToggle })
          .eq('id', user.id);

        setIsPrivate(pendingToggle);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update account privacy.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE exactly to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete profiles table entry
        await supabase.from('profiles').delete().eq('id', user.id);
        
        // Sign out on client
        await supabase.auth.signOut();
        
        Alert.alert(
          'Account Deleted',
          'Your account has been deleted. You can re-register anytime.',
          [{ text: 'OK', onPress: () => router.replace('/login' as any) }]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to request deletion. Please email support at kpk22128@gmail.com');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Success', 'Your password has been updated.');
      setNewPassword('');
      setCurrentScreen('main');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // ----------------------------------------------------
  // SUB-SCREEN RENDERS
  // ----------------------------------------------------

  // 1. Profile Privacy Settings Sub-screen
  if (currentScreen === 'profile') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-start flex-1 mr-4">
              <View className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl mr-4">
                {isPrivate ? <Lock size={22} color={isDarkMode ? '#818cf8' : '#4f46e5'} /> : <Globe size={22} color={isDarkMode ? '#818cf8' : '#4f46e5'} />}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Private Account</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Only approved scholars can see your posts and followers. Ranks and badges remain public.
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handleToggleClick}
              trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
              thumbColor={isPrivate ? '#4f46e5' : '#f4f4f5'}
            />
          </View>
        </ScrollView>

        {/* Custom Confirmation Screen Modal */}
        <Modal visible={showConfirmModal} transparent={false} animationType="slide">
          <View className="flex-1 bg-white dark:bg-slate-950 justify-center px-6 py-12">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-full items-center justify-center mb-6">
                {pendingToggle ? <Lock size={40} color={isDarkMode ? '#818cf8' : '#4f46e5'} /> : <Globe size={40} color={isDarkMode ? '#818cf8' : '#4f46e5'} />}
              </View>
              <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 text-center">
                {pendingToggle ? 'Switch to Private?' : 'Switch to Public?'}
              </Text>
            </View>

            <View className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-4 mb-8">
              <View className="flex-row gap-3">
                <Shield size={20} color={isDarkMode ? '#818cf8' : '#4f46e5'} className="mt-0.5" />
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {pendingToggle ? 'Follow Requests' : 'Anyone can follow'}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {pendingToggle
                      ? 'New followers must send a request and be approved by you.'
                      : 'Anyone will be able to follow you immediately.'}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <Lock size={20} color={isDarkMode ? '#818cf8' : '#4f46e5'} className="mt-0.5" />
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {pendingToggle ? 'Hidden Posts & Followers' : 'Public Profile'}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {pendingToggle
                      ? 'Only approved followers can see your posts and followers.'
                      : 'Anyone can see your posts and who follows you.'}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <Globe size={20} color={isDarkMode ? '#818cf8' : '#4f46e5'} className="mt-0.5" />
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Ranks & Badges remain public</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Your achievements, ranks, and solved questions are always visible.
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={confirmToggle}
                className="w-full bg-indigo-600 py-4 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/20 active:opacity-90"
              >
                <Text className="text-white font-bold text-base">Confirm Switch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center justify-center active:opacity-90"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 2. Notifications Settings Sub-screen
  if (currentScreen === 'notifications') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-3" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ChevronLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <View className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
            <Bell size={18} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
          </View>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4 gap-6">
          {/* Master Mute Toggle */}
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 mr-4">
              <View className={`p-3 rounded-2xl mr-4 ${muteAll ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <VolumeX size={22} color={muteAll ? '#ef4444' : (isDarkMode ? '#94a3b8' : '#64748b')} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Mute All Notifications</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Temporarily silence all alerts and emails.</Text>
              </View>
            </View>
            <Switch
              value={muteAll}
              onValueChange={setMuteAll}
              trackColor={{ false: '#cbd5e1', true: '#fca5a5' }}
              thumbColor={muteAll ? '#ef4444' : '#f4f4f5'}
            />
          </View>

          {/* Delivery Preferences (disabled/opacity if muteAll) */}
          <View className={muteAll ? 'opacity-40 pointer-events-none' : 'opacity-100'}>
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-3">Delivery Methods</Text>
            
            <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {/* In-App Alerts */}
              <View className="p-5 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl mr-3">
                    <Bell size={18} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-100">In-App Alerts</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">See alerts when you open the app.</Text>
                  </View>
                </View>
                <Switch
                  value={inAppAlerts}
                  disabled={muteAll}
                  onValueChange={setInAppAlerts}
                  trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
                  thumbColor={inAppAlerts ? '#4f46e5' : '#f4f4f5'}
                />
              </View>

              {/* Push Alerts */}
              <View className="p-5 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="p-2.5 bg-green-50 dark:bg-green-950/30 rounded-xl mr-3">
                    <Smartphone size={18} color="#22c55e" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Push Notifications</Text>
                      <Text className="text-[9px] font-black uppercase text-green-600 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 px-1 rounded-md">Real-time</Text>
                    </View>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Send instant alerts directly to your phone.</Text>
                  </View>
                </View>
                <Switch
                  value={pushAlerts}
                  disabled={muteAll}
                  onValueChange={setPushAlerts}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={pushAlerts ? '#22c55e' : '#f4f4f5'}
                />
              </View>

              {/* Email Digests */}
              <View className="p-5 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl mr-3">
                    <Mail size={18} color="#d97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Email Digests</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Receive summary emails of your activity.</Text>
                  </View>
                </View>
                <Switch
                  value={emailAlerts}
                  disabled={muteAll}
                  onValueChange={setEmailAlerts}
                  trackColor={{ false: '#cbd5e1', true: '#fcd34d' }}
                  thumbColor={emailAlerts ? '#d97706' : '#f4f4f5'}
                />
              </View>
            </View>
          </View>

          <View className="items-center mt-6">
            <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">
              🔇 Only critical account alerts will bypass mute.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 3. Child Safety Sub-screen
  if (currentScreen === 'child-safety') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Child Safety</Text>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium px-2 mb-4 leading-relaxed">
            We maintain an educational, respectful, and age-appropriate learning environment for all scholars.
          </Text>

          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm gap-4 mb-4">
            <View className="flex-row gap-3">
              <View className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl shrink-0">
                <Info size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Age Confirmation</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  All scholars confirm they are 14 years or older during registration.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl shrink-0">
                <User size={18} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Community Standards</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Respectful behavior is strictly enforced. Sharing sensitive personal contact details is prohibited.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl shrink-0">
                <FileText size={18} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Education First</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  All discussions, notes, and quiz battles are scoped strictly to academic subjects and verified teacher resources.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl shrink-0">
                <Lock size={18} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Privacy Protection</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  We gather only essential account telemetry and never monetize or trade user database files.
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">FAQ</Text>
            <View className="gap-3">
              <View>
                <Text className="font-bold text-xs text-slate-700 dark:text-slate-300">Minimum Age Requirement?</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scholars must be 14 years or older.</Text>
              </View>
              <View className="border-t border-slate-100 dark:border-slate-800 pt-2">
                <Text className="font-bold text-xs text-slate-700 dark:text-slate-300">How to report misconduct?</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Report posts or email our moderators directly.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 4. Privacy Policy Sub-screen
  if (currentScreen === 'privacy') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Privacy Policy</Text>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* TL;DR Summary */}
          <View className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-5 mb-4">
            <Text className="font-black text-indigo-800 dark:text-indigo-300 text-sm mb-3">⚡ Privacy Summary (TL;DR)</Text>
            <View className="gap-2">
              {[
                'We only collect data necessary to run the platform.',
                'We never sell your personal data to third parties.',
                'Passwords are hashed using secure encryption.',
                'You can delete your account and data at any time.',
                'Public profiles display names, bio, points, and ranks.'
              ].map((t, idx) => (
                <View key={idx} className="flex-row items-start gap-2">
                  <CheckCircle2 size={14} color="#6366f1" className="mt-0.5 shrink-0" />
                  <Text className="text-xs text-indigo-900 dark:text-indigo-400 leading-relaxed flex-1">{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Details */}
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm gap-4 mb-8">
            <View>
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">1. Account Data We Collect</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                We store your name, email, username, bio, school, and academic grade. Passwords are encrypted server-side.
              </Text>
            </View>
            <View className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">2. Use of Information</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Telemetry is used to manage matches, calculate leaderboard rankings, verify school/teacher logs, and prevent platform abuse.
              </Text>
            </View>
            <View className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">3. Infrastructure Partners</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Our authentication and database engines are securely managed by Supabase. Push alerts are routed anonymously via Google Firebase.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 5. Terms of Service Sub-screen
  if (currentScreen === 'terms') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Terms of Service</Text>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm gap-4 mb-8">
            <View>
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">1. Platform Scope</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Dheeyudhha provides educational resources and gamified quiz systems. Access is restricted to educational purposes only.
              </Text>
            </View>
            <View className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">2. Acceptable Conduct</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Users agree not to upload inappropriate, offensive, or copyrighted materials, and to respect fellow scholars.
              </Text>
            </View>
            <View className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">3. Account Ownership</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                You are responsible for keeping your login credentials secure. Shared accounts or multi-accounting on the leaderboard is subject to suspension.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 6. Help & Support Sub-screen
  if (currentScreen === 'help') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Help & Support</Text>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Mail size={18} color={isDarkMode ? '#818cf8' : '#6366f1'} />
              <Text className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Email Support</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:kpk22128@gmail.com')}>
              <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">kpk22128@gmail.com</Text>
            </TouchableOpacity>
            <Text className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">
              We respond to all scholar and educator queries within 2 business days.
            </Text>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2">Web Knowledge Base</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Access the complete guidelines, user documentation, and FAQs on our web console.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://dheeyudha.vercel.app/docs')}
              className="flex-row items-center gap-1.5"
            >
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Open Dheeyudha Docs</Text>
              <ChevronRight size={14} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 7. Delete Account Sub-screen
  if (currentScreen === 'delete-confirm') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Delete Account</Text>
        </View>

        <ScrollView className="flex-1 p-5" contentContainerStyle={{ justifyContent: 'center' }}>
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full items-center justify-center mb-4">
              <AlertTriangle size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-black text-slate-800 dark:text-slate-100 text-center">Warning: Permanent Deletion</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed max-w-[280px]">
              This action is irreversible. All of your points, badge collections, XP, and posts will be deleted.
            </Text>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Type the word <Text className="font-extrabold text-red-500">DELETE</Text> below to confirm:
            </Text>
            <TextInput
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
              placeholder="DELETE"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold text-base"
            />
          </View>

          {deleteLoading ? (
            <ActivityIndicator color="#ef4444" size="large" />
          ) : (
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE'}
                className={`w-full py-4 rounded-2xl items-center justify-center ${deleteInput === 'DELETE' ? 'bg-red-600' : 'bg-slate-200'}`}
              >
                <Text className={`font-bold text-base ${deleteInput === 'DELETE' ? 'text-white' : 'text-slate-400'}`}>
                  Permanently Delete My Account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurrentScreen('main')}
                className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center justify-center"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">Keep My Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // 8. Security Sub-screen
  if (currentScreen === 'security') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800">
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Password & Security</Text>
        </View>

        <ScrollView className="flex-1 p-5">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              Set or Change Password
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              If you haven't set a password yet, you can create one now. Otherwise, enter a new password to change your existing one.
            </Text>
            
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New Password (min 6 chars)"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold text-base mb-4"
            />

            <TouchableOpacity
              onPress={handleUpdatePassword}
              disabled={passwordLoading || newPassword.length < 6}
              className={`w-full py-4 rounded-2xl items-center justify-center ${newPassword.length >= 6 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className={`font-bold text-base ${newPassword.length >= 6 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // MAIN SETTINGS RENDER
  // ----------------------------------------------------
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 shadow-sm flex-row items-center gap-3" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <SettingsIcon size={22} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
        </View>
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        {userEmail && (
          <View className="mx-4 mt-5 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl flex-row items-center gap-4">
            <View className="w-12 h-12 bg-indigo-200 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-lg">
              <Text className="text-indigo-700 dark:text-indigo-300 font-black text-lg">{userEmail.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Signed in as</Text>
              <Text className="text-slate-800 dark:text-slate-200 font-black text-[15px] truncate">{userEmail}</Text>
            </View>
          </View>
        )}

        {/* Account Group */}
        <View className="px-4 mt-6 gap-2">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Account</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {/* Profile Settings */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('profile')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <User size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Profile Settings</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Manage your profile privacy and details</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Security Settings */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('security')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Lock size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Password & Security</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Change or set your password</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('notifications')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Bell size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Notifications</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Manage notification preferences</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Appearance */}
            <View className="flex-row items-center px-4 py-4 justify-between">
              <View className="flex-row items-center">
                <View className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl mr-4">
                  {isDarkMode ? <Sun size={18} color="#818cf8" /> : <Moon size={18} color="#4f46e5" />}
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Dark mode and theme settings</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
                thumbColor={isDarkMode ? '#4f46e5' : '#f4f4f5'}
              />
            </View>
          </View>
        </View>

        {/* Tools & Modes Group */}
        <View className="px-4 mt-6 gap-2">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Tools & Modes</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {/* Checker */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/checker-feed' as any)}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <CheckSquare size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Checker Feed</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Review submissions</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Arena */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/arena' as any)}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Zap size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Arena</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Competitive matches</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & About Group */}
        <View className="px-4 mt-6 gap-2">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Support & About</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {/* Help & Support */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('help')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <HelpCircle size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Help & Support</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Get help with Dheeyudhha</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Documentation */}
            <TouchableOpacity
              onPress={() => Linking.openURL('https://dheeyudha.vercel.app/docs')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <FileText size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Documentation</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Read the user guides</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Child Safety */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('child-safety')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Shield size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Child Safety</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Learn how we protect minors</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('privacy')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Shield size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Privacy Policy</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">How we protect your data</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Terms of Service */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('terms')}
              className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 justify-between"
            >
              <View className="flex-row items-center">
                <View className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                  <Info size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-[14px]">Terms of Service</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Rules and agreements</Text>
                </View>
              </View>
              <ChevronRight size={18} color={isDarkMode ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Group */}
        <View className="px-4 mt-6 gap-3">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-950 rounded-3xl p-4 flex-row items-center justify-between active:bg-red-50 dark:active:bg-red-950/20"
          >
            <View className="flex-row items-center">
              <View className="p-2.5 bg-red-100 dark:bg-red-950 rounded-xl mr-4">
                <LogOut size={18} color="#ef4444" />
              </View>
              <Text className="font-bold text-[14px] text-red-600 dark:text-red-400">Sign Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentScreen('delete-confirm')}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex-row items-center justify-between active:bg-red-50 dark:active:bg-red-950/20 group"
          >
            <View className="flex-row items-center">
              <View className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl mr-4">
                <UserX size={18} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              </View>
              <Text className="font-bold text-[14px] text-slate-500 dark:text-slate-400 group-active:text-red-600 dark:group-active:text-red-400">Delete Account</Text>
            </View>
            <Trash2 size={16} color={isDarkMode ? '#64748b' : '#94a3b8'} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View className="items-center mt-8">
          <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-wider">
            DHEEYUDHHA v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
