"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw, Loader2, X, ChevronDown } from 'lucide-react';

type FeedItem = any;
const PAGE_SIZE = 10;

// ── Filter constants ──────────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'All',     value: '',         emoji: '⚡' },
  { label: 'Maths',   value: 'Maths',    emoji: '📐' },
  { label: 'Science', value: 'Science',  emoji: '🔬' },
  { label: 'English', value: 'English',  emoji: '📖' },
  { label: 'SST',     value: 'SST',      emoji: '🌍' },
  { label: 'G.K',     value: 'G.K',      emoji: '🧠' },
];

const CLASSES = [
  { label: 'All Classes', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Class ${i + 1}`, value: String(i + 1) })),
];

// ── Smart matchers ────────────────────────────────────────────────────────────
function matchSubject(qSubject: string | null | undefined, filterValue: string): boolean {
  if (!filterValue) return true;
  if (!qSubject) return false;
  const q = qSubject.trim().toLowerCase();
  const f = filterValue.trim().toLowerCase();
  switch (f) {
    case 'maths':              return q.includes('math') || q === 'maths';
    case 'science':            return q.includes('science') || q.includes('physics') || q.includes('chemistry') || q.includes('biology');
    case 'english':            return (q.includes('english') || q === 'eng') && !q.includes('literature') && !q.includes('lit');
    case 'english literature': return q.includes('english literature') || q.includes('eng lit') || q.includes('english lit') || q.includes('lit');
    case 'sst': {
      // Match all stored variations: 'SST', 'Social Studies', 'Social Science',
      // 'History', 'Geography', 'Civics', 'S.St', 'SS', etc.
      return (
        q === 'sst' ||
        q.includes('sst') ||
        q.includes('social') ||
        q.includes('history') ||
        q.includes('geography') ||
        q.includes('civics') ||
        q.includes('s.st') ||
        q === 'ss'
      );
    }
    case 'g.k':               return q === 'g.k' || q === 'gk' || q.includes('g.k') || q.includes('general knowledge') || q.includes('general k');
    default:                   return q.startsWith(f) || q === f || q.includes(f);
  }
}

function matchClass(qClass: string | null | undefined, filterClass: string): boolean {
  if (!filterClass) return true;
  if (!qClass) return true;
  const cls = qClass.toString().trim().toLowerCase();
  if (cls === 'all' || cls === 'any' || cls === '') return true;
  const digits = cls.replace(/[^0-9]/g, '');
  return digits === filterClass;
}

export default function QuestionsFeed() {
  // Filter state
  const [subject, setSubject]   = useState(() => {
      if (typeof window !== 'undefined') return sessionStorage.getItem('dheeyudhha_feed_subject') || '';
      return '';
  });
  const [classGrade, setClass]  = useState(() => {
      if (typeof window !== 'undefined') return sessionStorage.getItem('dheeyudhha_feed_class') || '';
      return '';
  });

  useEffect(() => {
      if (typeof window !== 'undefined') {
          sessionStorage.setItem('dheeyudhha_feed_subject', subject);
          sessionStorage.setItem('dheeyudhha_feed_class', classGrade);
      }
  }, [subject, classGrade]);

  // Feed data
  const [allData, setAllData]     = useState<FeedItem[]>(() => {
    if (typeof window !== 'undefined') {
      const sub = sessionStorage.getItem('dheeyudhha_feed_subject') || '';
      const cls = sessionStorage.getItem('dheeyudhha_feed_class') || '';
      
      const sessionData = sessionStorage.getItem(`dheeyudhha_feed_session_${sub}_${cls}`);
      if (sessionData) {
        try { 
          const parsed = JSON.parse(sessionData);
          if (parsed.length > 0) return parsed;
        } catch {}
      }

      const cached = localStorage.getItem(`dheeyudhha_feed_cache_${sub}_${cls}`);
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    return [];
  });
  const [userId, setUserId]       = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dheeyudha_user_meta_cache');
        return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  useEffect(() => {
    const handleUpdate = () => {
        const cached = localStorage.getItem('dheeyudha_user_meta_cache');
        if (cached) setCurrentUserData(JSON.parse(cached));
    };
    window.addEventListener('user_metadata_updated', handleUpdate);
    return () => window.removeEventListener('user_metadata_updated', handleUpdate);
  }, []);

  const [loading, setLoading]     = useState(() => {
    if (typeof window !== 'undefined') {
      const sub = sessionStorage.getItem('dheeyudhha_feed_subject') || '';
      const cls = sessionStorage.getItem('dheeyudhha_feed_class') || '';
      if (localStorage.getItem(`dheeyudhha_feed_cache_${sub}_${cls}`)) return false;
    }
    return true;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setMore]    = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [err, setErr]             = useState<string | null>(null);
  const [visibleCount, setVisible] = useState(PAGE_SIZE);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);
  const filterModeRef = useRef(false); // true = browsing specific filter

  // ── Fetch logic: algorithmic feed OR all questions for filter ─────────────
  const load = useCallback(async ({ refresh = false, subject: sub = '', classGrade: cls = '' } = {}) => {
    if (refresh) { setRefreshing(true); offsetRef.current = 0; }
    else if (offsetRef.current === 0) {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(`dheeyudhha_feed_cache_${sub}_${cls}`) : null;
      setLoading(!cached);
    }
    else setMore(true);
    setErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
        if (refresh || offsetRef.current === 0) {
        setUserId(currentId);
        if (currentId) {
            supabase.auth.getUser().then(({ data }) => {
                const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
                const meta = data?.user?.user_metadata || {};
                // Apply the same avatar priority chain as ClientLayout so that
                // avatar_url (the real uploaded photo) always wins over
                // the raw avatar_url which may be a stale Google OAuth URL.
                const effectiveAvatar = meta.avatar_url || meta.picture || null;
                setCurrentUserData({
                    ...meta,
                    avatar_url: effectiveAvatar,   // normalised field
                    _isAdmin: adminEmails.includes(data?.user?.email || '')
                });
                // Also keep localStorage in sync
                if (typeof window !== 'undefined' && effectiveAvatar) {
                    try {
                        const cached = localStorage.getItem('dheeyudha_user_meta_cache');
                        const parsed = cached ? JSON.parse(cached) : {};
                        if (effectiveAvatar !== parsed.avatar_url) {
                            localStorage.setItem('dheeyudha_user_meta_cache',
                                JSON.stringify({ ...parsed, ...meta, avatar_url: effectiveAvatar }));
                        }
                    } catch {}
                }
            });
        } else {
            setCurrentUserData(null);
        }
      }

      const headers: HeadersInit = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      let items: FeedItem[] = [];

      if (sub || cls) {
        // Filter mode — pass subject/class to server so DB filtering returns ALL matching
        // questions (not just the newest 300 across all subjects).
        filterModeRef.current = true;
        const qs = new URLSearchParams({ limit: '20', offset: offsetRef.current.toString() });
        if (sub)  qs.set('subject', sub);
        if (cls)  qs.set('class',   cls);
        const res = await fetch(`/api/questions?${qs.toString()}`, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        items = Array.isArray(raw) ? raw : (raw?.questions || []);
      } else {
        // Algorithmic feed (no filter)
        filterModeRef.current = false;
        const localClass = typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_recent_class') || '' : '';
        const qs = new URLSearchParams({ t: Date.now().toString(), limit: '40' });
        if (localClass) qs.set('class', localClass);
        const res = await fetch(`/api/feed?${qs.toString()}`, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        items = Array.isArray(raw) ? raw : (raw?.questions || []);
      }

      if (refresh || offsetRef.current === 0) {
        setAllData(items);
        setVisible(PAGE_SIZE);
        setExhausted(items.length < 10);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`dheeyudhha_feed_cache_${sub}_${cls}`, JSON.stringify(items.slice(0, 20)));
          sessionStorage.setItem(`dheeyudhha_feed_session_${sub}_${cls}`, JSON.stringify(items.slice(0, 100)));
        }
      } else {
        setAllData(prev => {
          const ids = new Set(prev.map(i => i.id));
          const fresh = items.filter(i => !ids.has(i.id));
          if (fresh.length === 0) setExhausted(true);
          const nextArr = [...prev, ...fresh];
          if (typeof window !== 'undefined') {
             sessionStorage.setItem(`dheeyudhha_feed_session_${sub}_${cls}`, JSON.stringify(nextArr.slice(0, 300)));
          }
          return nextArr;
        });
      }
      offsetRef.current += items.length;

    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => { 
     // Standard load behavior except don't fetch if allData was perfectly restored
     // from a deep session (prevents wiping position)
     if (allData.length > 40 && offsetRef.current === 0) {
        offsetRef.current = allData.length;
        setVisible(Math.min(allData.length, PAGE_SIZE * 3));
        setLoading(false);
        return;
     }
     load({ subject, classGrade }); 
  }, [load, subject, classGrade]);

  // Re-fetch when filters change
  const prevFiltersRef = useRef({ subject: typeof window !== 'undefined' ? sessionStorage.getItem('dheeyudhha_feed_subject') || '' : '', classGrade: typeof window !== 'undefined' ? sessionStorage.getItem('dheeyudhha_feed_class') || '' : '' });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.subject === subject && prev.classGrade === classGrade) return;
    prevFiltersRef.current = { subject, classGrade };
    offsetRef.current = 0;
    
    // Attempt instant load from cache when filters change
    const cached = typeof window !== 'undefined' ? localStorage.getItem(`dheeyudhha_feed_cache_${subject}_${classGrade}`) : null;
    if (cached) {
      try {
        setAllData(JSON.parse(cached));
        setLoading(false);
      } catch {
        setAllData([]);
      }
    } else {
      setAllData([]);
    }
    
    setVisible(PAGE_SIZE);
    setExhausted(false);
    load({ subject, classGrade });
  }, [subject, classGrade, load]);

  // ── Derive the current user's definitive avatar from the localStorage cache ──
  // Priority: avatar_url > avatar_url > picture — same as the profile page.
  // This is used below to patch question cards so teachers see their own avatar
  // even when the server-side profiles table is stale or not yet synced.
  const myAvatar = useMemo(() => {
    if (!currentUserData) return null;
    return (
      currentUserData.avatar_url ||
      currentUserData.avatar_url ||
      currentUserData.picture ||
      null
    );
  }, [currentUserData]);

  // ── Client-side smart filter + owner-avatar patch ────────────────────────
  const filtered = useMemo(() => {
    return allData
      .filter(item => {
        if (!matchSubject(item.subject, subject)) return false;
        if (!matchClass(item.classGrade, classGrade)) return false;
        return true;
      })
      .map(item => {
        // For question cards authored by the current user, ALWAYS override
        // createdByAvatar with the locally-cached real avatar.
        // We intentionally don't check !item.createdByAvatar because the API
        // may return a stale/wrong value (e.g. old Google URL) that we want
        // to replace — consistent with how PostCard handles post authors.
        if (
          item.type !== 'post' &&
          userId &&
          item.createdBy === userId &&
          myAvatar
        ) {
          return { ...item, createdByAvatar: myAvatar };
        }
        return item;
      });
  }, [allData, subject, classGrade, userId, myAvatar]);

  // ── IntersectionObserver ──────────────────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(v => {
        const next = v + PAGE_SIZE;
        if (next >= filtered.length && !exhausted) {
          load({ subject, classGrade });
        }
        return next;
      });
    }, { rootMargin: '250px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length, exhausted, load, subject, classGrade]);

  const visible = filtered.slice(0, visibleCount);
  const hasFilter = !!(subject || classGrade);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const skeleton = (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse space-y-1">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="space-y-3 mb-5">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-10 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Subject pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
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
                <span>{s.emoji}</span> {s.label}
              </button>
            );
          })}
        </div>

        {/* Class + controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Class select */}
          <div className="relative">
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
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${classGrade ? 'text-violet-200' : 'text-slate-400'}`} />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {hasFilter && (
              <button
                onClick={() => { setSubject(''); setClass(''); }}
                className="flex items-center gap-1 text-[11px] font-black text-red-500 active:scale-95 transition-transform"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <button
              onClick={() => { offsetRef.current = 0; load({ refresh: true, subject, classGrade }); }}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Loading…' : hasFilter ? 'Refresh' : 'Shuffle'}
            </button>
          </div>
        </div>

        {/* Status line */}
        {!loading && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {hasFilter
              ? `${filtered.length} questions • ${subject || 'All subjects'}${classGrade ? ` · Class ${classGrade}` : ''}`
              : `${visible.length} of ${filtered.length} personalized picks`}
          </p>
        )}
      </div>

      {/* ── Feed content ────────────────────────────────────────────── */}
      {loading ? skeleton : err ? (
        <div className="py-6 text-sm text-red-500">Error: {err}</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <div className="text-4xl">🔍</div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No questions found</p>
          <p className="text-xs text-slate-400">
            {hasFilter ? 'Try a different subject or class.' : 'Nothing in your feed yet.'}
          </p>
          {hasFilter && (
            <button onClick={() => { setSubject(''); setClass(''); }} className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black active:scale-95">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {visible.map((item: FeedItem) => (
            <div key={item.id} className="space-y-1">
              {item._feedLabel && item.type !== 'post' && (
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-1 tracking-wide">
                  {item._feedLabel}
                </p>
              )}
              {item.type === 'post' ? (
                <PostCard post={item} currentUserId={userId} onUpdate={() => load({ refresh: true, subject, classGrade })} feedLabel={item._feedLabel} suppliedCurrentUserData={currentUserData} />
              ) : (
                <QuestionCard q={item} />
              )}
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-3 flex justify-center">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more…
              </div>
            ) : exhausted || filterModeRef.current ? (
              visibleCount >= filtered.length && (
                <p className="text-xs text-slate-400">All {filtered.length} questions shown ✓</p>
              )
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
