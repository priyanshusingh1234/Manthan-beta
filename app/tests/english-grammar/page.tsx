"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, BarChart2, Share2, Target, BookOpen } from 'lucide-react';
import { getClientAppUrl } from '@/lib/appUrl';
import TestLeaderboard from '@/components/TestLeaderboard';

const TEST_ID = 'english-grammar-hard';
const STORAGE_KEY = (userId: string) => `dheeyudha_english_grammar_${userId}_completed`;

type Question = {
  id: string;
  title: string;
  options: string[];
  correct_option: number;
  subject: string;
};

function EnglishGrammarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('view') === 'records';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    async function fetchTest() {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();

        if (viewOnly) {
          setIsSubmitted(true);
          setLoading(false);
          return;
        }

        const userId = session?.user?.id;

        // Fast-path removed — DB is single source of truth

        // Server-side check only
        if (session && userId) {
          const res = await fetch(`/api/test/results?testId=${TEST_ID}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          const data = await res.json();
          if (data.hasSubmission) {
            setIsSubmitted(true);
            setLoading(false);
            return;
          }
        }

        // Fetch 40 hard English Grammar questions
        const res = await fetch('/api/test/generate?subject=english&difficulty=hard&limit=40');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setQuestions(data.test);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [viewOnly]);

  useEffect(() => {
    if (loading || isSubmitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitted]);

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleSubmit = async () => {
    const elapsed = 3600 - timeLeft;
    setTimeTaken(elapsed);
    // Do NOT setIsSubmitted yet — wait for DB confirmation
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      let correct = 0;
      let incorrect = 0;
      const attempts = questions.map((q, idx) => {
        const isCorrect = answers[idx] === q.correct_option;
        if (isCorrect) correct++; else if (answers[idx] !== undefined) incorrect++;
        return { questionId: q.id, title: q.title, options: q.options, isCorrect, selectedOption: answers[idx] ?? null };
      });

      setCorrectCount(correct);
      setIncorrectCount(incorrect);

      const submitRes = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: TEST_ID,
          answers: attempts,
          score: correct * 3,
          maxScore: questions.length * 3,
          timeTaken: elapsed,
          accuracy: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
        })
      });
      const submitData = await submitRes.json();
      console.log('[GRAMMAR] Submit:', submitData);

      if (!submitRes.ok) {
        const errMsg = submitData?.error || 'Unknown error';
        alert(`⚠️ Score sync failed: ${errMsg}\nPlease screenshot your score.`);
        return;
      }

      // Only mark as done AFTER DB confirms the save
      setIsSubmitted(true);
    } catch (e: any) {
      console.error('[GRAMMAR] Submit error:', e);
      alert(`⚠️ Network error: ${e.message}\nPlease try submitting again.`);
    }
  };


  const handleShare = async () => {
    const score = correctCount * 3;
    const max = questions.length * 3;
    const text = `I scored ${score}/${max} on the English Grammar Gauntlet at Dheeyudha! Think you can beat me? 📚🔥\n${getClientAppUrl()}/tests/english-grammar`;
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({ title: 'English Grammar Gauntlet', text, dialogTitle: 'Share Results' });
      } else if (navigator.share) {
        await navigator.share({ title: 'English Grammar Gauntlet', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } catch (e) { console.log('Share error', e); }
  };

  // ── LOADING ──
  if (loading) return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-bold text-emerald-600 dark:text-emerald-400 animate-pulse tracking-widest uppercase text-sm">Preparing Grammar Gauntlet...</p>
    </div>
  );

  // ── ERROR ──
  if (error) return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-black mb-2 text-red-600">Gauntlet Unavailable</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <p className="text-xs text-slate-400 mb-4">Make sure English Grammar questions with 'hard' difficulty are added to the question bank first.</p>
        <button onClick={() => router.push('/tests')} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl">Return to Arena</button>
      </div>
    </div>
  );

  // ── SUBMITTED / VIEW RECORDS ──
  if (isSubmitted) {
    const totalScore = correctCount * 3;
    const maxScore = questions.length * 3;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;

    // If viewOnly or no questions loaded (returning user), show Hall of Fame only
    if (viewOnly || questions.length === 0) {
      return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8 flex items-center justify-center">
          <div className="max-w-xl w-full text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Hall of Fame</h1>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full inline-block border border-emerald-200/50">
                English Grammar Gauntlet
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
              <TestLeaderboard testId={TEST_ID} />
            </div>
            <button onClick={() => router.push('/tests')} className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
              Exit
            </button>
          </div>
        </div>
      );
    }

    // Results screen after finishing
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8 pb-32 flex justify-center">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl">
            <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Grammar Gauntlet Result</h1>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Target className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-black">{totalScore} <span className="text-[10px] text-slate-400">/ {maxScore}</span></p>
                <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Score</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-black text-emerald-500">{accuracy}%</p>
                <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Accuracy</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleShare} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Share</button>
              <button onClick={() => router.push('/tests')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest">Return to Hub</button>
            </div>
          </div>
          <div><TestLeaderboard testId={TEST_ID} /></div>
        </div>
      </div>
    );
  }

  // ── ACTIVE TEST UI ──
  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
            <Clock className="w-4 h-4" />
            <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">English Grammar</span>
          </div>
          <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl">Submit</button>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col pb-24">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Question {currentIndex + 1} of {questions.length}</p>
            <h2 className="text-lg md:text-xl font-medium leading-relaxed">{currentQ.title}</h2>
            <div className="mt-8 space-y-3">
              {currentQ.options.map((opt, oIdx) => (
                <button key={oIdx} onClick={() => handleSelectOption(oIdx)} className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-[0.98] ${answers[currentIndex] === oIdx ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 hover:border-emerald-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${answers[currentIndex] === oIdx ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span className="font-medium text-sm">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-auto">
            <button onClick={() => setCurrentIndex(c => c - 1)} disabled={currentIndex === 0} className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 flex justify-center items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => setCurrentIndex(c => c + 1)} disabled={currentIndex === questions.length - 1} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 flex justify-center items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Question Palette */}
      <footer className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max px-1">
          {questions.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${idx === currentIndex ? 'bg-emerald-600 text-white' : answers[idx] !== undefined ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'}`}>
              {idx + 1}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default function EnglishGrammarGauntlet() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EnglishGrammarPage />
    </Suspense>
  );
}
