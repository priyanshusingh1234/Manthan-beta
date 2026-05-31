"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StudentProfile from '@/components/StudentProfile';
import TeacherProfile from '@/components/TeacherProfile';

export default function ProfilePage() {
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // First check DB to ensure manual role changes take effect
        const { data: profile } = await supabase.from('profiles').select('is_teacher').eq('id', user.id).single();
        if (profile?.is_teacher !== undefined) {
             setIsTeacher(profile.is_teacher);
        } else {
             setIsTeacher(!!user.user_metadata?.isTeacher);
        }
      } else {
        // Not logged in, redirect or treat as student
        setIsTeacher(false);
      }
    });
  }, []);

  if (isTeacher === null) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 flex-row">
        <View className="animate-pulse flex flex-col items-center gap-4">
          <View className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></View>
          <Text className="text-slate-500 font-medium">Loading profile...</Text>
        </View>
      </View>
    );
  }

  return isTeacher ? <TeacherProfile /> : <StudentProfile />;
}
