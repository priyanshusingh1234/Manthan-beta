'use client';

import React, { useEffect, useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from '@/lib/next-navigation';

export default function SolvedQuestionsPage() {
    const [solvedQuestions, setSolvedQuestions] = useState<any[] | null>(null);
    const [savedQuestions, setSavedQuestions] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'solved' | 'saved'>('solved');
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        const loadData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const headers: HeadersInit = { 
                    'Authorization': `Bearer ${session.access_token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                };
                
                const [solvedRes, savedRes] = await Promise.all([
                    fetch('/api/questions/solved', { headers, cache: 'no-store' }),
                    fetch('/api/questions/saved', { headers, cache: 'no-store' })
                ]);
                
                if (!solvedRes.ok) throw new Error(`Solved: ${await solvedRes.text()}`);
                if (!savedRes.ok) throw new Error(`Saved: ${await savedRes.text()}`);
                
                const [solvedData, savedData] = await Promise.all([
                    solvedRes.json(),
                    savedRes.json()
                ]);

                if (!mounted) return;
                setSolvedQuestions(Array.isArray(solvedData) ? solvedData : []);
                setSavedQuestions(Array.isArray(savedData) ? savedData : []);
            } catch (error: any) {
                console.error(error);
                if (!mounted) return;
                setErr(error?.message || String(error));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadData();

        return () => { mounted = false; };
    }, [router]);

    // Silently refresh the active tab's data in the background when switching tabs
    // This ensures questions you JUST saved on the Solved tab appear when you click the Saved tab
    useEffect(() => {
        let mounted = true;
        const refreshActiveTab = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const headers: HeadersInit = { 
                'Authorization': `Bearer ${session.access_token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            };
            const endpoint = activeTab === 'solved' ? '/api/questions/solved' : '/api/questions/saved';
            try {
                const res = await fetch(endpoint, { headers, cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                if (activeTab === 'solved') setSolvedQuestions(Array.isArray(data) ? data : []);
                else setSavedQuestions(Array.isArray(data) ? data : []);
            } catch (err) {
                // Ignore background refresh errors
            }
        };
        refreshActiveTab();
        return () => { mounted = false; };
    }, [activeTab]);

    const displayQuestions = activeTab === 'solved' ? solvedQuestions : savedQuestions;

    return (
        <View className="min-h-screen bg-background pb-24">
            <View className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <View className="flex items-center gap-4 mb-8 flex-row">
                    <View
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm flex-row"
                    >
                        <ArrowLeft className="w-4 h-4 text-foreground" />
                    </View>
                    <View className="flex-1 flex-row">
                        <Text className="text-2xl font-black text-foreground flex items-center gap-2 flex-row">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            Library
                        </Text>
                        <Text className="text-muted-foreground text-sm mt-0.5">Review your past attempts and saved questions</Text>
                    </View>
                </View>

                <View className="flex bg-muted/50 p-1 rounded-xl mb-6 flex-row">
                    <View
                        onPress={() => setActiveTab('solved')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'solved' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Solved
                    </View>
                    <View
                        onPress={() => setActiveTab('saved')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'saved' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Saved
                    </View>
                </View>

                {/* Content */}
                {loading ? (
                    <View className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <View key={i} className="w-full h-40 bg-background rounded-3xl border border-border animate-pulse"></View>
                        ))}
                    </View>
                ) : err ? (
                    <View className="py-10 text-center text-sm text-red-600">Error loading questions — {err}</View>
                ) : !displayQuestions || displayQuestions.length === 0 ? (
                    <View className="text-center py-20 bg-background rounded-3xl border border-border shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100/50 dark:border-emerald-800/50 flex-row">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </View>
                        <Text className="text-lg font-bold text-foreground mb-1">No questions {activeTab} yet</Text>
                        <Text className="text-muted-foreground text-sm max-w-sm mx-auto p-4">
                            {activeTab === 'solved' 
                                ? "When you attempt multiple-choice or written questions, they will appear here along with your AI review breakdown."
                                : "Tap the bookmark icon on any question to save it for later review."}
                        </Text>
                        <View
                            onPress={() => router.push('/feed')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                        >
                            Browse feed
                        </View>
                    </View>
                ) : (
                    <View className="space-y-4 animate-in fade-in duration-300">
                        {displayQuestions.map((q) => (
                            <QuestionCard key={`${activeTab}-${q.id}`} q={q} />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
