"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, BarChart2, Share2, Target, RotateCcw } from 'lucide-react';

type Question = {
  id: string;
  title: string;
  options: string[];
  correct_option: number;
  subject: string;
};

export default function TestYourselfPage() {
  const router = useRouter();
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

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(c => c + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(c => c - 1);
  };

  const handleSubmit = () => {
    setTimeTaken(3600 - timeLeft);
    setIsSubmitted(true);
  };

  const handleShare = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option) score += 3;
    });

    const shareText = `I just scored ${score} / ${questions.length * 3} on the Ultimate Class 9 Hard Gauntlet at Dheeyudha! Can you beat my score? 🧠🔥\nhttps://dheeyudhha-pi.vercel.app/test/class-9-hard`;
    
    try {
      if (navigator.share) {
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-indigo-400 animate-pulse tracking-widest uppercase">Initializing Gauntlet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-6">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black mb-2 text-red-400">Gauntlet Failed</h2>
          <p className="text-slate-400">{error}</p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-white text-black font-bold rounded-xl">Return Home</button>
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
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center relative p-8 md:p-12 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
            
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">
              Test Complete
            </h1>
            <p className="text-slate-400 font-medium max-w-lg mx-auto">
              You braved the ultimate Gauntlet. Here is your detailed combat analysis.
            </p>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800">
                <Target className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-white">{totalScore}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score / {maxScore}</p>
              </div>
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-emerald-400">{accuracy}%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Accuracy</p>
              </div>
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800">
                <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-amber-400">{mins}m {secs}s</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Time Taken</p>
              </div>
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800">
                <BarChart2 className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-red-400">{incorrectCount}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Incorrect</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleShare} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
                <Share2 className="w-5 h-5" />
                Share Analysis
              </button>
              <button onClick={() => router.push('/')} className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-2xl font-black text-sm uppercase tracking-widest text-slate-300">
                Return to Hub
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-2xl font-black italic uppercase tracking-widest px-2 text-slate-300">Detailed Breakdown</h3>
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isUnattempted = userAns === undefined;
              const isCorrect = userAns === q.correct_option;

              return (
                <div key={q.id} className={`p-6 rounded-3xl border-2 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : isUnattempted ? 'bg-slate-900 border-slate-800' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <p className="text-slate-300 font-medium leading-relaxed">
                      <span className="font-black text-white mr-2">Q{idx + 1}.</span> {q.title}
                    </p>
                    <div className="shrink-0">
                      {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : isUnattempted ? <div className="w-6 h-6 border-2 border-slate-600 rounded-full" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOpt = optIdx === q.correct_option;
                      const isSelected = optIdx === userAns;
                      
                      let styleClasses = "bg-slate-950 border-slate-800 text-slate-400";
                      
                      if (isCorrectOpt) {
                        styleClasses = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                      } else if (isSelected && !isCorrectOpt) {
                        styleClasses = "bg-red-500/10 border-red-500/50 text-red-400";
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${styleClasses}`}>
                          <span className="text-sm">{opt}</span>
                          {isSelected && <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Ans</div>}
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
        className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl font-black text-xs transition-all ${
          isActive 
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' 
            : isAnswered 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800'
        }`}
      >
        {idx + 1}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest ${timeLeft < 300 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-900 text-slate-300'}`}>
              <Clock className="w-4 h-4" />
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
          
          <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Question Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Stats */}
          <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Object.keys(answers).length} Attempted</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
            
            <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-slate-200 relative z-10">
              {currentQ.title}
            </h2>

            <div className="mt-8 space-y-3 relative z-10">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentIndex] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                       {String.fromCharCode(65 + oIdx)}
                     </div>
                     <span className="font-medium text-sm md:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="flex-1 md:flex-none px-6 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Prev
            </button>
            <button 
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
               className="flex-1 md:flex-none px-6 py-4 bg-indigo-600 border border-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Map Bar at Bottom */}
      <footer className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max px-2 pb-2">
          {blocks}
        </div>
      </footer>
    </div>
  );
}
