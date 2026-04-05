"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, BarChart2, Share2, Target, RotateCcw } from 'lucide-react';
import { getClientAppUrl } from '@/lib/appUrl';
import TestLeaderboard from '@/components/TestLeaderboard';

type Question = {
  id: string;
  title: string;
  options: string[];
  correct_option: number;
  subject: string;
};

function TestYourselfPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('view') === 'records';
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const playCount = React.useRef(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // index -> selected option index
  
  // 60 minutes = 3600 seconds
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);

  useEffect(() => {
    async function fetchTest() {
      try {
        // If the user just wants to view records (clicked the trophy icon in the Hub)
        if (viewOnly) {
           setIsSubmitted(true);
           setLoading(false);
           // Try to load any existing summary for the breakdown if available
           const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
           if (session) {
                const resResults = await fetch('/api/test/results?testId=class-9-hard', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const resultData = await resResults.json();
                if (resultData.hasSubmission) {
                    const snap = resultData.summary.metadata?.answers_snapshot || [];
                    setTimeTaken(resultData.summary.time_taken);
                    if (snap.length > 0) {
                        setQuestions(snap.map((s: any) => ({
                            id: s.questionId,
                            title: s.title || "Elite Gauntlet Question",
                            options: s.options || ["Correct Answer"],
                            correct_option: 0,
                            subject: 'Excellence'
                        })));
                        const ansMap: Record<number, number> = {};
                        snap.forEach((s: any, i: number) => {
                            if (s.isCorrect) ansMap[i] = 0;
                            else ansMap[i] = 1;
                        });
                        setAnswers(ansMap);
                    }
                }
           }
           return;
        }

        // 1. Fast-path: check localStorage first (instant, no network round-trip)
        if (typeof window !== 'undefined' && localStorage.getItem('dheeyudha_class9_hard_test_completed') === 'true') {
            const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
            if (session) {
                const resResults = await fetch('/api/test/results?testId=class-9-hard', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const resultData = await resResults.json();
                if (resultData.hasSubmission) {
                    const snap = resultData.summary.metadata?.answers_snapshot || [];
                    setIsSubmitted(true);
                    setTimeTaken(resultData.summary.time_taken);
                    if (snap.length > 0) {
                        setQuestions(snap.map((s: any) => ({
                            id: s.questionId,
                            title: s.title || "Elite Gauntlet Question",
                            options: s.options || ["Correct Answer"],
                            correct_option: 0,
                            subject: 'Excellence'
                        })));
                        const ansMap: Record<number, number> = {};
                        snap.forEach((s: any, i: number) => {
                            if (s.isCorrect) ansMap[i] = 0;
                            else ansMap[i] = 1;
                        });
                        setAnswers(ansMap);
                    }
                    setLoading(false);
                    return;
                }
            }
            setIsSubmitted(true);
            setLoading(false);
            return;
        }

        const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();

        if (session) {
            const resResults = await fetch('/api/test/results?testId=class-9-hard', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const resultData = await resResults.json();

            if (resultData.hasSubmission) {
                const snap = resultData.summary.metadata?.answers_snapshot || [];
                setIsSubmitted(true);
                setTimeTaken(resultData.summary.time_taken);
                if (snap.length > 0) {
                    setQuestions(snap.map((s: any) => ({
                        id: s.questionId,
                        title: s.title || "Elite Gauntlet Question",
                        options: s.options || ["Correct Answer"],
                        correct_option: 0,
                        subject: 'Excellence'
                    })));
                    const ansMap: Record<number, number> = {};
                    snap.forEach((s: any, i: number) => {
                        if (s.isCorrect) ansMap[i] = 0;
                        else ansMap[i] = 1;
                    });
                    setAnswers(ansMap);
                }
                if (typeof window !== 'undefined') {
                    localStorage.setItem('dheeyudha_class9_hard_test_completed', 'true');
                }
                setLoading(false);
                return;
            }
        }

        const res = await fetch('/api/test/generate?classGrade=9&limit=40');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!data.test || data.test.length === 0) throw new Error("Not enough questions found.");
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
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
      if (!loading && !error && !isSubmitted && playCount.current < 3) {
        audioRef.current.play().catch(e => console.log("Audio playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [loading, error, isSubmitted]);

  const handleAudioEnded = () => {
    playCount.current += 1;
    if (playCount.current < 3 && audioRef.current && !loading && !error && !isSubmitted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio replay blocked:", e));
    }
  };

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(c => c + 1); };
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(c => c - 1); };

  const handleSubmit = async () => {
    const elapsed = 3600 - timeLeft;
    setTimeTaken(elapsed);
    setIsSubmitted(true);
    try {
        const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
        if (!session) return;

        let correctCount = 0;
        const attempts = questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correct_option;
            if (isCorrect) correctCount++;
            return {
                questionId: q.id,
                title: q.title,
                options: q.options,
                isCorrect: isCorrect,
                selectedOption: answers[idx]
            };
        });

        await fetch('/api/test/submit', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testId: 'class-9-hard',
                answers: attempts,
                score: correctCount * 3,
                maxScore: questions.length * 3,
                timeTaken: elapsed,
                accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
            })
        });
        if (typeof window !== 'undefined') localStorage.setItem('dheeyudha_class9_hard_test_completed', 'true');
    } catch (e) {
        console.error('[ARENA] System Sync Failure:', e);
    }
  };

  const handleShare = async () => {
    let score = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correct_option) score += 3; });
    const shareText = `I just scored ${score} / ${questions.length * 3} on the Ultimate Class 9 Hard Gauntlet at Dheeyudha! Can you beat my score? 🧠🔥\n${getClientAppUrl()}/tests/class-9-hard`;
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({ title: 'Dheeyudha Test Challenge', text: shareText, dialogTitle: 'Share your Gauntlet Results' });
      } else if (navigator.share) {
        await navigator.share({ title: 'Dheeyudha Test Challenge', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Result copied to clipboard!');
      }
    } catch (e) { console.log('Share failed', e); }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-indigo-600 dark:text-indigo-400 animate-pulse tracking-widest uppercase text-sm">Initializing Gauntlet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white p-6">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-lg">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black mb-2 text-red-600 dark:text-red-400">Gauntlet Failed</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
          <button onClick={() => router.push('/')} className="mt-6 w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl active:scale-95 transition-transform">Return Home</button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    let correctCount = 0;
    let incorrectCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correct_option) correctCount++;
      else if (answers[idx] !== undefined) incorrectCount++;
    });
    const totalScore = correctCount * 3;
    const maxScore = questions.length * 3;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;

    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center relative p-6 sm:p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl">
            <Trophy className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">Test Complete</h1>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Target className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                <p className="text-2xl font-black">{totalScore}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score / {maxScore}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-emerald-600">{accuracy}%</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Accuracy</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-amber-600">{mins}m {secs}s</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Time</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <BarChart2 className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-red-600">{incorrectCount}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Incorrect</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleShare} className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">Share Analysis</button>
              <button onClick={() => router.push('/')} className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xs uppercase tracking-widest">Return Hub</button>
            </div>
          </div>
          <div className="space-y-4">
            {questions.length > 0 && <h3 className="text-xl font-black italic uppercase tracking-widest px-2">Detailed Breakdown</h3>}
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isCorrect = userAns === q.correct_option;
              return (
                <div key={q.id} className={`p-4 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : userAns === undefined ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'}`}>
                  <p className="text-sm font-medium mb-4"><span className="font-black mr-2">Q{idx + 1}.</span> {q.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`p-3 rounded-xl border text-xs flex justify-between ${optIdx === q.correct_option ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 text-emerald-800 font-bold' : optIdx === userAns ? 'bg-red-50 dark:bg-red-500/10 border-red-300 text-red-700' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-600'}`}>
                        <span>{opt}</span>
                        {optIdx === userAns && <span className="font-black uppercase text-[8px] opacity-60">Your Ans</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <TestLeaderboard testId="class-9-hard" />
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  
  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden">
      <audio ref={audioRef} src="/OPPENHEIMER _ Can You Hear The Music [4K].mp3" onEnded={handleAudioEnded} />
      <header className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
              <Clock className="w-4 h-4" />
              <span>{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
            </div>
          </div>
          <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl">Submit</button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col pb-24">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm mb-8">
            <h2 className="text-lg md:text-2xl font-medium leading-relaxed">{currentQ.title}</h2>
            <div className="mt-8 space-y-3">
              {currentQ.options.map((opt, oIdx) => (
                <button key={oIdx} onClick={() => handleSelectOption(oIdx)} className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 ${answers[currentIndex] === oIdx ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 hover:border-indigo-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${answers[currentIndex] === oIdx ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{String.fromCharCode(65 + oIdx)}</div>
                  <span className="font-medium text-sm md:text-base">{opt}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mt-auto">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 flex justify-center items-center gap-2">Prev</button>
            <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 flex justify-center items-center gap-2">Next</button>
          </div>
        </div>
      </main>
      <footer className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max px-1">
          {questions.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs ${idx === currentIndex ? 'bg-indigo-600 text-white' : answers[idx] !== undefined ? 'bg-emerald-100 text-emerald-700' : 'bg-white dark:bg-slate-900 border border-slate-200 text-slate-500'}`}>{idx + 1}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default function SuspenseWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    }>
      <TestYourselfPage />
    </Suspense>
  );
}
