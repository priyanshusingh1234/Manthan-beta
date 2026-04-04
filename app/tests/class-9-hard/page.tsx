"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, BarChart2, Share2, Target, RotateCcw } from 'lucide-react';
import { getClientAppUrl } from '@/lib/appUrl';

type Question = {
  id: string;
  title: string;
  options: string[];
  correct_option: number;
  subject: string;
};

export default function TestYourselfPage() {
  const router = useRouter();
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
        const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
        
        // 1. Check for legacy/server-side completion first
        if (session) {
            const resResults = await fetch('/api/test/results?testId=class-9-hard', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const resultData = await resResults.json();
            
            if (resultData.hasSubmission) {
                // If it was already completed, we bypass the test and show the results!
                // NOTE: We'll need the snapshot to render the breakdown. 
                // For now, we'll set basic stats if snapshot is missing.
                const snap = resultData.summary.metadata?.answers_snapshot || [];
                
                // Reconstruct a minimalist question pool if we don't have the full snapshot yet
                // For existing ones, we'll just show the summary stats if breakdown details are unavailable.
                setIsSubmitted(true);
                setTimeTaken(resultData.summary.time_taken);
                
                // If we have a snapshot from my new API, we can actually reconstruct the whole breakdown!
                // We'll populate some 'mock' questions for the analysis screen to consume
                if (snap.length > 0) {
                   setQuestions(snap.map((s: any) => ({
                       id: s.questionId,
                       title: s.title || "Elite Gauntlet Question",
                       options: s.options || ["Correct Answer"], // placeholder
                       correct_option: 0, // mock so it calculates correctness correctly
                       subject: 'Excellence'
                   })));
                   // Set answers so breakdown works
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

        // 2. Otherwise, fetch a NEW test challenge
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
  }, []);

  // Timer logic
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

  // Audio Control Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2; // low volume
      if (!loading && !error && !isSubmitted && playCount.current < 3) {
        // Attempt to autoplay
        audioRef.current.play().catch(e => console.log("Audio autoplay blocked by browser:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [loading, error, isSubmitted]);

  const handleAudioEnded = () => {
    playCount.current += 1;
    if (playCount.current < 3) {
      if (audioRef.current && !loading && !error && !isSubmitted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio replay blocked:", e));
      }
    }
  };

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(c => c + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(c => c - 1);
  };

  const handleSubmit = async () => {
    const elapsed = 3600 - timeLeft;
    setTimeTaken(elapsed);
    setIsSubmitted(true);
    
    // --- RECORDING IN ARENA ARCHIVES ---
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

        const totalScore = correctCount * 3;
        const maxScore = questions.length * 3;
        const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

        await fetch('/api/test/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                testId: 'class-9-hard',
                answers: attempts,
                score: totalScore,
                maxScore,
                timeTaken: elapsed,
                accuracy
            })
        });
        
        // Prevent retakes by setting localStorage AFTER successful submission
        if (typeof window !== 'undefined') {
            localStorage.setItem('dheeyudha_class9_hard_test_completed', 'true');
        }
    } catch (e) {
        console.error('[ARENA] System Sync Failure:', e);
    }
  };

  const handleShare = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option) score += 3;
    });

    const shareText = `I just scored ${score} / ${questions.length * 3} on the Ultimate Class 9 Hard Gauntlet at Dheeyudha! Can you beat my score? 🧠🔥\n${getClientAppUrl()}/test/class-9-hard`;
    
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({
            title: 'Dheeyudha Test Challenge',
            text: shareText,
            dialogTitle: 'Share your Gauntlet Results'
        });
      } else if (navigator.share) {
        await navigator.share({
            title: 'Dheeyudha Test Challenge',
            text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Result copied to clipboard!');
      }
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-indigo-600 dark:text-indigo-400 animate-pulse tracking-widest uppercase text-sm md:text-base">Initializing Gauntlet...</p>
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
          <button onClick={() => router.push('/')} className="mt-6 w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl active:scale-95 transition-transform">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ANALYSIS SCREEN
  // ---------------------------------------------------------------------------
  if (isSubmitted) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q, idx) => {
      if (answers[idx] === undefined) unattemptedCount++;
      else if (answers[idx] === q.correct_option) correctCount++;
      else incorrectCount++;
    });

    const totalScore = correctCount * 3;
    const maxScore = questions.length * 3;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;

    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center relative p-6 sm:p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl md:shadow-2xl">
            <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/10 blur-[80px] rounded-full hidden sm:block" />
            <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/10 blur-[80px] rounded-full hidden sm:block" />
            
            <Trophy className="w-14 h-14 md:w-16 md:h-16 text-yellow-500 mx-auto mb-4 drop-shadow-md md:drop-shadow-lg" />
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-3 md:mb-4 text-slate-900 dark:text-white">
              Test Complete
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto text-sm md:text-base">
              You braved the ultimate Gauntlet. Here is your detailed combat analysis.
            </p>

            <div className="mt-8 md:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
              <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-500 dark:text-indigo-400 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{totalScore}</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">Score / {maxScore}</p>
              </div>
              <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">{accuracy}%</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">Accuracy</p>
              </div>
              <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">{mins}m {secs}s</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">Time Taken</p>
              </div>
              <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800">
                <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-red-500 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-400">{incorrectCount}</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">Incorrect</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 relative z-10">
              <button 
                onClick={handleShare} 
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:hover:bg-indigo-500 dark:active:bg-indigo-600 text-white transition-all rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                Share Analysis
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest text-slate-700 dark:text-slate-300"
              >
                Return to Hub
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2 md:pt-4">
            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-widest px-2 text-slate-800 dark:text-slate-300">Detailed Breakdown</h3>
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isUnattempted = userAns === undefined;
              const isCorrect = userAns === q.correct_option;

              return (
                <div key={q.id} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 ${isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : isUnattempted ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'} shadow-sm`}>
                  <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-sm md:text-base">
                      <span className="font-black text-slate-900 dark:text-white mr-2">Q{idx + 1}.</span> {q.title}
                    </p>
                    <div className="shrink-0 mt-0.5">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" /> : isUnattempted ? <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full" /> : <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 md:mt-4">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOpt = optIdx === q.correct_option;
                      const isSelected = optIdx === userAns;
                      
                      let styleClasses = "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400";
                      
                      if (isCorrectOpt) {
                        styleClasses = "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400 font-bold dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                      } else if (isSelected && !isCorrectOpt) {
                        styleClasses = "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400";
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${styleClasses}`}>
                          <span className="text-xs md:text-sm break-words flex-1 pr-2">{opt}</span>
                          {isSelected && <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-80 shrink-0">Your Ans</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ACTIVE TEST
  // ---------------------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  
  // Navigation blocks array
  const blocks = questions.map((_, idx) => {
    const isAnswered = answers[idx] !== undefined;
    const isActive = idx === currentIndex;
    return (
      <button
        key={idx}
        onClick={() => setCurrentIndex(idx)}
        className={`w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-xl font-black text-xs transition-all ${
          isActive 
            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' 
            : isAnswered 
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' 
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {idx + 1}
      </button>
    );
  });

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans overflow-hidden">
      <audio ref={audioRef} src="/OPPENHEIMER _ Can You Hear The Music [4K].mp3" onEnded={handleAudioEnded} />
      
      {/* Top Header */}
      <header className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-3 md:p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm uppercase tracking-widest ${timeLeft < 300 ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.5px]" />
              <span className="w-10 md:w-11 text-center font-mono tracking-tighter">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
            {/* Minimal counter for mobile header */}
            <span className="text-[10px] md:hidden font-bold uppercase text-slate-400">
               {currentIndex + 1} / {questions.length}
            </span>
          </div>
          
          <button onClick={handleSubmit} className="px-4 py-2 md:px-6 md:py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-lg md:rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95">
            Submit
          </button>
        </div>
      </header>

      {/* Main Question Area - Scrollable */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 flex flex-col pb-24 md:pb-8 relative">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* Progress Stats (Desktop mostly, mobile has minimal in header) */}
          <div className="hidden md:flex items-center justify-between mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Object.keys(answers).length} Attempted</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl md:rounded-[2rem] p-5 sm:p-6 md:p-10 shadow-sm md:shadow-xl relative overflow-hidden mb-6 md:mb-8 shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full hidden md:block" />
            
            <h2 className="text-lg md:text-2xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 relative z-10 selection:bg-indigo-200 dark:selection:bg-indigo-500/30">
              {currentQ.title}
            </h2>

            <div className="mt-6 md:mt-8 space-y-3 relative z-10">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentIndex] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-3.5 md:p-5 rounded-[1.25rem] border-2 transition-all duration-200 flex items-center gap-3 md:gap-4 group ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 dark:border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] dark:shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-700 active:bg-slate-100 dark:active:bg-slate-900 outline-none'
                    }`}
                  >
                     <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-slate-300'}`}>
                       {String.fromCharCode(65 + oIdx)}
                     </div>
                     <span className="font-medium text-sm md:text-base leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls (Floating safely inside scroll container, pushed bottom by flex-1 if content is short) */}
          <div className="flex items-center justify-between gap-3 md:gap-4 mt-auto pt-4 md:pt-0 shrink-0 mb-6 md:mb-0">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="flex-1 md:flex-none px-4 md:px-6 py-3.5 md:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-[1.25rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 flex justify-center items-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              Prev
            </button>
            <button 
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
               className="flex-1 md:flex-none px-4 md:px-6 py-3.5 md:py-4 bg-indigo-600 dark:bg-indigo-600 border border-indigo-600 dark:border-indigo-500 text-white rounded-[1.25rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Next
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* App-like Map Bar at Bottom */}
      <footer className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-3 overflow-x-auto no-scrollbar shadow-[0_-4px_20px_rgba(0,0,0,0.02)] dark:shadow-none z-50">
        <div className="flex gap-1.5 md:gap-2 min-w-max px-1 pb-1 items-center justify-start">
          {blocks}
        </div>
      </footer>
    </div>
  );
}
