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
                const res = await fetch('/api/questions/solved', { headers });
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
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            Solved Questions
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">Review your past attempts and breakdowns</p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-40 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : err ? (
                    <div className="py-10 text-center text-sm text-red-600">Error loading solved questions — {err}</div>
                ) : !questions || questions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100/50">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No questions solved perfectly yet</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto p-4">When you attempt multiple-choice or written questions, they will appear here along with your AI review breakdown.</p>
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
