"use client";

import React, { useEffect, useState } from 'react';
import QuestionCard from './QuestionCard';

type Question = any;

export default function QuestionsFeed() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/questions')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        // API returns either an array (prod) or an object with `questions` (older fallback);
        setQuestions(Array.isArray(data) ? data : (data?.questions || []));
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        setErr(error?.message || String(error));
      })
      .finally(() => mounted && setLoading(false));

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
