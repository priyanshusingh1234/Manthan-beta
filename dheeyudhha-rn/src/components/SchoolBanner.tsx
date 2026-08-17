import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Shield, Plus, ChevronRight, GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

// Constants to easily switch environment URLs
const API_URL = 'https://manthan-beta-c975.vercel.app';

export default function SchoolBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    fetchMySchool();
  }, []);

  const fetchMySchool = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/squad`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data?.school?.id) {
          setSchoolData(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch school banner data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="mx-6 mb-5 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse justify-center items-center">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  // If user has a school
  if (schoolData) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/school' as any)}
        className="mx-6 mb-5 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center p-4"
      >
        <View className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mr-4">
          <Shield size={24} color="#4f46e5" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">My Faction</Text>
          <Text className="text-base font-black text-slate-800 dark:text-slate-100" numberOfLines={1}>
            {schoolData.school.name}
          </Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  }

  // If user does not have a school
  return (
    <View className="mx-6 mb-5 gap-3">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/school/create' as any)}
        className="rounded-2xl overflow-hidden bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-500/30 flex-row items-center p-4"
      >
        <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-4">
          <Plus size={24} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-base">Create Faction</Text>
          <Text className="text-indigo-100 text-xs font-medium mt-0.5">Lead your own school</Text>
        </View>
        <ChevronRight size={20} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/school/search' as any)}
        className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center p-4"
      >
        <View className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
          <GraduationCap size={24} color="#64748b" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-800 dark:text-slate-100 font-black text-base">Join Top Factions</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Request to join existing schools</Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
