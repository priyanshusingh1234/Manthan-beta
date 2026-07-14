"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 20;

function normalizeForCard(q: any) {
  const parsedOptions = (() => {
    try {
      if (typeof q.options === 'string') return JSON.parse(q.options);
      return q.options || null;
    } catch { return null; }
  })();

  const profile = q.profiles || null;

  return {
    ...q,
    id: String(q.id),
    title: q.title || q.question_text || 'Question',
    body: q.body || null,
    subject: q.subject || 'General',
    chapter: q.chapter || null,
    classGrade: q.class_grade || q.classGrade || null,
    points: q.points || 5,
    timeLimit: q.time_limit || q.timeLimit || 60,
    difficulty: q.difficulty || null,
    options: parsedOptions,
    correctOption: q.correct_option ?? q.correctOption ?? null,
    questionType: q.question_type || q.questionType || 'mcq',
    matchPairs: (() => {
      try {
        if (typeof q.match_pairs === 'string') return JSON.parse(q.match_pairs);
        return q.match_pairs || null;
      } catch { return null; }
    })(),
    imageUrl: q.image_url || q.imageUrl || null,
    imagePath: q.image_path || q.imagePath || null,
    hasAttempted: q.hasAttempted || false,
    hasFailed: q.hasFailed || false,
    totalAttempts: 0,
    solvedCount: 0,
    profiles: profile,
    createdByName: profile?.full_name || 'Teacher',
    createdByAvatar: profile?.avatar_url || null,
    createdByUsername: profile?.username || null,
    createdByIsTeacher: profile?.is_teacher ?? true,
    _feedLabel: q.hasAttempted ? '✅ Solved' : '📖 Practice',
    _feedScore: 0,
  };
}

export default function PracticeQuestionsScreen({ params }: { params: { chapter: string } }) {
  const chapter = decodeURIComponent(params.chapter);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);

  const fetchPage = useCallback(async (cursor: string | null) => {
    if (!chapter) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams({
        chapter,
        limit: String(PAGE_SIZE),
        ...(cursor ? { cursor } : {}),
      });

      const res = await fetch(`/api/practice/questions?${params}`, { headers });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const normalized = (data.questions || []).map(normalizeForCard);

      setQuestions(prev => {
        const existingIds = new Set(prev.map(q => q.id));
        const unique = normalized.filter((q: any) => !existingIds.has(q.id));
        return cursor ? [...prev, ...unique] : unique;
      });

      cursorRef.current = data.nextCursor || null;
      setHasMore(!!data.hasMore);
    } catch (e: any) {
      console.error('Error fetching practice questions:', e);
    }
  }, [chapter]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      cursorRef.current = null;
      await fetchPage(null);
      setLoading(false);
    }
    init();
  }, [fetchPage]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    await fetchPage(cursorRef.current);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 pt-8">
      {/* Header */}
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 mb-6 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold text-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          All Chapters
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {chapter}
            </h1>
            {!loading && (
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                {questions.length} questions loaded {hasMore ? '· scroll for more' : '· all loaded'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-500 font-bold text-lg">No questions found</p>
            <p className="text-slate-400 text-sm mt-2 text-center max-w-sm">
              Check back later, teachers are always adding new questions for this chapter!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map(q => (
              <QuestionCard key={q.id} q={q} />
            ))}

            {hasMore && (
              <div className="py-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
            
            {!hasMore && questions.length > 0 && (
              <div className="py-12 flex justify-center">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full">
                  ✅ You've reached the end
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
