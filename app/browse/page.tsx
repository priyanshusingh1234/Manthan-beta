'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { Search, X, ChevronDown } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'All',     value: '',                   emoji: '⚡', match: null },
  { label: 'Maths',   value: 'Maths',               emoji: '📐', match: 'math' },
  { label: 'Science', value: 'Science',              emoji: '🔬', match: 'science' },
  { label: 'English', value: 'English',              emoji: '📖', match: 'english' },
  { label: 'Eng Lit', value: 'English Literature',   emoji: '📚', match: 'english literature' },
  { label: 'SST',     value: 'SST',                  emoji: '🌍', match: 'sst' },
  { label: 'G.K',     value: 'G.K',                  emoji: '🧠', match: 'g.k' },
];

const CLASSES = [
  { label: 'All', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: String(i + 1) })),
];

const DIFFICULTIES = [
  { label: 'All',    value: '',       color: '' },
  { label: 'Easy',   value: 'Easy',   color: 'emerald' },
  { label: 'Medium', value: 'Medium', color: 'amber' },
  { label: 'Hard',   value: 'Hard',   color: 'red' },
];

// ── Fuzzy match helpers ───────────────────────────────────────────────────────
function matchSubject(qSubject: string | null, filterMatch: string | null): boolean {
  if (!filterMatch) return true;
  if (!qSubject) return false;
  const s = qSubject.toLowerCase();
  return s.startsWith(filterMatch) || s.includes(filterMatch);
}

function matchClass(qClass: string | null, filterClass: string): boolean {
  if (!filterClass) return true;
  if (!qClass || qClass === 'All' || qClass === 'Any') return true; // "All" grade questions show everywhere
  const normalized = qClass.toLowerCase().replace(/[^0-9]/g, '');
  return normalized === filterClass;
}

function matchDifficulty(qDiff: string | null, filter: string): boolean {
  if (!filter) return true;
  if (!qDiff) return false;
  return qDiff.toLowerCase().startsWith(filter.toLowerCase()) ||
         (filter.toLowerCase() === 'medium' && qDiff.toLowerCase() === 'moderate');
}

// ── Inner page ────────────────────────────────────────────────────────────────
function BrowseInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subject, setSubject]   = useState(searchParams.get('subject') || '');
  const [classGrade, setClass]  = useState(searchParams.get('class') || '');
  const [difficulty, setDiff]   = useState(searchParams.get('difficulty') || '');
  const [search, setSearch]     = useState('');
  const [allQuestions, setAll]  = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load ALL questions ONCE ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const res = await fetch('/api/questions?limit=200', { headers, cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setAll(Array.isArray(data) ? data : (data?.questions || []));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Sync URL params (no re-fetch, just cosmetic) ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (classGrade) params.set('class', classGrade);
    if (difficulty) params.set('difficulty', difficulty);
    router.replace(`/browse${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  }, [subject, classGrade, difficulty, router]);

  // ── Client-side filter (instantaneous) ───────────────────────────────────
  const activeSubject = SUBJECTS.find(s => s.value === subject);

  const filtered = useMemo(() => {
    return allQuestions.filter(q => {
      if (!matchSubject(q.subject, activeSubject?.match ?? null)) return false;
      if (!matchClass(q.classGrade, classGrade)) return false;
      if (!matchDifficulty(q.difficulty, difficulty)) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (!(q.title?.toLowerCase().includes(s) || q.subject?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [allQuestions, activeSubject, classGrade, difficulty, search]);

  const hasFilters = !!(subject || classGrade || difficulty || search.trim());

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-28">

      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">

        {/* Title row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Browse</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} of ${allQuestions.length} questions`}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSubject(''); setClass(''); setDiff(''); setSearch(''); }}
              className="flex items-center gap-1 text-[11px] font-black text-red-500 active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative px-4 pb-2">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject pills — horizontal scroll */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {SUBJECTS.map(s => {
            const active = subject === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSubject(active ? '' : s.value)}
                className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <span className="text-[13px] leading-none">{s.emoji}</span> {s.label}
              </button>
            );
          })}
        </div>

        {/* Class + Difficulty row */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none items-center">
          {/* Class dropdown */}
          <div className="relative shrink-0">
            <select
              value={classGrade}
              onChange={e => setClass(e.target.value)}
              className={`appearance-none pl-3 pr-6 py-1.5 rounded-xl text-xs font-black border outline-none transition-all cursor-pointer ${
                classGrade
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
              }`}
            >
              {CLASSES.map(c => (
                <option key={c.value} value={c.value} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                  {c.value ? `Class ${c.label}` : 'All Classes'}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${classGrade ? 'text-white' : 'text-slate-400'}`} />
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* Difficulty pills */}
          {DIFFICULTIES.map(d => {
            const active = difficulty === d.value;
            const colorMap: Record<string, string> = {
              emerald: 'bg-emerald-500 text-white border-emerald-500',
              amber:   'bg-amber-500 text-white border-amber-500',
              red:     'bg-red-500 text-white border-red-500',
            };
            return (
              <button
                key={d.value}
                onClick={() => setDiff(active ? '' : d.value)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                  active
                    ? (colorMap[d.color] || 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900')
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Feed ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
                <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-1">No questions found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {hasFilters ? 'Try different filters.' : 'No questions available yet.'}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSubject(''); setClass(''); setDiff(''); setSearch(''); }}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black active:scale-95 transition-transform"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filtered.map(q => <QuestionCard key={q.id} q={q} />)
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
