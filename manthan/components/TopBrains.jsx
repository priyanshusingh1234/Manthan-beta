'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const getMedalEmoji = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

const getMedalColor = (rank) => {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
  return 'bg-blue-50 text-blue-600';
}

export default function TopBrains() {
  const [topBrains, setTopBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (force = false) => {
    try {
      const url = force ? '/api/leaderboard?refresh=1' : '/api/leaderboard';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.topBrains) {
        setTopBrains(data.topBrains);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('[TopBrains] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    load(false);

    // ── Supabase Realtime: re-fetch immediately when any submission is finalized ──
    // This fires when the AI or peer-check updates a submission status to a terminal state
    const channel = supabase
      .channel('topbrains-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'written_submissions',
          filter: 'status=neq.pending_check',
        },
        () => {
          // Small delay to let auth metadata propagate before refetching
          setTimeout(() => load(true), 2000);
        }
      )
      .subscribe();

    // ── Fallback polling every 15s ──────────────────────────────────────────────
    const interval = setInterval(() => load(false), 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [load]);

  const topScore = topBrains.length > 0 ? topBrains[0].points : 1;

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5 animate-slideUp">
      <h3 className="mb-3 text-lg font-semibold text-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500 animate-float" />
          Top Brains This Week
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 font-normal">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Link href="/leaderboard" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
            View All
          </Link>
        </div>
      </h3>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 opacity-70">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <p className="text-sm font-semibold text-slate-500">Loading ranks...</p>
        </div>
      ) : topBrains.length === 0 ? (
        <div className="py-8 text-center text-sm font-medium text-slate-500">
          No brainiacs found on the leaderboard yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {topBrains.map((u) => {
            const medal = getMedalEmoji(u.rank);
            const percentage = topScore > 0 ? (u.points / topScore) * 100 : 0;
            const gap = topScore - u.points;

            return (
              <li
                key={u.rank}
                className="flex flex-col gap-2 py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-all duration-300 hover:shadow-md overflow-hidden group"
              >
                <Link href={`/user/${u.username}`} className="flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-md ${getMedalColor(u.rank)}`}>
                    {medal || u.rank}
                  </span>
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shadow-sm bg-slate-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold shadow-sm text-xs">
                      {String(u.name[0]).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</div>
                      {u.streak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs">
                          <Flame className="h-3 w-3 text-orange-500 animate-pulse-soft" />
                          <span className="font-semibold text-orange-600">{u.streak}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${u.schoolColor || 'bg-slate-300'}`}></span>
                      <span className="truncate text-xs text-gray-500">{u.school}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{u.points.toLocaleString()}</div>
                    {u.rank > 1 && (
                      <div className="text-xs text-gray-400">-{gap}</div>
                    )}
                  </div>
                </Link>
                {/* Progress Bar */}
                <div className="ml-11 h-1.5 max-w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="ml-11 text-xs text-gray-500">
                  {percentage.toFixed(0)}% of top score
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
