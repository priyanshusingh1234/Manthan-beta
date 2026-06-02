import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Clock, Users, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function QuestionCard({ q }: { q: any }) {
  const router = useRouter();
  const teacherName = q?.profiles?.full_name || 'Teacher';
  const teacherAvatar = q?.profiles?.avatar_url;
  const teacherUsername = q?.profiles?.username;

  const HeaderWrapper = ({ children }: { children: React.ReactNode }) => {
    if (teacherUsername) {
      return (
        <TouchableOpacity 
          onPress={() => router.push(`/user/${teacherUsername}` as any)} 
          activeOpacity={0.7} 
          className="flex-row items-center gap-3 mb-3"
        >
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View className="flex-row items-center gap-3 mb-3">
        {children}
      </View>
    );
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
      {/* Header */}
      <HeaderWrapper>
        {teacherAvatar && !teacherAvatar.includes('googleusercontent') ? (
          <Image source={{ uri: teacherAvatar }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 items-center justify-center border border-blue-200 dark:border-blue-900">
            <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">{teacherName.substring(0, 2).toUpperCase()}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-bold text-slate-900 dark:text-slate-100 text-sm">{teacherName}</Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{q?.subject || 'General'}</Text>
            {q?.class_grade && (
              <>
                <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Class {q.class_grade}</Text>
              </>
            )}
          </View>
        </View>
      </HeaderWrapper>

      {/* Body */}
      <View className="mb-3">
        <View className="flex-row flex-wrap gap-2 mb-2">
          {q?.difficulty && (
            <View className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded flex-row items-center">
              <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">{q.difficulty}</Text>
            </View>
          )}
          {q?.time_limit && (
            <View className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded flex-row items-center gap-1">
              <Clock size={9} color="#64748b" />
              <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">{q.time_limit}m</Text>
            </View>
          )}
          {(q?.solved_count !== undefined && q?.solved_count !== null) && (
            <View className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
              <Users size={9} color="#3b82f6" />
              <Text className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase">{q.solved_count} Solved</Text>
            </View>
          )}
        </View>
        
        <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">{q?.title || 'Untitled Question'}</Text>
        {q?.body && (
          <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed" numberOfLines={2}>{q.body}</Text>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
        <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-105 dark:border-amber-900/30 px-2 py-1 rounded-lg">
          <Zap size={12} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{q?.points || 0} PTS</Text>
        </View>

        <TouchableOpacity className="bg-indigo-600 flex-row items-center gap-1.5 px-4 py-2 rounded-xl active:scale-95 transition-transform">
          <Play size={12} color="white" fill="white" />
          <Text className="text-white font-bold text-xs">Attempt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

