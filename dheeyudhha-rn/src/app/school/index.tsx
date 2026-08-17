import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Users, LogOut, Plus, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabaseClient';

const API_URL = 'https://manthan-beta-c975.vercel.app';

export default function SchoolDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [squadData, setSquadData] = useState<any>(null);

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
          setSquadData(data);
        } else {
          setSquadData(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch school dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSchool = async () => {
    Alert.alert(
      "Leave Faction",
      "Are you sure you want to leave this faction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { data: { session } } = await supabase.auth.getSession();
              const res = await fetch(`${API_URL}/api/schools/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
              });
              
              if (res.ok) {
                setSquadData(null);
              } else {
                Alert.alert("Error", "Failed to leave the school.");
              }
            } catch (e) {
              Alert.alert("Error", "Network error occurred.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center justify-between shadow-sm" 
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
          >
            <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">School Faction</Text>
        </View>

        {squadData && squadData.members?.find((m: any) => m.isMe)?.role === 'General' && (
          <TouchableOpacity 
            onPress={() => router.push('/school/edit' as any)}
            className="p-2 -mr-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
          >
            <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-base">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          padding: 20, 
          paddingBottom: Math.max(insets.bottom, 20) 
        }}
      >
        {squadData ? (
          /* User is IN a school */
          <View>
            <View className="items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-800">
                <Shield size={36} color="#4f46e5" />
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1">
                {squadData.school.name}
              </Text>
              <Text className="text-slate-500 font-bold mb-4">
                Total War Points: {squadData.school.total_war_points || 0}
              </Text>
              
              <View className="w-full flex-row items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                <Users size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                <Text className="text-slate-700 dark:text-slate-300 font-bold ml-3 flex-1">
                  Faction Members
                </Text>
                <Text className="text-indigo-600 dark:text-indigo-400 font-black">
                  {squadData.members?.length || 0}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLeaveSchool}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl flex-row items-center justify-center"
            >
              <LogOut size={20} color={isDarkMode ? '#f87171' : '#dc2626'} />
              <Text className="text-red-600 dark:text-red-400 font-bold text-lg ml-2">Leave Faction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* User is NOT in a school */
          <View className="items-center justify-center mt-12">
            <View className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-6">
              <Shield size={48} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-2">
              No Faction Yet
            </Text>
            <Text className="text-slate-500 text-center mb-10 leading-relaxed px-4">
              Join forces with other students or create your own school faction to compete in wars and climb the global leaderboards!
            </Text>

            <View className="w-full gap-4">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/school/create' as any)}
                className="w-full bg-indigo-600 dark:bg-indigo-500 py-4 rounded-2xl shadow-md shadow-indigo-500/30 flex-row items-center justify-center"
              >
                <Plus size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Create New Faction</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
