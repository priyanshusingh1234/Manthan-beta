"use client";

import React, { useEffect, useState } from 'react';
import QuestionCard from './QuestionCard';
import { supabase } from '@/lib/supabaseClient';

type Question = any;

export default function QuestionsFeed() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const res = await fetch('/api/questions', { headers });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!mounted) return;
        setQuestions(Array.isArray(data) ? data : (data?.questions || []));
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
  }, []);

  if (loading) return <div className="py-6">Loading questions…</div>;
  if (err) return <div className="py-6 text-sm text-red-600">Error loading questions — {err}</div>;
  if (!questions || questions.length === 0) return <div className="py-6 text-sm text-slate-500">No questions yet — create the first one!</div>;

  return (
    <div className="space-y-4">
      {questions.map((q: Question) => (
        <QuestionCard key={q.id} q={q} />
      ))}
    </div>
  );
}
