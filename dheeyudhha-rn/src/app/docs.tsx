import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, LogIn, User, GraduationCap, Users, Trophy, Sword, Zap, Award, BookOpen } from 'lucide-react-native';
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

export default function DocsScreen() {
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
        <Text className="text-lg font-bold ml-2 text-slate-900 dark:text-white">Documentation</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 60 }}>

        <SectionHeading icon={Sparkles} title="Overview" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            Dheeyudha is a real-time competitive quiz platform designed for students and teachers. It blends social features (profiles, follows, leaderboards) with academic content (teacher-posted questions, subject-based quizzes) to make learning engaging and competitive.
          </Text>
        </InfoCard>

        <SectionHeading icon={LogIn} title="Getting Started" isDark={isDark} />
        <InfoCard>
          <Text className={`font-bold ${headingColor} mb-2`}>Creating an Account</Text>
          <Text className={`${textColor} leading-6 mb-4`}>
            Sign up with your email and choose a unique username. Usernames become your public URL and can be changed 4 times per month.
          </Text>
          <Text className={`font-bold ${headingColor} mb-2`}>Teacher Accounts</Text>
          <Text className={`${textColor} leading-6`}>
            Teachers have a separate verification process. After creating a normal account, you can apply for verification to get a blue checkmark and post questions.
          </Text>
        </InfoCard>

        <SectionHeading icon={User} title="Student Profile" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            Your public profile shows your custom avatar, banner, global rank badge, win rates, achievements, and recent battles. Earn badges for victories and streaks!
          </Text>
        </InfoCard>

        <SectionHeading icon={Users} title="Social & Follows" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            Follow students and teachers, see who follows you, and build an academic network. Follower counts are displayed prominently on profiles.
          </Text>
        </InfoCard>

        <SectionHeading icon={Trophy} title="Global Leaderboard" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            The leaderboard ranks students by total earned points. Answer questions correctly and quickly to rank up and earn medals (Gold, Silver, Bronze).
          </Text>
        </InfoCard>

        <SectionHeading icon={Sword} title="Dheeyudha (Peer Battles)" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            "War of Wits". Challenge other students to real-time quiz battles. Search by username or school, declare a war, and win to boost your ranking!
          </Text>
        </InfoCard>

        <SectionHeading icon={Zap} title="Points & Penalties" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6 mb-4`}>
            Correct answers give you full points. However, to prevent guessing on high-reward questions, there is a Flat-Tiered Negative Marking scale:
          </Text>
          <Text className={`${textColor} leading-5 mb-1`}>• 1-4 pts: No penalty</Text>
          <Text className={`${textColor} leading-5 mb-1`}>• 5-9 pts: -1 pt</Text>
          <Text className={`${textColor} leading-5 mb-1`}>• 10-14 pts: -2 pts</Text>
          <Text className={`${textColor} leading-5 mb-1`}>• 15-19 pts: -3 pts</Text>
          <Text className={`${textColor} leading-5`}>• 20+ pts: -4 to -5 pts</Text>
        </InfoCard>

        <SectionHeading icon={BookOpen} title="AI Submissions" isDark={isDark} />
        <InfoCard>
          <Text className={`${textColor} leading-6`}>
            Get instant, detailed feedback on written submissions using our advanced AI reviewer. It checks for completeness and clarity based on the question context.
          </Text>
        </InfoCard>

      </ScrollView>
    </View>
  );
}
