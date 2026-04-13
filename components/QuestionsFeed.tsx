"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw, Loader2 } from 'lucide-react';

type FeedItem = any;

const PAGE_SIZE = 10; // items to reveal per scroll trigger

export default function QuestionsFeed() {
  const [allItems, setAllItems]   = useState<FeedItem[]>([]);
  const [visibleCount, setVisible] = useState(PAGE_SIZE);
  const [userId, setUserId]        = useState<string | null>(null);
  const [loading, setLoading]      = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [loadingMore, setMore]     = useState(false);
  const [err, setErr]              = useState<string | null>(null);
  const [exhausted, setExhausted]  = useState(false); // true when no more items in API

  const sentinelRef   = useRef<HTMLDivElement>(null);
  const observerRef   = useRef<IntersectionObserver | null>(null);
  const offsetRef     = useRef(0); // tracks how many items were loaded from the API

  // ── Load next page from API ───────────────────────────────────────────────
  const loadPage = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      offsetRef.current = 0;
    } else if (offsetRef.current === 0) {
      setLoading(true);
    } else {
      setMore(true);
    }
    setErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
      if (isRefresh || offsetRef.current === 0) setUserId(currentId);

      const headers: HeadersInit = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const localClass = typeof window !== 'undefined'
        ? localStorage.getItem('dheeyudhha_recent_class') || '' : '';

      const qs = new URLSearchParams({ t: Date.now().toString(), limit: '30' });
      if (localClass) qs.set('class', localClass);

      const res = await fetch(`/api/feed?${qs.toString()}`, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const rawData = await res.json();
      const newItems: FeedItem[] = Array.isArray(rawData) ? rawData : (rawData?.questions || []);

      if (isRefresh) {
        setAllItems(newItems);
        setVisible(PAGE_SIZE);
        setExhausted(newItems.length < 10);
      } else if (offsetRef.current === 0) {
        setAllItems(newItems);
        setVisible(PAGE_SIZE);
        setExhausted(newItems.length < 10);
      } else {
        // Deduplicate by id when appending subsequent pages
        setAllItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const fresh = newItems.filter(i => !existingIds.has(i.id));
          if (fresh.length === 0) setExhausted(true);
          return [...prev, ...fresh];
        });
      }
      offsetRef.current += newItems.length;
    } catch (error: any) {
      console.error(error);
      setErr(error?.message || String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadPage(); }, [loadPage]);

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;

      setVisible(prev => {
        const next = prev + PAGE_SIZE;
        // If we've revealed all locally loaded items, fetch a fresh batch
        if (next >= allItems.length && !exhausted) {
          loadPage(false);
        }
        return next;
      });
    }, { rootMargin: '200px' });

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [allItems.length, exhausted, loadPage]);

  const visibleItems = allItems.slice(0, visibleCount);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/60 animate-pulse space-y-1">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full delay-75" />
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full delay-100" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full delay-150" />
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-full delay-200" />
            </div>
            <div className="h-12 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (err) return <div className="py-6 text-sm text-red-600">Error loading feed — {err}</div>;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between pb-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {visibleItems.length} of {allItems.length} updates for you
        </p>
        <button
          onClick={() => loadPage(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Shuffling…' : 'Shuffle Feed'}
        </button>
      </div>

      {/* Feed items */}
      {(!visibleItems || visibleItems.length === 0) ? (
        <div className="py-6 text-sm text-slate-500">Nothing to show yet.</div>
      ) : (
        <>
          {visibleItems.map((item: FeedItem) => (
            <div key={item.id} className="space-y-1">
              {item._feedLabel && item.type !== 'post' && (
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-1 tracking-wide">
                  {item._feedLabel}
                </p>
              )}
              {item.type === 'post' ? (
                <PostCard
                  post={item}
                  currentUserId={userId}
                  onUpdate={() => loadPage(true)}
                  feedLabel={item._feedLabel}
                />
              ) : (
                <QuestionCard q={item} />
              )}
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more…
              </div>
            )}
            {!loadingMore && exhausted && allItems.length > 0 && (
              <p className="text-xs text-slate-400 font-medium">You're all caught up 🎉</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
