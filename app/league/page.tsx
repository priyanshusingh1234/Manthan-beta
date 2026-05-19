'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLeague, getNextLeague, LEAGUES } from '@/lib/leagues';
import LeagueBadge from '@/components/LeagueBadge';
import LeagueUpModal from '@/components/LeagueUpModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, Users, ChevronRight, Calendar, Zap, Target } from 'lucide-react';

export default function LeaguePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leagueUp, setLeagueUp] = useState<{ from: string; to: string } | null>(null);
  const [tab, setTab] = useState<'leaderboard' | 'friends' | 'all'>('leaderboard');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await fetch('/api/league', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        const currentLeagueName = getLeague(d.monthlyPts).name;
        const CACHE_KEY = 'last_known_league';
        const lastLeague = localStorage.getItem(CACHE_KEY);
        if (lastLeague && lastLeague !== currentLeagueName) {
          const LEAGUE_NAMES = LEAGUES.map(l => l.name);
          const oldIdx = LEAGUE_NAMES.indexOf(lastLeague);
          const newIdx = LEAGUE_NAMES.indexOf(currentLeagueName);
          if (newIdx > oldIdx) setLeagueUp({ from: lastLeague, to: currentLeagueName });
        }
        localStorage.setItem(CACHE_KEY, currentLeagueName);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
    </div>
  );

  if (!data) return null;

  const { monthlyPts, rank, leaderboard, friends, userId } = data;
  const league = getLeague(monthlyPts);
  const nextLeague = getNextLeague(monthlyPts);
  const pctToNext = nextLeague
    ? Math.min(100, Math.round(((monthlyPts - league.min) / (nextLeague.min - league.min)) * 100))
    : 100;
  const ptsToNext = nextLeague ? nextLeague.min - monthlyPts : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const LEAGUE_NAMES = LEAGUES.map(l => l.name);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {leagueUp && (
        <LeagueUpModal oldLeagueName={leagueUp.from} newLeagueName={leagueUp.to} onDismiss={() => setLeagueUp(null)} />
      )}

      {/* ── Competitive Hero Banner ─────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${league.gradient[0]}ee 0%, ${league.gradient[league.gradient.length - 1]}cc 100%)`,
        paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
      }}>
        {/* Back button */}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-transform"
          style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: league.gradient[0], transform: 'translate(30%,-30%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20" style={{ background: league.gradient[league.gradient.length-1], transform: 'translate(-30%,30%)', filter: 'blur(40px)' }} />

        <div className="relative px-4 pb-8 pt-2 max-w-lg mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <div style={{ filter: `drop-shadow(0 8px 32px ${league.glow}88)` }}>
            <LeagueBadge name={league.name} size={110} animate />
          </div>

          <h1 className="mt-4 text-3xl font-black text-white tracking-tight drop-shadow">{league.name}</h1>
          <p className="text-white/80 text-sm font-bold mt-1">League</p>

          {/* Stats row */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-4 py-2.5">
              <Crown className="w-4 h-4 text-white" />
              <div className="text-left">
                <p className="text-white font-black text-base leading-none">#{rank}</p>
                <p className="text-white/70 text-[10px] font-bold">Your Rank</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-4 py-2.5">
              <Zap className="w-4 h-4 text-white" />
              <div className="text-left">
                <p className="text-white font-black text-base leading-none">{monthlyPts}</p>
                <p className="text-white/70 text-[10px] font-bold">Monthly Pts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-4 py-2.5">
              <Calendar className="w-4 h-4 text-white" />
              <div className="text-left">
                <p className="text-white font-black text-base leading-none">{daysLeft}d</p>
                <p className="text-white/70 text-[10px] font-bold">Days Left</p>
              </div>
            </div>
          </div>

          {/* Progress to next */}
          {nextLeague && (
            <div className="mt-5 w-full max-w-sm">
              <div className="flex justify-between text-xs text-white/80 font-bold mb-2">
                <span>{league.name}</span>
                <span>{ptsToNext} pts to {nextLeague.name}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-white/90 transition-all duration-1000" style={{ width: `${pctToNext}%` }} />
              </div>
            </div>
          )}
          {!nextLeague && (
            <div className="mt-4 px-4 py-2 bg-white/20 rounded-2xl text-white font-black text-sm">
              🎉 You're at the top league!
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: 'leaderboard', label: '🏆 Leaderboard' },
            { key: 'friends', label: `👥 Friends (${friends.length})` },
            { key: 'all', label: '🌐 All Leagues' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-3.5 text-xs font-black transition-colors ${tab === t.key
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-400 dark:text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-28">

        {/* ── Leaderboard Tab ────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-3 uppercase tracking-wider">{league.name} League · Top Players</p>
            {leaderboard.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🏜️</p>
                <p className="font-bold text-slate-600 dark:text-slate-400">No one else in your league yet!</p>
                <p className="text-sm text-slate-400 mt-1">Earn more points to climb up</p>
              </div>
            )}
            <div className="space-y-2">
              {leaderboard.slice(0, 20).map((p: any, i: number) => {
                const isMe = p.id === userId;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                return (
                  <Link key={p.id} href={`/user/${p.username || p.id}`}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.99] ${
                      isMe
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}>
                    <div className="w-9 text-center">
                      {medal
                        ? <span className="text-xl">{medal}</span>
                        : <span className="text-sm font-black text-slate-400">#{i + 1}</span>
                      }
                    </div>
                    {p.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0" />
                      : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black shrink-0">{p.full_name?.[0] || '?'}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {p.full_name} {isMe && <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full ml-1">You</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm" style={{ color: league.color }}>{p.monthly_points}</p>
                      <p className="text-[10px] text-slate-400 font-bold">pts</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Friends Tab ───────────────────────────────────── */}
        {tab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">👥</p>
                <p className="font-bold text-slate-600 dark:text-slate-400">Follow people to see their leagues</p>
                <Link href="/feed" className="mt-4 inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm">Explore Feed</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((f: any, i: number) => {
                  const fl = getLeague(f.monthly_points || 0);
                  return (
                    <Link key={f.id} href={`/user/${f.username || f.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 active:scale-[0.99] transition-all">
                      <span className="text-sm font-black text-slate-400 w-6 text-center">#{i + 1}</span>
                      {f.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={f.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0" />
                        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black shrink-0">{f.full_name?.[0] || '?'}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate text-slate-800 dark:text-slate-100">{f.full_name}</p>
                        <p className="text-xs font-bold" style={{ color: fl.color }}>{fl.name} League</p>
                      </div>
                      <div className="shrink-0">
                        <LeagueBadge name={fl.name} size={36} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm" style={{ color: fl.color }}>{f.monthly_points}</p>
                        <p className="text-[10px] text-slate-400 font-bold">pts</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── All Leagues Tab ───────────────────────────────── */}
        {tab === 'all' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-3 uppercase tracking-wider">Monthly Points Required</p>
            {[...LEAGUES].reverse().map((l) => {
              const isCurrent = l.name === league.name;
              const isNext = nextLeague?.name === l.name;
              const idx = LEAGUE_NAMES.indexOf(l.name);
              const curIdx = LEAGUE_NAMES.indexOf(league.name);
              const isUnlocked = idx <= curIdx;
              return (
                <div key={l.name}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-2 shadow-md bg-white dark:bg-slate-900'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                  style={isCurrent ? { borderColor: l.color, boxShadow: `0 4px 20px ${l.glow}30` } : {}}>
                  <div className={`shrink-0 ${!isUnlocked && !isCurrent && !isNext ? 'opacity-40 grayscale' : ''}`}>
                    <LeagueBadge name={l.name} size={48} animate={isCurrent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-black text-sm ${isCurrent ? '' : 'text-slate-700 dark:text-slate-300'}`}
                        style={isCurrent ? { color: l.color } : {}}>{l.name}</p>
                      {isCurrent && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: l.color }}>YOU ARE HERE</span>}
                      {isNext && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">NEXT</span>}
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{l.min === 0 ? '0–99' : `${l.min}${l.max === Infinity ? '+' : `–${l.max}`}`} pts / month</p>
                    {isCurrent && nextLeague && (
                      <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pctToNext}%`, background: l.color }} />
                      </div>
                    )}
                  </div>
                  {isUnlocked && !isCurrent && (
                    <div className="text-green-500 shrink-0">✓</div>
                  )}
                </div>
              );
            })}

            {/* Reset info card */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-500" />
                <p className="font-black text-sm text-amber-700 dark:text-amber-400">Monthly Reset Rules</p>
              </div>
              <div className="space-y-1 text-xs text-amber-600 dark:text-amber-500 font-bold">
                {[['450+','→ 200'],['400–449','→ 200'],['350–399','→ 200'],['250–349','→ 150'],['200–249','→ 150'],['100–199','→ 50'],['0–99','→ 50']].map(([r,d])=>(
                  <div key={r} className="flex justify-between">
                    <span>{r} pts</span><span>{d} pts next month</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
