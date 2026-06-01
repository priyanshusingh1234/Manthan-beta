import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Clock, Users, Zap } from 'lucide-react-native';

export default function QuestionCard({ q }: { q: any }) {
  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-xl">🧑‍🏫</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-900">{q?.createdByName || 'Teacher'}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-slate-500">{q?.subject || 'General'}</Text>
            {q?.classGrade && (
              <>
                <View className="w-1 h-1 rounded-full bg-slate-300" />
                <Text className="text-xs text-slate-500">Class {q.classGrade}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Body */}
      <View className="mb-4">
        <View className="flex-row flex-wrap gap-2 mb-2">
          {q?.difficulty && (
            <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex-row items-center">
              <Text className="text-[10px] font-bold text-emerald-700 uppercase">{q.difficulty}</Text>
            </View>
          )}
          {q?.timeLimit && (
            <View className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex-row items-center gap-1">
              <Clock size={10} color="#64748b" />
              <Text className="text-[10px] font-bold text-slate-600 uppercase">{q.timeLimit}m</Text>
            </View>
          )}
          <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex-row items-center gap-1">
            <Users size={10} color="#3b82f6" />
            <Text className="text-[10px] font-bold text-blue-700 uppercase">{q?.solvedCount || 0} Solved</Text>
          </View>
        </View>
        
        <Text className="text-lg font-bold text-slate-900 mb-2">{q?.title || 'Untitled Question'}</Text>
        {q?.body && (
          <Text className="text-sm text-slate-600" numberOfLines={3}>{q.body}</Text>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between border-t border-slate-100 pt-4">
        <View className="flex-row items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
          <Zap size={14} color="#f59e0b" fill="#f59e0b" />
          <Text className="font-bold text-amber-600">{q?.points || 0} PTS</Text>
        </View>

        <TouchableOpacity className="bg-blue-600 flex-row items-center gap-2 px-6 py-2.5 rounded-xl">
          <Play size={14} color="white" fill="white" />
          <Text className="text-white font-bold text-sm">Attempt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
