'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { BookOpen, GraduationCap, Search, X, SlidersHorizontal } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'All', value: '', emoji: '🌐' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'Eng Lit', value: 'English Literature', emoji: '📚' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
  { label: 'G.K', value: 'G.K', emoji: '🧠' },
];

const CLASSES = [
  { label: 'All Classes', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Class ${i + 1}`, value: String(i + 1) })),
];

const DIFFICULTIES = [
  { label: 'All', value: '' },
  { label: 'Easy', value: 'Easy' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Hard', value: 'Hard' },
];

// ── Subject color map ─────────────────────────────────────────────────────────
const subjectColors: Record<string, string> = {
  'Maths':               'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600',
  'Science':             'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600',
  'English':             'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 data-[active=true]:bg-violet-600 data-[active=true]:text-white data-[active=true]:border-violet-600',
  'English Literature':  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 data-[active=true]:bg-purple-600 data-[active=true]:text-white data-[active=true]:border-purple-600',
  'SST':                 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 data-[active=true]:bg-amber-600 data-[active=true]:text-white data-[active=true]:border-amber-600',
  'G.K':                 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600',
  '':                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 data-[active=true]:bg-slate-800 data-[active=true]:text-white data-[active=true]:border-slate-800 dark:data-[active=true]:bg-white dark:data-[active=true]:text-slate-900',
};

// ── Inner component (uses useSearchParams, must be wrapped in Suspense) ────────
function BrowseInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [classGrade, setClassGrade] = useState(searchParams.get('class') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [search, setSearch] = useState('');

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Sync filters → URL ───────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (classGrade) params.set('class', classGrade);
    if (difficulty) params.set('difficulty', difficulty);
    router.replace(`/browse${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  }, [subject, classGrade, difficulty, router]);

  // ── Fetch questions ──────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);

      const params = new URLSearchParams({ limit: '80' });
      if (subject) params.set('subject', subject);
      if (classGrade) params.set('classGrade', classGrade);
      if (difficulty) params.set('difficulty', difficulty);

      const headers: HeadersInit = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/questions?${params.toString()}`, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data?.questions || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [subject, classGrade, difficulty]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ── Client-side search filter ────────────────────────────────────────────
  const filtered = search.trim()
    ? questions.filter(q =>
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.subject?.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  const activeFiltersCount = [subject, classGrade, difficulty].filter(Boolean).length;

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-28 pt-4 sm:pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/60 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3 border border-indigo-200/50 dark:border-indigo-800/50">
            <BookOpen className="w-3.5 h-3.5" /> Question Library
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Browse Questions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Filter by subject, class, or difficulty</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Subject tags */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s.value}
                data-active={subject === s.value}
                onClick={() => setSubject(subject === s.value ? '' : s.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${subjectColors[s.value] || subjectColors['']}`}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Class tags */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CLASSES.map(c => (
              <button
                key={c.value}
                onClick={() => setClassGrade(classGrade === c.value ? '' : c.value)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                  classGrade === c.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty tags */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Difficulty</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(difficulty === d.value ? '' : d.value)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                  difficulty === d.value
                    ? d.value === 'Easy' ? 'bg-emerald-600 text-white border-emerald-600'
                    : d.value === 'Medium' ? 'bg-amber-500 text-white border-amber-500'
                    : d.value === 'Hard' ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter count + clear */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </p>
            <button
              onClick={() => { setSubject(''); setClassGrade(''); setDifficulty(''); }}
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium">
            {loading ? 'Loading…' : `${filtered.length} question${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No questions found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Try different filters or clear them to see all questions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(q => <QuestionCard key={q.id} q={q} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseInner />
    </Suspense>
  );
}
