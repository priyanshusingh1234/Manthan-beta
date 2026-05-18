'use client';

import React, { useEffect, useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SolvedQuestionsPage() {
    const [questions, setQuestions] = useState<any[] | null>(null);
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

                const headers: HeadersInit = { 'Authorization': `Bearer ${session.access_token}` };
                const endpoint = activeTab === 'solved' ? '/api/questions/solved' : '/api/questions/saved';
                const res = await fetch(endpoint, { headers });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();

                if (!mounted) return;
                setQuestions(Array.isArray(data) ? data : []);
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
    }, [router, activeTab]);

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 text-foreground" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            Library
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Review your past attempts and saved questions</p>
                    </div>
                </div>

                <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('solved')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'solved' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Solved
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'saved' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Saved
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-40 bg-background rounded-3xl border border-border animate-pulse"></div>
                        ))}
                    </div>
                ) : err ? (
                    <div className="py-10 text-center text-sm text-red-600">Error loading solved questions — {err}</div>
                ) : !questions || questions.length === 0 ? (
                    <div className="text-center py-20 bg-background rounded-3xl border border-border shadow-sm">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100/50 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No questions {activeTab} yet</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto p-4">
                            {activeTab === 'solved' 
                                ? "When you attempt multiple-choice or written questions, they will appear here along with your AI review breakdown."
                                : "Tap the bookmark icon on any question to save it for later review."}
                        </p>
                        <button
                            onClick={() => router.push('/feed')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                        >
                            Browse feed
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <QuestionCard key={q.id} q={q} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
