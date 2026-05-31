import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Search, User, MessageSquare, FileQuestion, Loader2, ArrowLeft, X } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useRouter, useSearchParams } from '@/lib/next-navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import PostCard from '@/components/PostCard';

type SearchResults = {
    users: any[];
    posts: any[];
    questions: any[];
};

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'questions'>('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUserId(user?.id || null);
        });
        
        // Mark as visited for highlighting logic
        if (typeof window !== 'undefined') {
            localStorage.setItem('dheeyudha_search_visited', 'true');
        }
    }, []);

    const performSearch = useCallback(async (q: string) => {
        if (!q || q.length < 1) {
            setResults(null);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery, performSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}`);
        performSearch(query);
    };

    const clearSearch = () => {
        setQuery('');
        setResults(null);
        router.push('/search');
    };

    const UserResult = ({ user }: { user: any }) => (
        <Link 
            href={user.is_teacher ? `/teacher/${user.username}` : `/user/${user.username}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group flex-row"
        >
            <View className="relative w-12 h-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 border-2 border-white dark:border-slate-800 shrink-0">
                {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-6 h-6 m-auto absolute inset-0 text-slate-400" />
                )}
            </View>
            <View className="flex-1 min-w-0 flex-row">
                <Text className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {user.full_name}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</Text>
                {user.school && (
                    <Text className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight mt-1">{user.school}</Text>
                )}
            </View>
        </Link>
    );

    return (
        <View className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            {/* Search Header - Native Mobile Style */}
            <View className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 pt-[env(safe-area-inset-top)]">
                <View className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 flex-row">
                    <View 
                        onPress={() => router.back()} 
                        className="p-2 -ml-2 text-indigo-600 dark:text-indigo-400 active:scale-90 transition-transform"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </View>
                    <View onPress={handleSearch} className="flex-1 relative flex-row">
                        <View className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                            <TextInput 
                                type="text" 
                                placeholder="Search friends, posts, or topics..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if (e.target.value.length > 0) {
                                        performSearch(e.target.value); // Rapid search as they type
                                    }
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-900 border-transparent rounded-[1.25rem] pl-10 pr-10 py-2.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-500"
                                autoFocus
                                inputMode="search"
                            />
                            {query && (
                                <View 
                                    type="button" 
                                    onPress={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Native-style Tab Bar */}
                {results && (
                    <View className="max-w-4xl mx-auto flex items-center px-2 pb-2 overflow-x-auto scrollbar-hide flex-row">
                        {[
                            { id: 'all', label: 'All', icon: Search },
                            { id: 'users', label: `Users`, icon: User },
                            { id: 'posts', label: `Community`, icon: MessageSquare },
                            { id: 'questions', label: `Questions`, icon: FileQuestion },
                        ].map((tab) => {
                            const isTabActive = activeTab === tab.id;
                            return (
                                <View
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id as any)}
                                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                        isTabActive 
                                            ? 'text-indigo-600 dark:text-indigo-400' 
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    {isTabActive && (
                                        <View className="absolute inset-0 bg-indigo-500/5 rounded-xl animate-in fade-in" />
                                    )}
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Results Area */}
            <View className="max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <View className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <Text className="font-bold tracking-wide uppercase text-xs">Hunting for results...</Text>
                    </View>
                ) : !results ? (
                    <View className="text-center py-20 flex flex-col items-center gap-6">
                        <View className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center flex-row">
                            <Search className="w-12 h-12 text-indigo-400 dark:text-indigo-600" />
                        </View>
                        <View className="space-y-2">
                            <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Find anything on Dheeyudha</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                                Search for your friends, interesting community posts, or questions you want to solve.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View className="space-y-12">
                        {/* Users Section */}
                        {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                            <View className="space-y-4">
                                <Text className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 flex-row">
                                    <User className="w-4 h-4" /> Users
                                </Text>
                                <View className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {results.users.map(u => <UserResult key={u.id} user={u} />)}
                                </View>
                            </View>
                        )}

                        {/* Questions Section */}
                        {(activeTab === 'all' || activeTab === 'questions') && results.questions.length > 0 && (
                            <View className="space-y-4">
                                <Text className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 flex-row">
                                    <FileQuestion className="w-4 h-4" /> Questions
                                </Text>
                                <View className="space-y-4">
                                    {results.questions.map(q => (
                                        <QuestionCard key={q.id} q={q} />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Posts Section */}
                        {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                            <View className="space-y-4">
                                <Text className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 flex-row">
                                    <MessageSquare className="w-4 h-4" /> Community Posts
                                </Text>
                                <View className="space-y-6">
                                    {results.posts.map(p => (
                                        <PostCard 
                                            key={p.id} 
                                            post={p} 
                                            currentUserId={currentUserId} 
                                            onUpdate={() => performSearch(query)} 
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {results.users.length === 0 && results.posts.length === 0 && results.questions.length === 0 && (
                            <View className="text-center py-20">
                                <Text className="text-slate-500 font-bold italic">No results found for "{query}"</Text>
                                <View 
                                    onPress={clearSearch}
                                    className="mt-4 text-indigo-600 font-bold hover:underline"
                                >
                                    Clear search and try again
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<View className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-400 font-bold italic flex-row">Loading search environment...</View>}>
            <SearchPageContent />
        </Suspense>
    );
}
