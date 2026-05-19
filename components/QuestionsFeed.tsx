"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import VipQuestionCard from './VipQuestionCard';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw, X, ChevronDown, ArrowUp, Loader2 } from 'lucide-react';
import PeopleYouMayKnow from '@/components/PeopleYouMayKnow';

type FeedItem = any;
const PAGE_SIZE = 10;

// ── Filter constants ──────────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'All', value: '', emoji: '⚡' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Science', value: 'Science', emoji: '🔬' },
  { label: 'English', value: 'English', emoji: '📖' },
  { label: 'SST', value: 'SST', emoji: '🌍' },
  { label: 'Hindi', value: 'Hindi', emoji: '🇮🇳' },
  { label: 'G.K', value: 'G.K', emoji: '🧠' },
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
    case 'maths': return q.includes('math') || q === 'maths';
    case 'science': return q.includes('science') || q.includes('physics') || q.includes('chemistry') || q.includes('biology');
    case 'english': return (q.includes('english') || q === 'eng') && !q.includes('literature') && !q.includes('lit');
    case 'english literature': return q.includes('english literature') || q.includes('eng lit') || q.includes('english lit') || q.includes('lit');
    case 'sst': {
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
    case 'g.k': return q === 'g.k' || q === 'gk' || q.includes('g.k') || q.includes('general knowledge') || q.includes('general k');
    case 'hindi': return q === 'hindi' || q.includes('hindi');
    default: return q.startsWith(f) || q === f || q.includes(f);
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

// ── Instagram-style shimmer skeleton ─────────────────────────────────────────
function ShimmerCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/60 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/30 to-transparent" />
      <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
      <div className="space-y-2.5 mb-5">
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
    </div>
  );
}

