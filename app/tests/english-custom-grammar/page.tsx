"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share as CapShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, Target, BookOpen } from 'lucide-react';
import { getClientAppUrl } from '@/lib/appUrl';
import TestLeaderboard from '@/components/TestLeaderboard';

const TEST_ID = 'english-custom-grammar';

const CUSTOM_QUESTIONS = [
  // Voice (Active/Passive)
  { id: "q1", title: "Change to active voice: 'The letter should have been written by him.'", options: ["He should write the letter.", "He should have written the letter.", "He must have written the letter.", "He ought to write the letter."], correct_option: 1, subject: "english" },
  { id: "q2", title: "Change to passive voice: 'Someone has picked my pocket.'", options: ["My pocket has been picked.", "My pocket is being picked.", "My pocket had been picked.", "My pocket has been picked by someone."], correct_option: 0, subject: "english" },
  { id: "q3", title: "Change to passive: 'Who taught you French?'", options: ["By whom you were taught French?", "By whom were you taught French?", "Who were you taught French by?", "Both B and C"], correct_option: 3, subject: "english" },
  { id: "q4", title: "Change to active: 'Let the door be shut.'", options: ["Shut the door.", "You are requested to shut the door.", "Please shut the door.", "The door shut."], correct_option: 0, subject: "english" },
  { id: "q5", title: "Change to passive: 'They are building a wall.'", options: ["A wall is being built by them.", "A wall is built by them.", "A wall was being built by them.", "A wall has been built by them."], correct_option: 0, subject: "english" },
  { id: "q6", title: "Change to passive: 'One must keep one's promises.'", options: ["Promises must be kept.", "One's promises must be kept by one.", "Promises have to be kept.", "Promises should kept."], correct_option: 0, subject: "english" },
  { id: "q7", title: "Change to passive: 'The audience loudly cheered the Mayor's speech.'", options: ["The Mayor's speech was being loudly cheered by the audience.", "The Mayor's speech is loudly cheered by the audience.", "The Mayor's speech was loudly cheered by the audience.", "The Mayor's speech has been loudly cheered by the audience."], correct_option: 2, subject: "english" },
  { id: "q8", title: "Change to active: 'By whom was this jug broken?'", options: ["Who break this jug?", "Who broke this jug?", "Who broken this jug?", "Whom broke this jug?"], correct_option: 1, subject: "english" },
  { id: "q9", title: "Change to passive: 'People say that he is a spy.'", options: ["It was said that he is a spy.", "He is said to be a spy.", "It is said that he is a spy.", "Both B and C"], correct_option: 3, subject: "english" },
  { id: "q10", title: "Change to active: 'Your request will be considered.'", options: ["We will consider your request.", "We are considering your request.", "Your request is considered by us.", "They consider your request."], correct_option: 0, subject: "english" },

  // Tenses
  { id: "q11", title: "By the time I reached the station, the train ______.", options: ["left", "has left", "had left", "was leaving"], correct_option: 2, subject: "english" },
  { id: "q12", title: "I ______ for this company for five years next month.", options: ["will be working", "will have been working", "have been working", "had been working"], correct_option: 1, subject: "english" },
  { id: "q13", title: "If I ______ you, I would not accept the offer.", options: ["was", "were", "am", "had been"], correct_option: 1, subject: "english" },
  { id: "q14", title: "Scarcely had he gone out ______.", options: ["than it started raining", "when it started raining", "then it started raining", "and it started raining"], correct_option: 1, subject: "english" },
  { id: "q15", title: "He behaves as if he ______ the boss.", options: ["is", "was", "has been", "were"], correct_option: 3, subject: "english" },
  { id: "q16", title: "It is high time you ______ studying.", options: ["start", "started", "have started", "will start"], correct_option: 1, subject: "english" },
  { id: "q17", title: "No sooner ______ the station than the train left.", options: ["did I reach", "had I reached", "Both A and B", "I reached"], correct_option: 2, subject: "english" },
  { id: "q18", title: "The committee ______ divided in their opinions.", options: ["is", "are", "has", "have"], correct_option: 1, subject: "english" },
  { id: "q19", title: "I wish I ______ his name.", options: ["know", "knew", "have known", "will know"], correct_option: 1, subject: "english" },
  { id: "q20", title: "Since he _____ here, he has not made any trouble.", options: ["came", "has come", "had come", "comes"], correct_option: 0, subject: "english" },

  // Narration (Direct/Indirect)
  { id: "q21", title: "He said, 'I shall go to Delhi tomorrow.'", options: ["He said that he should go to Delhi tomorrow.", "He said that he would go to Delhi the next day.", "He said that he shall go to Delhi the next day.", "He says he would go to Delhi the next day."], correct_option: 1, subject: "english" },
  { id: "q22", title: "She said to me, 'Are you coming with us?'", options: ["She asked me if I was going with them.", "She asked me if I am coming with them.", "She asked me whether I am coming with us.", "She told me if I was going with them."], correct_option: 0, subject: "english" },
  { id: "q23", title: "He said, 'Alas! I am undone.'", options: ["He exclaimed with sorrow that he was undone.", "He said alas he is undone.", "He exclaimed that he is undone.", "He cried that he was undone."], correct_option: 0, subject: "english" },
  { id: "q24", title: "The teacher said, 'The earth revolves around the sun.'", options: ["The teacher said that the earth revolved around the sun.", "The teacher said that the earth revolves around the sun.", "The teacher asked if the earth revolves around the sun.", "The teacher told that the earth revolved around the sun."], correct_option: 1, subject: "english" },
  { id: "q25", title: "He said to him, 'Do not go there.'", options: ["He told him to not go there.", "He ordered him not to go there.", "He forbade him to go there.", "Both B and C"], correct_option: 3, subject: "english" },
  { id: "q26", title: "She said, 'Let us go for a walk.'", options: ["She proposed that they should go for a walk.", "She said that they should go for a walk.", "She suggested to go for a walk.", "She requested to let them go for a walk."], correct_option: 0, subject: "english" },
  { id: "q27", title: "John said, 'I have been working here for years.'", options: ["John said he had been working here for years.", "John said that he had been working there for years.", "John said that he has been working there for years.", "John said that he was working there for years."], correct_option: 1, subject: "english" },
  { id: "q28", title: "The captain said to the soldiers, 'March forward!'", options: ["The captain asked the soldiers to march forward.", "The captain commanded the soldiers to march forward.", "The captain told the soldiers march forward.", "The captain requested the soldiers to march forward."], correct_option: 1, subject: "english" },
  { id: "q29", title: "He said, 'What a beautiful sight!'", options: ["He exclaimed that it was a very beautiful sight.", "He exclaimed what a beautiful sight it was.", "He said that it is a beautiful sight.", "He exclaimed with joy that what a beautiful sight."], correct_option: 0, subject: "english" },
  { id: "q30", title: "My friend said to me, 'Good morning!'", options: ["My friend said good morning to me.", "My friend wished me good morning.", "My friend told me good morning.", "My friend greeted me that good morning."], correct_option: 1, subject: "english" },

  // Transformation of Sentences
  { id: "q31", title: "Change to negative: 'He is too weak to walk.'", options: ["He is so weak that he cannot walk.", "He is not too weak to walk.", "He is very weak to walk.", "He cannot walk as he is weak."], correct_option: 0, subject: "english" },
  { id: "q32", title: "Change to assertive: 'What a piece of work is man!'", options: ["Man is what a piece of work.", "Man is a great piece of work.", "Is man a great piece of work?", "Man is a good piece of work."], correct_option: 1, subject: "english" },
  { id: "q33", title: "Combine into a simple sentence: 'He finished his work. He went to sleep.'", options: ["Having finished his work, he went to sleep.", "He finished his work and went to sleep.", "After he finished his work, he went to sleep.", "He went to sleep after finishing his work."], correct_option: 0, subject: "english" },
  { id: "q34", title: "Change to comparative degree: 'No other boy in the class is as tall as Ram.'", options: ["Ram is taller than any other boy in the class.", "Ram is the tallest boy in the class.", "Ram is taller than all boys in the class.", "Ram is tall than any other boy."], correct_option: 0, subject: "english" },
  { id: "q35", title: "Change to complex sentence: 'Seeing the lion, he ran away.'", options: ["He saw the lion and ran away.", "Because he saw the lion, he ran away.", "When he saw the lion, he ran away.", "He ran away seeing the lion."], correct_option: 2, subject: "english" },
  { id: "q36", title: "Change to compound sentence: 'In spite of his wealth, he is unhappy.'", options: ["He is wealthy, but he is unhappy.", "Although he is wealthy, he is unhappy.", "He is wealthy and he is unhappy.", "Because he is wealthy, he is unhappy."], correct_option: 0, subject: "english" },
  { id: "q37", title: "Change to positive degree: 'Iron is more useful than any other metal.'", options: ["No other metal is as useful as iron.", "Iron is the most useful metal.", "Very few metals are as useful as iron.", "Some metals are as useful as iron."], correct_option: 0, subject: "english" },
  { id: "q38", title: "Remove 'if': 'If you do not hurry, you will miss the train.'", options: ["Unless you hurry, you will miss the train.", "Hurry, you will miss the train.", "Unless you do not hurry, you will miss the train.", "In case you hurry, you will miss the train."], correct_option: 0, subject: "english" },
  { id: "q39", title: "Use 'No sooner': 'As soon as the bell rang, the students rushed out.'", options: ["No sooner the bell rang than the students rushed out.", "No sooner had the bell rung than the students rushed out.", "No sooner did the bell ring when the students rushed out.", "No sooner rung the bell than students rushed out."], correct_option: 1, subject: "english" },
  { id: "q40", title: "Change to interrogative: 'Everybody knows Gandhi.'", options: ["Who does not know Gandhi?", "Does everybody know Gandhi?", "Is everybody knowing Gandhi?", "Who know Gandhi?"], correct_option: 0, subject: "english" },
];

function CustomEnglishTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('view') === 'records';

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    async function initTest() {
      try {
        if (viewOnly) {
          setIsSubmitted(true);
          setLoading(false);
          return;
        }

        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
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

        setQuestions(CUSTOM_QUESTIONS);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    initTest();
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

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Session expired. Please log in again.'); return; }

      let correct = 0;
      const attempts = questions.map((q, idx) => {
        const isCorrect = answers[idx] === q.correct_option;
        if (isCorrect) correct++;
        return { questionId: q.id, title: q.title, options: q.options, isCorrect, selectedOption: answers[idx] ?? null };
      });
      setCorrectCount(correct);

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
      if (!submitRes.ok) {
        alert(`⚠️ Score sync failed: ${submitData?.error || 'Unknown'}`);
        return;
      }

      setIsSubmitted(true);
    } catch (e: any) {
      alert(`⚠️ Network error: ${e.message}`);
    }
  };

  const handleShare = async () => {
    const score = correctCount * 3;
    const max = questions.length * 3;
    const text = `I scored ${score}/${max} on the Nightmare Grammar Gauntlet! 📚🔥 Can you match this?\n${getClientAppUrl()}/tests/english-custom-grammar`;
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({ title: 'Grammar Gauntlet', text, dialogTitle: 'Share Results' });
      } else if (navigator.share) {
        await navigator.share({ title: 'Grammar Gauntlet', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } catch (e) { console.log('Share error', e); }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center dark:bg-slate-950"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-[100dvh] flex items-center justify-center dark:bg-slate-950 text-red-500">{error}</div>;

  if (isSubmitted) {
    if (viewOnly || questions.length === 0) {
      return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 pt-10">
          <h1 className="text-3xl font-black italic text-center mb-6 dark:text-white">Hall of Fame</h1>
          <div className="max-w-xl mx-auto"><TestLeaderboard testId={TEST_ID} /></div>
          <button onClick={() => router.push('/tests')} className="w-full max-w-xl mx-auto mt-6 py-4 bg-slate-200 dark:bg-slate-800 rounded-2xl font-black block text-center dark:text-white">Exit</button>
        </div>
      );
    }
    const maxScore = questions.length * 3;
    const acc = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 pt-10 pb-32">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] text-center shadow-xl dark:border dark:border-slate-800">
            <h1 className="text-2xl font-black italic mb-4 dark:text-white">Nightmare Grammar Result</h1>
            <div className="text-5xl font-black text-violet-600 mb-2">{correctCount * 3} <span className="text-xl text-slate-400">/ {maxScore}</span></div>
            <div className="text-emerald-500 font-bold mb-6">{acc}% Accuracy</div>
            <div className="flex gap-4">
              <button onClick={handleShare} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold">Share</button>
              <button onClick={() => router.push('/tests')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">Leave</button>
            </div>
          </div>
          <TestLeaderboard testId={TEST_ID} />
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-center z-10 shrink-0">
        <div className="font-bold font-mono text-lg text-violet-600">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div className="font-black italic text-slate-800 dark:text-white">Grammar Nightmare</div>
        <button onClick={handleSubmit} className="px-4 py-1.5 bg-violet-600 text-white font-bold rounded-lg text-sm">Submit</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col pb-24">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm dark:border dark:border-slate-800 mb-6">
            <span className="text-violet-500 font-black text-xs uppercase tracking-widest mb-2 block">Question {currentIndex + 1} of 40</span>
            <h2 className="text-lg font-medium dark:text-white">{currentQ.title}</h2>
            <div className="mt-6 space-y-3">
              {currentQ.options.map((opt: string, oIdx: number) => (
                <button key={oIdx} onClick={() => handleSelectOption(oIdx)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentIndex] === oIdx ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-800 dark:text-white'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-auto">
            <button onClick={() => setCurrentIndex(c => c - 1)} disabled={currentIndex === 0} className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold dark:text-white disabled:opacity-50">Back</button>
            <button onClick={() => setCurrentIndex(c => c + 1)} disabled={currentIndex === 39} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      </main>

      <footer className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shrink-0 overflow-x-auto flex gap-2">
        {questions.map((_, idx) => (
          <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-10 h-10 shrink-0 rounded-xl font-bold text-sm ${idx === currentIndex ? 'bg-violet-600 text-white' : answers[idx] !== undefined ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {idx + 1}
          </button>
        ))}
      </footer>
    </div>
  );
}

export default function Page() {
  return <Suspense><CustomEnglishTestPage /></Suspense>;
}
