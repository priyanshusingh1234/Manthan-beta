"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StudentProfile from '@/components/StudentProfile';
import TeacherProfile from '@/components/TeacherProfile';

export default function ProfilePage() {
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsTeacher(!!user.user_metadata?.isTeacher);
      } else {
        // Not logged in, redirect or treat as student
        setIsTeacher(false);
      }
    });
  }, []);

  if (isTeacher === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return isTeacher ? <TeacherProfile /> : <StudentProfile />;
}
