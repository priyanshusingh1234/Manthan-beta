import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState, useEffect } from 'react';
import QuestionCard from '@/components/QuestionCard';
import PostCard from '@/components/PostCard';
import { Filter, SlidersHorizontal, BookOpen, Layers, Target, ChevronDown, Info, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import SuggestedUsersCard from '@/components/SuggestedUsersCard';
import useSWR from 'swr';

function normalizeSubject(subject?: string | null) {
    if (!subject) return '';
    const value = subject.trim().toLowerCase();
    if (value.startsWith('math')) return 'math';
    if (value === 'social studies' || value === 'sst') return 'sst';
    return value;
}

const fetcher = async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function FeedPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Filters
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');

    useEffect(() => {
        if (selectedSubject === 'English' && selectedClass) {
            setSelectedClass('');
        }
    }, [selectedSubject, selectedClass]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUserId(session?.user?.id || null);
        });
    }, []);

    // Construct URL based on filters
    const params = new URLSearchParams({ limit: '40' });
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedClass && selectedSubject !== 'English') params.set('class', selectedClass);
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
    if (selectedChapter) params.set('chapter', selectedChapter);

    // SWR takes care of fetching, caching, and optimistic UI
    const { data, error, isLoading } = useSWR(`/api/feed?${params.toString()}`, fetcher, {
        revalidateOnFocus: false, // Better for native apps to not jitter on refocus
        dedupingInterval: 60000,  // Cache feed aggressively for 1 minute
    });

    const questions = Array.isArray(data) ? data : (data?.questions || []);
    const feedMeta = data?.meta || null;

    // Filter logic applied to the cached SWR data
    const filteredQuestions = questions.filter((q: any) => {
        if (selectedSubject && normalizeSubject(q.subject) !== normalizeSubject(selectedSubject)) return false;

        if (selectedClass) {
            const qClass = String(q.classGrade || q.class_grade || '');
            if (qClass !== selectedClass && qClass !== 'All') return false;
        }

        if (selectedDifficulty) {
            const qDiff = (q.difficulty || '').toLowerCase();
            const sDiff = selectedDifficulty.toLowerCase();
            const isModerateMatch = (sDiff === 'moderate' || sDiff === 'medium') && (qDiff === 'moderate' || qDiff === 'medium');
            if (!isModerateMatch && qDiff !== sDiff) return false;
        }

        if (selectedChapter) {
            const qChap = (q.chapter || '').toLowerCase();
            if (!qChap.includes(selectedChapter.toLowerCase())) return false;
        }
        
        return true;
    });

    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            {/* Decorative Blur Backgrounds */}
            <View className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />
            <View className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />

            <View className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 w-full lg:flex lg:gap-8 justify-center flex-row">

                <View className="w-full lg:max-w-3xl flex-shrink overflow-x-hidden flex-row">
                    {/* Header */}
                    <View className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <View className="px-1">
                            <View className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100/50 dark:border-indigo-800/50 flex-row">
                                <Text className="relative flex h-1.5 w-1.5 flex-row">
                                    <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 flex-row"></Text>
                                    <Text className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500 flex-row"></Text>
                                </Text>
                                {feedMeta?.userId ? 'Personalised' : 'Live Feed'}
                            </View>
                            <Text className="text-2xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5">
                                {feedMeta?.userId ? 'Your Feed' : 'Explore Questions'}
                            </Text>
                            <Text className="text-[13px] md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                                {feedMeta?.userId
                                    ? `Curated for Class ${feedMeta.userGrade || '?'} · ${feedMeta.userSchool || 'No school'} · ${feedMeta.followingCount} following`
                                    : 'Test your knowledge against the best questions by top teachers.'}
                            </Text>
                        </View>
                        {feedMeta?.userId && (
                            <View className="hidden md:flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-4 py-2.5 rounded-xl border border-indigo-500/20 flex-row">
                                <Sparkles className="w-4 h-4" /> 6-Layer Algorithm Active
                            </View>
                        )}
                    </View>


                    {/* Modern Filter Selectors */}
                    <View className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[2rem] shadow-sm mb-8">
                        <View className="flex items-center gap-2 mb-4 px-2 flex-row">
                            <SlidersHorizontal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            <Text className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">FILTER FEED</Text>
                        </View>

                        <View className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Subject Selector */}
                            <View className="relative group">
                                <View className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                                    <BookOpen className="w-4 h-4" />
                                </View>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full appearance-none bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 rounded-2xl pl-10 pr-10 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">All Subjects</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Science">Science</option>
                                    <option value="English">English</option>
                                    <option value="SST">Social Studies</option>
                                </select>
                                <View className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                </View>
                            </View>

                            {/* Class Selector */}
                            <View className="relative group">
                                <View className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-fuchsia-500 dark:group-focus-within:text-fuchsia-400 transition-colors">
                                    <Layers className="w-4 h-4" />
                                </View>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full appearance-none bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 focus:border-fuchsia-500 dark:focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 dark:focus:ring-fuchsia-900/50 rounded-2xl pl-10 pr-10 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                    disabled={selectedSubject === 'English'}
                                >
                                    <option value="">All Classes</option>
                                    <option value="6">Class 6</option>
                                    <option value="7">Class 7</option>
                                    <option value="8">Class 8</option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                                <View className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                </View>
                            </View>

                            {/* Difficulty Selector */}
                            <View className="relative group">
                                <View className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                                    <Target className="w-4 h-4" />
                                </View>
                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="w-full appearance-none bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/50 rounded-2xl pl-10 pr-10 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">Any Difficulty</option>
                                    <option value="easy">Easy</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <View className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                </View>
                            </View>
                            
                            {/* Chapter Search */}
                            <View className="relative group sm:col-span-3">
                                <View className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                                    <BookOpen className="w-4 h-4" />
                                </View>
                                <TextInput
                                    type="text"
                                    placeholder="Search by Chapter name..."
                                    value={selectedChapter}
                                    onChange={(e) => setSelectedChapter(e.target.value)}
                                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm"
                                />
                            </View>
                        </View>

                        {selectedSubject === 'English' && (
                            <Text className="mt-3 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 px-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 flex-row">
                                <Info className="w-3.5 h-3.5" />
                                English language questions are applicable to all class grades.
                            </Text>
                        )}
                    </View>

                    {/* Feed Content */}
                    {isLoading ? (
                        <View className="flex flex-col items-center justify-center py-20 space-y-4">
                            <View className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></View>
                            <Text className="font-bold text-slate-500 dark:text-slate-400">Loading feed...</Text>
                        </View>
                    ) : filteredQuestions.length === 0 ? (
                        <View className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                            <View className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 flex-row">
                                <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </View>
                            <Text className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No matching questions</Text>
                            <Text className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                                We couldn't find any questions matching your current filters. Try changing the selectors above or clear the filters to see all.
                            </Text>
                            {(selectedSubject || selectedClass || selectedDifficulty || selectedChapter) && (
                                <View
                                    onPress={() => { setSelectedSubject(''); setSelectedClass(''); setSelectedDifficulty(''); setSelectedChapter(''); }}
                                    className="mt-6 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                                >
                                    Clear all filters
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="space-y-6">
                            <View className="text-sm font-bold text-slate-500 dark:text-slate-400 px-2 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/60 inline-flex items-center gap-2 flex-row">
                                Showing {filteredQuestions.length} Questions
                            </View>
                            
                            {filteredQuestions.map((q: any) => (
                                <View key={q.id} className="pb-6">
                                    {q._feedLabel && (
                                        <View className="text-xs font-black text-slate-500 dark:text-slate-500 mb-2 px-1 flex items-center gap-1.5 flex-row">
                                            {q._feedLabel}
                                        </View>
                                    )}
                                    {q.type === 'post' ? (
                                        <PostCard post={q} currentUserId={currentUserId} showTags={true} />
                                    ) : (
                                        <QuestionCard q={q} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Right Sidebar Suggestions */}
                <View className="hidden lg:block w-[320px] shrink-0 xl:w-[340px]">
                    <View className="sticky top-28">
                        <SuggestedUsersCard />
                    </View>
                </View>

            </View>

        </View>
    );
}
