import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Lock, Database, Share2, Eye, UserX, Bell, Mail, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

function SectionHeading({ icon: Icon, title, isDark }: { icon: any, title: string, isDark: boolean }) {
  return (
    <View className="flex-row items-center gap-3 mb-4 mt-6">
      <View className="w-10 h-10 rounded-2xl bg-indigo-500 items-center justify-center shadow-sm">
        <Icon size={20} color="#fff" />
      </View>
      <Text className="text-xl font-black text-slate-900 dark:text-slate-100">{title}</Text>
    </View>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 mb-4 shadow-sm">
      {children}
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? 'text-slate-300' : 'text-slate-600';
  const headingColor = isDark ? 'text-slate-100' : 'text-slate-800';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
          <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2 text-slate-900 dark:text-white">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* TL;DR */}
        <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6 mb-6">
          <Text className="font-black text-indigo-800 dark:text-indigo-400 text-lg mb-4">TL;DR — The Short Version</Text>
          {[
            'We only collect data necessary to run the platform.',
            'We never sell your personal data to third parties.',
            'Passwords are hashed — we never see them.',
            'You can delete your account and data at any time.',
            'We use Supabase (EU-compliant) for auth & storage.',
          ].map((item, i) => (
            <View key={i} className="flex-row items-start gap-2 mb-2">
              <CheckCircle2 size={16} color="#818cf8" style={{ marginTop: 2 }} />
              <Text className="text-indigo-700 dark:text-indigo-300 flex-1">{item}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        <SectionHeading icon={Shield} title="Overview" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            Dheeyudha ("we", "our", or "us") is an educational quiz platform that connects students and verified teachers for academic learning and competitive quizzes. This Privacy Policy explains how we collect, use, store, and protect information in connection with your use of Dheeyudha.
          </Text>
        </InfoCard>

        <SectionHeading icon={Database} title="Data We Collect" isDark={isDark} />
        <InfoCard>
          <Text className={`font-bold ${headingColor} mb-2`}>Account Information</Text>
          <Text className={`${textColor} leading-6 mb-4`}>When you register, we collect: Full name, email address, secure password hash, username, and user role.</Text>
          
          <Text className={`font-bold ${headingColor} mb-2`}>Profile Information</Text>
          <Text className={`${textColor} leading-6 mb-4`}>You may optionally add school name, bio, avatar, and banner. Profile information is publicly visible.</Text>
          
          <Text className={`font-bold ${headingColor} mb-2`}>Usage & Technical Data</Text>
          <Text className={`${textColor} leading-6`}>We log quiz outcomes, points, follow relationships, browser/device info, and session tokens.</Text>
        </InfoCard>

        <SectionHeading icon={Eye} title="How We Use Your Data" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            We use your data strictly for authentication, displaying public profiles, running the global leaderboard, facilitating quiz battles, managing followers, and enforcing platform safety rules. We do not sell data to advertisers.
          </Text>
        </InfoCard>

        <SectionHeading icon={Share2} title="Third-Party Services" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            We use Supabase for core infrastructure (auth & database), Vercel for web hosting, and Google Firebase for real-time notifications. These services process your data securely in accordance with their privacy policies.
          </Text>
        </InfoCard>

        <SectionHeading icon={Lock} title="Data Security" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            We employ hashed passwords, Row-Level Security (RLS) in Supabase to restrict data access, JWT tokens, secure file storage, and HTTPS across all platform communications.
          </Text>
        </InfoCard>

        <SectionHeading icon={UserX} title="Your Rights & Choices" isDark={isDark} />
        <InfoCard>
          <Text className={`font-bold ${headingColor} mb-2`}>Account Deletion</Text>
          <Text className={`${textColor} leading-6 mb-4`}>
            You can request account deletion at any time through the app settings or by contacting us. Some anonymized data (like quiz outcomes) may be retained for platform integrity.
          </Text>
          <Text className={`font-bold ${headingColor} mb-2`}>Data Correction</Text>
          <Text className={`${textColor} leading-6`}>
            You can view and edit most of your personal information (name, username, bio, avatars) directly on your profile.
          </Text>
        </InfoCard>

        <SectionHeading icon={Mail} title="Contact Us" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6 mb-2`}>
            If you have questions regarding this Privacy Policy, please reach out via email:
          </Text>
          <Text className="font-bold text-indigo-500">kpk22128@gmail.com</Text>
        </InfoCard>

      </ScrollView>
    </View>
  );
}
