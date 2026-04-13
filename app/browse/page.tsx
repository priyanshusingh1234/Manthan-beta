'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'All',     value: '',                   emoji: '⚡' },
  { label: 'Maths',   value: 'Maths',               emoji: '📐' },
  { label: 'Science', value: 'Science',              emoji: '🔬' },
  { label: 'English', value: 'English',              emoji: '📖' },
  { label: 'Eng Lit', value: 'English Literature',   emoji: '📚' },
  { label: 'SST',     value: 'SST',                  emoji: '🌍' },
  { label: 'G.K',     value: 'G.K',                  emoji: '🧠' },
];

const CLASSES = [
  { label: 'All', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: String(i + 1) })),
];

const DIFFICULTIES = [
  { label: 'All',    value: '',       activeClass: 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800' },
  { label: 'Easy',   value: 'Easy',   activeClass: 'bg-emerald-500 text-white border-emerald-500' },
  { label: 'Medium', value: 'Medium', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { label: 'Hard',   value: 'Hard',   activeClass: 'bg-red-500 text-white border-red-500' },
];

const PAGE_SIZE = 12; // cards to render per "page" for perf

// ── Smart subject matcher (fuzzy, handles aliases) ────────────────────────────
function matchSubject(qSubject: string | null | undefined, filterValue: string): boolean {
  if (!filterValue) return true;   // "All" → show everything
  if (!qSubject) return false;

  const q = qSubject.trim().toLowerCase();
  const f = filterValue.trim().toLowerCase();

  switch (f) {
    case 'maths':
      // matches: maths, mathematics, math, maths & science...
      return q.includes('math');

    case 'science':
      return q.includes('science') || q.includes('physics') || q.includes('chemistry') || q.includes('biology');

    case 'english':
      // English only — NOT English Literature (that has its own filter)
      return q.includes('english') && !q.includes('literature') && !q.includes('lit');

    case 'english literature':
      return q.includes('english literature') || q.includes('eng lit') || q.includes('english lit');

    case 'sst':
      return q.includes('sst') || q.includes('social') || q.includes('history') || q.includes('geography') || q.includes('civics');

    case 'g.k':
      return q.includes('g.k') || q === 'gk' || q.includes('general knowledge') || q.includes('general k') || q.includes('gk');

    default:
      return q.startsWith(f) || q.includes(f);
  }
}

// ── Class matcher (digits only, "All"/"Any" always show) ─────────────────────
function matchClass(qClass: string | null | undefined, filterClass: string): boolean {
  if (!filterClass) return true;
  if (!qClass) return true; // no grade set → show everywhere
  const cls = qClass.toString().trim().toLowerCase();
  if (cls === 'all' || cls === 'any' || cls === '') return true; // "All" grade questions visible in every class
  const digits = cls.replace(/[^0-9]/g, '');
  return digits === filterClass;
}

// ── Difficulty matcher (handles moderate=medium) ──────────────────────────────
function matchDifficulty(qDiff: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  if (!qDiff) return false;
  const d = qDiff.toLowerCase().trim();
  const f = filter.toLowerCase().trim();
  if (f === 'medium') return d === 'medium' || d === 'moderate';
  return d.startsWith(f);
}

// ── Main Component ────────────────────────────────────────────────────────────
function BrowseInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subject, setSubject]     = useState(searchParams.get('subject') || '');
  const [classGrade, setClass]    = useState(searchParams.get('class') || '');
  const [difficulty, setDiff]     = useState(searchParams.get('difficulty') || '');
  const [search, setSearch]       = useState('');
  const [allQuestions, setAll]    = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [visible, setVisible]     = useState(PAGE_SIZE);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Fetch ALL questions ONCE ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        // No subject/class filter at fetch time — we do all filtering client-side
        const res = await fetch('/api/questions?limit=300', { headers, cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setAll(Array.isArray(data) ? data : (data?.questions || []));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── URL sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams();
    if (subject) p.set('subject', subject);
    if (classGrade) p.set('class', classGrade);
    if (difficulty) p.set('difficulty', difficulty);
    router.replace(`/browse${p.toString() ? '?' + p.toString() : ''}`, { scroll: false });
  }, [subject, classGrade, difficulty, router]);

  // Reset visible count when filters change
  useEffect(() => { setVisible(PAGE_SIZE); }, [subject, classGrade, difficulty, search]);

  // ── Instant client-side filter ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return allQuestions.filter(q => {
      if (!matchSubject(q.subject, subject)) return false;
      if (!matchClass(q.classGrade, classGrade)) return false;
      if (!matchDifficulty(q.difficulty, difficulty)) return false;
      if (s) {
        return (
          q.title?.toLowerCase().includes(s) ||
          q.subject?.toLowerCase().includes(s) ||
          q.body?.toLowerCase().includes(s) ||
          q.classGrade?.toString().toLowerCase().includes(s) ||
          q.difficulty?.toLowerCase().includes(s) ||
          q.createdByName?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [allQuestions, subject, classGrade, difficulty, search]);

  // ── IntersectionObserver — virtual scroll ────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(v => v + PAGE_SIZE); },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]); // re-observe when filtered list changes

  const rendered = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const hasFilters = !!(subject || classGrade || difficulty || search.trim());
  const clearAll = useCallback(() => { setSubject(''); setClass(''); setDiff(''); setSearch(''); }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-28">

      {/* ── Sticky Filter Header ───────────────────────────────────── */}
      <div className="sticky top-[56px] sm:top-[64px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">

        {/* Title + count */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">Browse</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {loading ? 'Loading…' : `${filtered.length} questions`}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-[11px] font-black text-red-500 px-2 py-1 active:scale-95 transition-transform">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative px-4 pb-2">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject, difficulty…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject pills */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-none">
          {SUBJECTS.map(s => {
            const active = subject === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSubject(active ? '' : s.value)}
                className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-[12px]">{s.emoji}</span> {s.label}
              </button>
            );
          })}
        </div>

        {/* Class + Difficulty row */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none items-center">
          {/* Class select */}
          <div className="relative shrink-0">
            <select
              value={classGrade}
              onChange={e => setClass(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-black outline-none transition-all cursor-pointer ${
                classGrade
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {CLASSES.map(c => (
                <option key={c.value} value={c.value} className="bg-white dark:bg-slate-900 text-slate-900">
                  {c.value ? `Class ${c.label}` : 'All Classes'}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${classGrade ? 'text-violet-200' : 'text-slate-400'}`} />
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* Difficulty */}
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDiff(difficulty === d.value ? '' : d.value)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                difficulty === d.value
                  ? d.activeClass
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Question List ─────────────────────────────────────────── */}
      <div className="px-4 pt-3 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          // Skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
              <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-1">No questions found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {hasFilters ? 'Try different filters or clear them to see all.' : 'No questions available yet.'}
            </p>
            {hasFilters && (
              <button onClick={clearAll} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black active:scale-95 transition-transform">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {rendered.map(q => <QuestionCard key={q.id} q={q} />)}

            {/* Sentinel for virtual scroll */}
            <div ref={sentinelRef} className="py-3 flex justify-center">
              {hasMore ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more…
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  All {filtered.length} questions loaded ✓
                </p>
              )}
            </div>
          </>
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