export default function QuestionsFeed() {
  // Filter state (persisted in localStorage)
  const [subject, setSubject] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_subject') || '' : ''
  );
  const [classGrade, setClass] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_class') || '' : ''
  );
  const [chapter, setChapter] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_chapter') || '' : ''
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dheeyudhha_feed_subject', subject);
      localStorage.setItem('dheeyudhha_feed_class', classGrade);
      localStorage.setItem('dheeyudhha_feed_chapter', chapter);
    }
  }, [subject, classGrade, chapter]);

  // ── Feed data ── Immediately hydrate from cache (Instagram-style) ─────────
  const getCached = (sub: string, cls: string, chap: string): FeedItem[] => {
    try {
      const raw = localStorage.getItem(`dheeyudhha_feed_cache_${sub}_${cls}_${chap}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const [allData, setAllData] = useState<FeedItem[]>(() => getCached(
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_subject') || '' : '',
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_class') || '' : '',
    typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_chapter') || '' : ''
  ));

  const [userId, setUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('dheeyudha_user_meta_cache') || 'null'); } catch { }
    }
    return null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const cached = localStorage.getItem('dheeyudha_user_meta_cache');
        if (cached) setCurrentUserData(JSON.parse(cached));
      } catch { }
    };
    window.addEventListener('user_metadata_updated', handleUpdate);
    return () => window.removeEventListener('user_metadata_updated', handleUpdate);
  }, []);

  // Show skeleton only when there's no cached data at all
  const hasCachedData = allData.length > 0;
  const [loading, setLoading] = useState(!hasCachedData);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [visibleCount, setVisible] = useState(PAGE_SIZE);

  // ── Instagram "New posts available" banner ────────────────────────────────
  const [freshItems, setFreshItems] = useState<FeedItem[]>([]);
  const [showNewBanner, setShowNewBanner] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const filterModeRef = useRef(false);

  // ── Fetch logic ──────────────────────────────────────────────────────────
  const load = useCallback(async ({ refresh = false, subject: sub = '', classGrade: cls = '', chapter: chap = '', silent = false } = {}) => {
    if (refresh && !silent) { setRefreshing(true); offsetRef.current = 0; }
    else if (!silent && offsetRef.current === 0 && !hasCachedData) setLoading(true);
    else if (!silent && offsetRef.current > 0) setMore(true);
    setErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;

      if ((refresh || offsetRef.current === 0) && !silent) {
        setUserId(currentId);
        if (currentId) {
          supabase.auth.getUser().then(({ data }) => {
            const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
            const meta = data?.user?.user_metadata || {};
            const effectiveAvatar = meta.avatar_url || meta.picture || null;
            const userData = { ...meta, avatar_url: effectiveAvatar, _isAdmin: adminEmails.includes(data?.user?.email || '') };
            setCurrentUserData(userData);
            if (typeof window !== 'undefined' && effectiveAvatar) {
              try {
                const cached = localStorage.getItem('dheeyudha_user_meta_cache');
                const parsed = cached ? JSON.parse(cached) : {};
                if (effectiveAvatar !== parsed.avatar_url) {
                  localStorage.setItem('dheeyudha_user_meta_cache', JSON.stringify({ ...parsed, ...meta, avatar_url: effectiveAvatar }));
                }
              } catch { }
            }
          });
        } else {
          setCurrentUserData(null);
        }
      }

      const headers: HeadersInit = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      let items: FeedItem[] = [];

      if (sub || cls || chap) {
        filterModeRef.current = true;
        const qs = new URLSearchParams({ limit: '1000' });
        if (sub) qs.set('subject', sub);
        if (cls) qs.set('class', cls);
        if (chap) qs.set('chapter', chap);
        const res = await fetch(`/api/questions?${qs.toString()}`, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        items = Array.isArray(raw) ? raw : (raw?.questions || []);
      } else {
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
        if (silent && allData.length > 0) {
          // ── Instagram pattern: background refresh found new content ──────
          // Find items that aren't already shown (compare by id)
          const existingIds = new Set(allData.map((i: any) => i.id));
          const newItems = items.filter((i: any) => !existingIds.has(i.id));
          if (newItems.length > 0) {
            // Store fresh items to be revealed when user taps the banner
            setFreshItems(items);
            setShowNewBanner(true);
          }
          // Always update the cache
          localStorage.setItem(`dheeyudhha_feed_cache_${sub}_${cls}_${chap}`, JSON.stringify(items.slice(0, 20)));
        } else {
          // Direct update (initial load or manual refresh)
          setAllData(items);
          setVisible(PAGE_SIZE);
          setExhausted(items.length < 10);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`dheeyudhha_feed_cache_${sub}_${cls}_${chap}`, JSON.stringify(items.slice(0, 20)));
          }
        }
      } else {
        setAllData(prev => {
          const ids = new Set(prev.map(i => i.id));
          const fresh = items.filter(i => !ids.has(i.id));
          if (fresh.length === 0) setExhausted(true);
          return [...prev, ...fresh];
        });
      }
      offsetRef.current += items.length;
    } catch (e: any) {
      if (!silent) setErr(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setMore(false);
    }
  }, [allData, hasCachedData]);

  // Initial load: if cache exists → show it instantly, then silently refresh in bg
  useEffect(() => {
    const sub = typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_subject') || '' : '';
    const cls = typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_class') || '' : '';
    const chap = typeof window !== 'undefined' ? localStorage.getItem('dheeyudhha_feed_chapter') || '' : '';
    const hasCache = getCached(sub, cls, chap).length > 0;

    if (hasCache) {
      // Cache already hydrated via useState — start a silent background refresh
      load({ subject: sub, classGrade: cls, chapter: chap, silent: true });
    } else {
      // No cache → show skeleton, do a normal fetch
      load({ subject: sub, classGrade: cls, chapter: chap });
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change
  const prevFiltersRef = useRef({ subject: '', classGrade: '', chapter: '' });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.subject === subject && prev.classGrade === classGrade && prev.chapter === chapter) return;
    prevFiltersRef.current = { subject, classGrade, chapter };
    offsetRef.current = 0;
    setShowNewBanner(false);
    setFreshItems([]);

    const cached = getCached(subject, classGrade, chapter);
    if (cached.length > 0) {
      setAllData(cached);
      setLoading(false);
      // Silent background refresh
      load({ subject, classGrade, chapter, silent: true });
    } else {
      setAllData([]);
      setLoading(true);
      load({ subject, classGrade, chapter });
    }
    setVisible(PAGE_SIZE);
    setExhausted(false);
  }, [subject, classGrade, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avatar patch for own questions
  const myAvatar = useMemo(() => {
    if (!currentUserData) return null;
    return currentUserData.avatar_url || currentUserData.picture || null;
  }, [currentUserData]);

  const filtered = useMemo(() => {
    return allData
      .filter(item => {
        if (!matchSubject(item.subject, subject)) return false;
        if (!matchClass(item.classGrade, classGrade)) return false;
        if (chapter && item.chapter !== chapter) return false;
        return true;
      })
      .map(item => {
        if (item.type !== 'post' && userId && item.createdBy === userId && myAvatar) {
          return { ...item, createdByAvatar: myAvatar };
        }
        return item;
      });
  }, [allData, subject, classGrade, userId, myAvatar]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(v => {
        const next = v + PAGE_SIZE;
        if (next >= filtered.length && !exhausted && !filterModeRef.current) {
          load({ subject, classGrade, chapter });
        }
        return next;
      });
    }, { rootMargin: '250px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length, exhausted, load, subject, classGrade, chapter]);

  const visible = filtered.slice(0, visibleCount);
  const hasFilter = !!(subject || classGrade || chapter);

  // ── Apply the banner content (tap to reveal new posts) ───────────────────
  const applyNewPosts = () => {
    setAllData(freshItems);
    setFreshItems([]);
    setShowNewBanner(false);
    setVisible(PAGE_SIZE);
    setExhausted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Instagram-style shimmer skeletons ─────────────────────────────────────
  const skeleton = (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
    </div>
  );

  return (
    <>
      {/* CSS keyframe for shimmer — injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

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
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${active
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
            <div className="relative">
              <select
                value={classGrade}
                onChange={e => setClass(e.target.value)}
                className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-black outline-none transition-all cursor-pointer ${classGrade
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
                <>
                  <button
                    onClick={() => { window.dispatchEvent(new Event('open_daily_planner')); }}
                    className="flex items-center gap-1 text-[11px] font-black text-indigo-500 active:scale-95 transition-transform mr-1"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={() => { setSubject(''); setClass(''); setChapter(''); }}
                    className="flex items-center gap-1 text-[11px] font-black text-red-500 active:scale-95 transition-transform"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowNewBanner(false);
                  setFreshItems([]);
                  offsetRef.current = 0;
                  load({ refresh: true, subject, classGrade, chapter });
                }}
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
                ? `${filtered.length} questions • ${subject || 'All subjects'}${classGrade ? ` · Class ${classGrade}` : ''}${chapter ? ` · ${chapter}` : ''}`
                : `${visible.length} of ${filtered.length} personalized picks`}
            </p>
          )}
        </div>

        {/* ── Instagram "New posts" floating banner ─────────────────────── */}
        {showNewBanner && (
          <button
            onClick={applyNewPosts}
            className="sticky top-3 z-30 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-500/30 animate-in slide-in-from-top duration-300 active:scale-95 transition-transform"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            New questions available — tap to see them
          </button>
        )}

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
            {visible.map((item: FeedItem, idx: number) => (
              <React.Fragment key={item.id}>
                <div className="space-y-1">
                  {item._feedLabel && item.type !== 'post' && (
                    <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-1 tracking-wide">
                      {item._feedLabel}
                    </p>
                  )}
                  {item.type === 'post' ? (
                    <PostCard
                      post={item}
                      currentUserId={userId}
                      onUpdate={() => load({ refresh: true, subject, classGrade })}
                      feedLabel={item._feedLabel}
                      suppliedCurrentUserData={currentUserData}
                    />
                  ) : item.is_vip ? (
                    <VipQuestionCard q={item} />
                  ) : (
                    <QuestionCard q={item} />
                  )}
                </div>
                {/* Inject People You May Know after every 5th item */}
                {(idx + 1) % 5 === 0 && <PeopleYouMayKnow />}
              </React.Fragment>
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
    </>
  );
}
