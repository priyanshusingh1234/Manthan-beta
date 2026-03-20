"use client";

import React, { useEffect, useState, useCallback } from 'react';
import QuestionCard from './QuestionCard';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, RefreshCw } from 'lucide-react';

type Question = any;

export default function QuestionsFeed() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Add a cache-busting timestamp so the server reshuffles the feed
      const res = await fetch(`/api/feed?t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data?.questions || []));
    } catch (error: any) {
      console.error(error);
      setErr(error?.message || String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Building your personalised feed…</span>
      </div>
    );
  }

  if (err) return <div className="py-6 text-sm text-red-600">Error loading feed — {err}</div>;

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex items-center justify-between pb-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {questions?.length ?? 0} questions tailored for you
        </p>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Shuffling…' : 'Shuffle Feed'}
        </button>
      </div>

      {(!questions || questions.length === 0) ? (
        <div className="py-6 text-sm text-slate-500">No questions yet — create the first one!</div>
      ) : (
        questions.map((q: Question) => (
          <div key={`${q.id}-${Date.now()}`} className="space-y-1">
            {/* Feed context label — e.g. "✨ For You", "🔥 Everyone's Struggling With This" */}
            {q._feedLabel && (
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-1 tracking-wide">
                {q._feedLabel}
              </p>
            )}
            <QuestionCard q={q} />
          </div>
        ))
      )}
    </div>
  );
}
