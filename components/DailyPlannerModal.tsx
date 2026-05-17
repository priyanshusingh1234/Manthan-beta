"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, BookOpen, ChevronRight, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SUBJECTS = [
  { label: 'Maths', value: 'Maths', emoji: '📐', color: 'from-blue-500 to-indigo-600' },
  { label: 'Science', value: 'Science', emoji: '🔬', color: 'from-green-500 to-emerald-600' },
  { label: 'English', value: 'English', emoji: '📖', color: 'from-amber-500 to-orange-600' },
  { label: 'SST', value: 'SST', emoji: '🌍', color: 'from-rose-500 to-pink-600' },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳', color: 'from-cyan-500 to-blue-600' },
  { label: 'G.K', value: 'G.K', emoji: '🧠', color: 'from-violet-500 to-purple-600' },
];

export default function DailyPlannerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState('');
  const [userClass, setUserClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        let grade = meta.classGrade || meta.class;
        
        const { data: profile } = await supabase.from('profiles').select('class_grade').eq('id', user.id).single();
        if (profile?.class_grade) {
          grade = profile.class_grade;
        }
        
        setUserName(meta.fullName || meta.name || 'Student');
        setUserClass(grade || '10');
        
        // After getting user, check if we should auto-open
        const lastPlanDate = localStorage.getItem('dheeyudhha_daily_plan_date');
        const now = new Date().getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (!lastPlanDate || (now - parseInt(lastPlanDate, 10)) > ONE_DAY) {
          setIsOpen(true);
        }
      }
    };
    
    initUser();

    const handleOpen = () => {
      setStep(1);
      setIsOpen(true);
    };
    window.addEventListener('open_daily_planner', handleOpen);
    return () => window.removeEventListener('open_daily_planner', handleOpen);
  }, []);

  const fetchChapters = async (subject: string) => {
    setLoadingChapters(true);
    try {
      const res = await fetch(`/api/questions?subject=${subject}&class=${userClass}&limit=1000`);
      if (res.ok) {
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : (raw?.questions || []);
        
        const uniqueChapters = new Set<string>();
        items.forEach((q: any) => {
          if (q.chapter && q.chapter.trim()) {
            uniqueChapters.add(q.chapter.trim());
          }
        });
        
        let chapterList = Array.from(uniqueChapters);
        
        // Sort alphabetically instead of shuffling randomly
        chapterList = chapterList.sort((a, b) => a.localeCompare(b));
        
        setChapters(chapterList);
      }
    } catch (err) {
      console.error(err);
      setChapters(["Chapter 1", "Chapter 2", "Chapter 3", "Mixed Practice"]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    fetchChapters(subject);
    setStep(2);
  };

  const handleChapterSelect = (chapter: string) => {
    // Save to local storage
    localStorage.setItem('dheeyudhha_daily_plan_date', new Date().getTime().toString());
    localStorage.setItem('dheeyudhha_feed_subject', selectedSubject);
    localStorage.setItem('dheeyudhha_feed_chapter', chapter);
    
    setIsOpen(false);
    
    // Refresh page to apply filters to QuestionsFeed
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full h-[100dvh] sm:h-auto sm:max-w-md sm:rounded-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden sm:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 ease-out relative flex flex-col">

        {/* Header / Banner */}
        <div className="relative pt-[calc(3rem+env(safe-area-inset-top,0px))] sm:pt-12 pb-6 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-center text-white">
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-20">
            <button 
              onClick={() => {
                localStorage.setItem('dheeyudhha_daily_plan_date', new Date().getTime().toString());
                setIsOpen(false);
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md rounded-3xl mb-4 flex items-center justify-center shadow-inner rotate-3">
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
          
          <h2 className="text-2xl font-black mb-1">Hii {userName}! 👋</h2>
          <p className="text-indigo-100 font-medium text-sm">
            {step === 1 ? `Welcome back! What are you planning to study today from Class ${userClass}?` : `Great choice! Which chapter in ${selectedSubject}?`}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 pb-8 sm:pb-6">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => handleSubjectSelect(sub.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-[1.02] transition-all active:scale-95 group shadow-sm hover:shadow-md"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${sub.color} shadow-inner text-white group-hover:rotate-12 transition-transform`}>
                      {sub.emoji}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{sub.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep(1)}
                className="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-1 hover:underline"
              >
                ← Back to Subjects
              </button>
              
              {loadingChapters ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-semibold animate-pulse">Finding your chapters...</p>
                </div>
              ) : chapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No chapters found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Looks like teachers haven't uploaded any questions for this subject in your class yet!</p>
                </div>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {chapters.map((chap, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChapterSelect(chap)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-indigo-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 pr-2">{chap}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
