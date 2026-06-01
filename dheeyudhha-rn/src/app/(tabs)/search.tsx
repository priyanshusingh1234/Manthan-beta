import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search, Compass, BookOpen, Users } from 'lucide-react-native';

export default function SearchScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40, paddingTop: 40 }}>
      {/* Header */}
      <View className="px-6 mb-6">
        <Text className="text-3xl font-black text-slate-900 mb-4">Explore</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <Search size={20} color="#94a3b8" />
          <TextInput 
            placeholder="Search for quizzes, topics, or friends..."
            className="flex-1 ml-3 text-slate-900 font-semibold"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Categories */}
      <View className="px-6 mb-8">
        <Text className="text-lg font-black text-slate-900 mb-4">Categories</Text>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          <TouchableOpacity className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 items-center justify-center py-6">
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-3">
              <Text className="text-2xl">🔬</Text>
            </View>
            <Text className="font-bold text-slate-900">Science</Text>
            <Text className="text-xs text-slate-500 mt-1">1.2K Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 items-center justify-center py-6">
            <View className="w-12 h-12 rounded-full bg-purple-50 items-center justify-center mb-3">
              <Text className="text-2xl">📐</Text>
            </View>
            <Text className="font-bold text-slate-900">Maths</Text>
            <Text className="text-xs text-slate-500 mt-1">850 Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 items-center justify-center py-6">
            <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
              <Text className="text-2xl">🌍</Text>
            </View>
            <Text className="font-bold text-slate-900">SST</Text>
            <Text className="text-xs text-slate-500 mt-1">600 Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 items-center justify-center py-6">
            <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center mb-3">
              <Text className="text-2xl">📖</Text>
            </View>
            <Text className="font-bold text-slate-900">English</Text>
            <Text className="text-xs text-slate-500 mt-1">400 Quizzes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggested Friends */}
      <View className="px-6 mb-8">
        <Text className="text-lg font-black text-slate-900 mb-4">Trending Players</Text>
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center justify-center py-10">
          <Users size={32} color="#94a3b8" className="mb-3" />
          <Text className="text-slate-900 font-bold text-center">Connect with classmates</Text>
          <Text className="text-slate-500 text-xs text-center mt-1">Search for your friends to challenge them.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
