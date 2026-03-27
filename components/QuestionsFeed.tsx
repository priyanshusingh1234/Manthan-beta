"use client";
import React, { useEffect, useState, useCallback } from 'react';
import QuestionCard from './QuestionCard';
import PostCard from './PostCard';
import { supabase } from '@/lib/supabaseClient';
import { ActivityTracker } from '@/lib/activityTracker';
import { Loader2, RefreshCw } from 'lucide-react';

type FeedItem = any;

export default function QuestionsFeed() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
      setUserId(currentId);

      const headers: HeadersInit = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Add a cache-busting timestamp so the server reshuffles the feed
      const res = await fetch(`/api/feed?t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const rawData = await res.json();
      let feedItems = Array.isArray(rawData) ? rawData : (rawData?.questions || []);

      // 🔥 Apply Local Algorithmic Weights
      try {
        const stats = await ActivityTracker.getStats();
        const weights = stats.subjectWeights;

        feedItems = feedItems.map((item: any, index: number) => {
          let score = 100 - index; // Base score from server order
          const sub = item.subject?.toLowerCase().trim();
          
          if (sub && weights[sub]) {
            score *= weights[sub];
            // If weight is high (>1.5), mark as recommended
            if (weights[sub] > 1.5) {
              item._feedLabel = `✨ Recommended: ${item.subject}`;
            }
          }
          return { ...item, _localScore: score };
        });

        // Re-sort locally
        feedItems.sort((a: any, b: any) => (b._localScore || 0) - (a._localScore || 0));
      } catch (e) {
        console.error("[Feed] Error applying local weights:", e);
      }

      setItems(feedItems);
    } catch (error: any) {
      console.error(error);
      setErr(error?.message || String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Building your personalised feed…</span>
      </div>
    );
  }

  if (err) return <div className="py-6 text-sm text-red-600">Error loading feed — {err}</div>;

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex items-center justify-between pb-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {items?.length ?? 0} updates tailored for you
        </p>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Shuffling…' : 'Shuffle Feed'}
        </button>
      </div>

      {(!items || items.length === 0) ? (
        <div className="py-6 text-sm text-slate-500">Nothing to show yet.</div>
      ) : (
        items.map((item: FeedItem) => (
          <div key={item.id} className="space-y-1">
            {/* Feed context label — e.g. "✨ For You", "📣 Community Post" */}
            {item._feedLabel && (
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 px-1 tracking-wide">
                {item._feedLabel}
              </p>
            )}
            {item.type === 'post' ? (
              <PostCard post={item} currentUserId={userId} onUpdate={() => loadData(true)} />
            ) : (
              <QuestionCard q={item} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
