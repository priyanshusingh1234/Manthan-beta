"use client";

import React, { useState } from 'react';
import { BookOpen, Users, Star, TrendingUp } from 'lucide-react-native';
import QuestionCard from '@/components/QuestionCard';

interface ImpactStats {
  accuracy: number;
  reached: number;
  solves: number;
}

interface TeacherPublicTabsProps {
  showImpact: boolean;
  impactStats: ImpactStats;
  questions: any[];
}

export default function TeacherPublicTabs({ showImpact, impactStats, questions }: TeacherPublicTabsProps) {
  const [activeTab, setActiveTab] = useState<'impact' | 'posts'>(showImpact ? 'impact' : 'posts');
  const [visibleCount, setVisibleCount] = useState(10);

  return (
    <View>
      <View className="mb-8 relative z-10 flex justify-center sm:justify-start flex-row">
        <View className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex-row">
          <View
            className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm transition-transform duration-300 ${activeTab === 'posts' ? 'translate-x-full' : 'translate-x-0'}`}
          />
          <View
            onPress={() => setActiveTab('impact')}
            disabled={!showImpact}
            className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors ${!showImpact ? 'opacity-50 cursor-not-allowed text-slate-400' : activeTab === 'impact' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Teaching Impact
          </View>
          <View
            onPress={() => setActiveTab('posts')}
            className={`relative z-10 px-5 py-2.5 text-sm font-black rounded-xl transition-colors ${activeTab === 'posts' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Posted Questions
          </View>
        </View>
      </View>

      {activeTab === 'impact' && showImpact && (
        <View className="mb-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
          <View className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></View>

          <View className="flex items-center gap-4 mb-8 flex-row">
            <View className="p-3.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-inner group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
            </View>
            <Text className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Teaching Impact</Text>
          </View>

          <View className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <View className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
              <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 group-hover/card:scale-110 transition-transform flex-row">
                <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </View>
              <Text className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Community Accuracy</Text>
              <View className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{impactStats.accuracy}<Text className="text-2xl text-slate-400">%</Text></View>
              <View className="mt-6 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                <View 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${impactStats.accuracy}%` }}
                />
              </View>
            </View>

            <View className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/30 hover:-translate-y-1 transition-transform group/card text-white relative overflow-hidden">
              <View className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></View>
              <View className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 group-hover/card:scale-110 transition-transform backdrop-blur-sm flex-row">
                <Users className="w-7 h-7 text-white drop-shadow-sm" />
              </View>
              <Text className="font-bold text-emerald-100 uppercase tracking-widest text-xs mb-2">Total Students Impacted</Text>
              <View className="text-5xl font-black text-white tracking-tight">{impactStats.reached.toLocaleString()}</View>
              <Text className="text-sm font-medium text-emerald-50 mt-4 bg-black/20 px-4 py-2 rounded-xl inline-block border border-white/10 backdrop-blur-md">Unique scholars reached</Text>
            </View>

            <View className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
              <View className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 dark:border-purple-800 group-hover/card:scale-110 transition-transform flex-row">
                <Star className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </View>
              <Text className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Cumulative Solves</Text>
              <View className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{impactStats.solves.toLocaleString()}</View>
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl inline-block border border-emerald-100 dark:border-emerald-800">Verified Successes</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'posts' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6 flex items-center flex-row">
            Posted Questions <Text className="text-slate-400 font-normal text-lg ml-2">({questions.length})</Text>
          </Text>

          {questions.length > 0 ? (
            <>
              <View className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questions.slice(0, visibleCount).map((q) => (
                  <QuestionCard key={q.id} q={q} />
                ))}
              </View>
              {visibleCount < questions.length && (
                <View className="mt-8 text-center flex justify-center flex-row">
                  <View 
                    onPress={() => setVisibleCount(v => v + 10)} 
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl active:scale-95 transition-all w-full md:w-auto"
                  >
                    Load More
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
              This teacher hasn't posted any questions yet.
            </View>
          )}
        </View>
      )}
    </View>
  );
}
