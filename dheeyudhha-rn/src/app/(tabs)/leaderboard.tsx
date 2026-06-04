import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { Award, MapPin, ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import BadgedName from '@/components/BadgedName';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, school, total_points, avatar_url, is_teacher')
        .order('total_points', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name?: string) => {
    if (!name || name.trim() === '') return '?';
    return name.trim()[0].toUpperCase();
  };

  const renderAvatar = (student: any, size: number, borderClass: string) => {
    const isImage = !!student?.avatar_url;
    if (isImage) {
      return (
        <Image 
          source={{ uri: student.avatar_url }} 
          style={{ width: size, height: size, borderRadius: size/2 }}
          className={`border-4 bg-white dark:bg-slate-900 ${borderClass}`}
        />
      );
    }
    return (
      <View style={{ width: size, height: size, borderRadius: size/2 }} className={`border-4 items-center justify-center bg-indigo-100 dark:bg-indigo-950 ${borderClass}`}>
        <Text className="font-black text-indigo-600 dark:text-indigo-400" style={{ fontSize: size/2.5 }}>
          {getInitial(student?.full_name || student?.username)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 relative">
      <Stack.Screen 
        options={{ 
          title: 'Leaderboard',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ChevronLeft size={24} color={isDark ? '#cbd5e1' : '#0f172a'} />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
          headerTintColor: isDark ? '#cbd5e1' : '#0f172a',
        }} 
      />
      
      {/* Background Gradient Effect - Simulated */}
      <View className="absolute top-0 right-0 w-full h-[300px] bg-indigo-50/50 dark:bg-indigo-950/20" />

      <ScrollView className="flex-1 z-10 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Podium Display (Top 3) */}
        {students.length >= 3 && (
          <View className="flex-row justify-center items-end h-56 mb-8 gap-2">
            
            {/* 2nd Place */}
            <TouchableOpacity 
              onPress={() => router.push(`/user/${students[1].username}` as any)}
              activeOpacity={0.7}
              className="w-[30%] items-center mb-2"
            >
              <View className="relative mb-2 items-center">
                {renderAvatar(students[1], 64, isDark ? 'border-slate-800' : 'border-white')}
                <View className="absolute -bottom-2 right-0 bg-slate-200 dark:bg-slate-800 w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 items-center justify-center shadow-sm z-20">
                  <Text className="text-[10px] font-black text-slate-700 dark:text-slate-300">2</Text>
                </View>
              </View>
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 items-center">
                <BadgedName 
                  name={students[1].full_name || students[1].username || "Student"}
                  userId={students[1].id}
                  isTeacher={students[1].is_teacher}
                  isTopper={students[1].total_points >= 1500}
                  rank={2}
                  nameClassName="text-xs font-bold text-slate-800 dark:text-slate-200 text-center"
                  containerClassName="flex-row items-center gap-1 justify-center"
                  iconSize={12}
                />
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] mt-0.5">
                  {(students[1].total_points || 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 1st Place */}
            <TouchableOpacity 
              onPress={() => router.push(`/user/${students[0].username}` as any)}
              activeOpacity={0.7}
              className="w-[35%] items-center -translate-y-6 z-10"
            >
              <View className="relative mb-2 items-center">
                {renderAvatar(students[0], 84, 'border-amber-400')}
                <View className="absolute -bottom-2 right-1 bg-amber-500 w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 items-center justify-center shadow-md z-20">
                  <Text className="text-xs font-black text-white">1</Text>
                </View>
              </View>
              <View className="bg-white dark:bg-slate-900 border-t-2 border-amber-400 border-x border-b border-x-amber-100 dark:border-x-slate-800 border-b-amber-100 dark:border-b-slate-800 shadow-md rounded-xl w-full py-3 px-1 items-center">
                <BadgedName 
                  name={students[0].full_name || students[0].username || "Student"}
                  userId={students[0].id}
                  isTeacher={students[0].is_teacher}
                  isTopper={students[0].total_points >= 1500}
                  rank={1}
                  nameClassName="text-sm font-extrabold text-slate-900 dark:text-slate-100 text-center"
                  containerClassName="flex-row items-center gap-1 justify-center"
                  iconSize={14}
                />
                <Text className="text-amber-500 font-black text-xs mt-0.5">
                  {(students[0].total_points || 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3rd Place */}
            <TouchableOpacity 
              onPress={() => router.push(`/user/${students[2].username}` as any)}
              activeOpacity={0.7}
              className="w-[30%] items-center mb-2"
            >
              <View className="relative mb-2 items-center">
                {renderAvatar(students[2], 64, isDark ? 'border-slate-800' : 'border-white')}
                <View className="absolute -bottom-2 right-0 bg-orange-200 dark:bg-orange-900 w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 items-center justify-center shadow-sm z-20">
                  <Text className="text-[10px] font-black text-orange-800 dark:text-orange-300">3</Text>
                </View>
              </View>
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 items-center">
                <BadgedName 
                  name={students[2].full_name || students[2].username || "Student"}
                  userId={students[2].id}
                  isTeacher={students[2].is_teacher}
                  isTopper={students[2].total_points >= 1500}
                  rank={3}
                  nameClassName="text-xs font-bold text-slate-800 dark:text-slate-200 text-center"
                  containerClassName="flex-row items-center gap-1 justify-center"
                  iconSize={12}
                />
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] mt-0.5">
                  {(students[2].total_points || 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        )}

        {/* List Header */}
        <View className="flex-row items-center justify-between mb-3 px-2">
          <Text className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Top Players</Text>
          <View className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
            <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live</Text>
          </View>
        </View>

        {/* Scrollable Leaderboard List */}
        <View className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {students.length === 0 ? (
            <View className="p-12 items-center justify-center">
              <Award size={48} color={isDark ? '#475569' : '#cbd5e1'} className="mb-3" />
              <Text className="text-slate-500 dark:text-slate-400 font-medium text-center">Rankings will appear here soon.</Text>
            </View>
          ) : (
            students.slice(3).map((student, index) => {
              const rank = index + 4;
              return (
                <TouchableOpacity 
                  key={student.id} 
                  onPress={() => router.push(`/user/${student.username}` as any)}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800"
                >
                  
                  <View className="w-8 items-center justify-center">
                    <Text className="text-sm font-bold text-slate-400 dark:text-slate-500">{rank}</Text>
                  </View>

                  <View className="ml-1">
                    {student.avatar_url ? (
                      <Image source={{ uri: student.avatar_url }} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/50 items-center justify-center">
                        <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-base">
                          {getInitial(student.full_name || student.username)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="ml-3 flex-1">
                    <BadgedName 
                      name={student.full_name || student.username || "Student"}
                      userId={student.id}
                      isTeacher={student.is_teacher}
                      isTopper={student.total_points >= 1500}
                      nameClassName="font-bold text-[15px] text-slate-900 dark:text-slate-100"
                      containerClassName="flex-row items-center gap-1 flex-wrap"
                      iconSize={14}
                    />
                    <View className="flex-row items-center mt-0.5">
                      <MapPin size={12} color={isDark ? '#64748b' : '#64748b'} />
                      <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1" numberOfLines={1}>
                        {student.school || 'Unknown School'}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end pl-2">
                    <Text className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {(student.total_points || 0).toLocaleString()}
                    </Text>
                    <Text className="text-[9px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider">
                      Points
                    </Text>
                  </View>

                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

