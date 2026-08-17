import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Users, Search as SearchIcon, Sword } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabaseClient';

const API_URL = 'https://manthan-beta-c975.vercel.app';

export default function SearchSchoolScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTopSchools();
  }, []);

  const fetchTopSchools = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schools`);
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch (e) {
      console.error('Failed to fetch top schools:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (schoolId: string) => {
    try {
      setRequestingId(schoolId);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      const res = await fetch(`${API_URL}/api/schools/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'request', schoolId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await supabase.auth.refreshSession();
        Alert.alert("Success!", data.message || "Request processed.");
        router.back();
      } else {
        Alert.alert("Notice", data.error || "Failed to send request.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setRequestingId(null);
    }
  };

  const renderSchoolItem = ({ item, index }: { item: any, index: number }) => (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl items-center justify-center mr-3 border border-indigo-200 dark:border-indigo-800">
            <Text className="text-indigo-700 dark:text-indigo-400 font-black text-lg">#{item.rank}</Text>
          </View>
          <View className="flex-1 mr-2">
            <Text className="text-lg font-black text-slate-800 dark:text-slate-100" numberOfLines={1}>
              {item.name}
            </Text>
            {item.generalName && (
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Leader: {item.generalName}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Sword size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
            {item.points || 0} War XP
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 flex-1">
          <Users size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
            {item.memberCount || 1} Members
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleRequestJoin(item.id)}
        disabled={requestingId === item.id}
        className={`py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm ${
          requestingId === item.id 
            ? 'bg-slate-200 dark:bg-slate-800 shadow-none' 
            : 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/30'
        }`}
      >
        {requestingId === item.id ? (
          <ActivityIndicator color={isDarkMode ? '#94a3b8' : '#64748b'} size="small" />
        ) : (
          <Text className="text-white font-bold text-base">
            {item.isPrivate ? 'Request to Join' : 'Join Faction'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center gap-4 shadow-sm" 
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
        >
          <ArrowLeft size={24} color={isDarkMode ? '#cbd5e1' : '#334155'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">Top Factions</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={schools}
          keyExtractor={(item) => item.id}
          renderItem={renderSchoolItem}
          contentContainerStyle={{ 
            padding: 20, 
            paddingBottom: Math.max(insets.bottom, 40) 
          }}
          ListHeaderComponent={() => (
            <View className="mb-6 items-center mt-2">
              <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-800">
                <SearchIcon size={36} color="#4f46e5" />
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">
                Global Leaderboard
              </Text>
              <Text className="text-slate-500 text-center px-4 leading-relaxed">
                Join a top-ranking faction to participate in global wars and earn exclusive rewards.
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="py-10 items-center">
              <Text className="text-slate-500 font-medium">No factions found. Be the first to create one!</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
