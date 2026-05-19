'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLeague, getNextLeague, LEAGUES } from '@/lib/leagues';
import LeagueBadge from '@/components/LeagueBadge';
import LeagueUpModal from '@/components/LeagueUpModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, Users, ChevronRight, Calendar, Zap, Shield, Target, Trophy } from 'lucide-react';

const LEAGUE_NAMES = LEAGUES.map(l => l.name);

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
      const res = await fetch('/api/league', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        const currentLeagueName = getLeague(d.monthlyPts).name;
        const lastLeague = localStorage.getItem('last_known_league');
        if (lastLeague && lastLeague !== currentLeagueName) {
          const oldIdx = LEAGUE_NAMES.indexOf(lastLeague);
          const newIdx = LEAGUE_NAMES.indexOf(currentLeagueName);
          if (newIdx > oldIdx) setLeagueUp({ from: lastLeague, to: currentLeagueName });
        }
        localStorage.setItem('last_known_league', currentLeagueName);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-full border-[3px] border-indigo-100 dark:border-indigo-900 border-t-indigo-500 animate-spin" />
      <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Loading your league...</p>
    </div>
  );

  if (!data) return null;

  const { monthlyPts, leagueRank, globalRank, leaderboard, friends, userId, totalPoints } = data;
  const league = getLeague(monthlyPts);
  const nextLeague = getNextLeague(monthlyPts);
  const pctToNext = nextLeague
    ? Math.min(100, Math.round(((monthlyPts - league.min) / (nextLeague.min - league.min)) * 100))
    : 100;
  const ptsToNext = nextLeague ? nextLeague.min - monthlyPts : 0;
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const myEntry = leaderboard.find((p: any) => p.id === userId);

  const TABS = [
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'all', label: 'All Leagues', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      {leagueUp && <LeagueUpModal oldLeagueName={leagueUp.from} newLeagueName={leagueUp.to} onDismiss={() => setLeagueUp(null)} />}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Colored background strip */}
        <div className="absolute inset-0 h-64"
          style={{ background: `linear-gradient(160deg, ${league.gradient[0]} 0%, ${league.gradient[league.gradient.length - 1]} 100%)`, opacity: 0.15 }} />
        <div className="absolute inset-0 h-64 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950" />

        {/* Back button */}
        <div className="relative px-4 pt-4 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">League</h1>
          <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
            {daysLeft}d left
          </span>
        </div>

        {/* Badge + name + stats */}
        <div className="relative px-4 pt-4 pb-6 flex flex-col items-center text-center max-w-sm mx-auto">
          <div style={{ filter: `drop-shadow(0 12px 40px ${league.glow}66)` }}>
            <LeagueBadge name={league.name} size={100} animate />
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight" style={{ color: league.color }}>{league.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">League · {monthlyPts} pts this month</p>

          {/* Rank + pts + days row */}
          <div className="mt-4 flex items-stretch gap-3 w-full">
            {[
              { icon: Crown, label: 'Rank', value: `#${rank}`, color: 'text-amber-500' },
              { icon: Zap, label: 'Monthly', value: `${monthlyPts} pts`, color: 'text-indigo-500' },
              { icon: Calendar, label: 'Days Left', value: `${daysLeft}d`, color: 'text-emerald-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm flex flex-col items-center gap-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {nextLeague ? (
            <div className="mt-4 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                <span className="text-slate-500 dark:text-slate-400">{league.name}</span>
                <span style={{ color: nextLeague.color }}>{nextLeague.name} · {ptsToNext} pts away</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pctToNext}%`, background: `linear-gradient(90deg, ${league.color}, ${nextLeague.color})` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center font-bold">Earn {ptsToNext} more pts to promote</p>
            </div>
          ) : (
            <div className="mt-4 w-full rounded-2xl px-4 py-3 font-black text-sm text-center"
              style={{ background: `${league.color}20`, color: league.color, border: `1px solid ${league.color}40` }}>
              🏆 You're at the highest league!
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex max-w-lg mx-auto px-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-black transition-all relative ${
                tab === key
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── LEADERBOARD ──────────────────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {league.name} League · Ranked by Monthly Points
            </p>

            {/* My position if not in top list */}
            {myEntry && !leaderboard.slice(0, 20).find((p: any) => p.id === userId) && (
              <div className="mb-3 p-3 rounded-2xl border-2 flex items-center gap-3"
                style={{ borderColor: league.color, background: `${league.color}10` }}>
                <span className="text-xs font-black text-slate-400 w-8 text-center">#{rank}</span>
                <div className="flex-1">
                  <p className="font-black text-sm text-slate-900 dark:text-white">You</p>
                </div>
                <span className="font-black text-sm" style={{ color: league.color }}>{monthlyPts} pts</span>
              </div>
            )}

            {leaderboard.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">🏜️</div>
                <p className="font-black text-slate-700 dark:text-slate-300">No one here yet</p>
                <p className="text-sm text-slate-400 mt-1">Earn points to enter the league!</p>
              </div>
            ) : (
              leaderboard.slice(0, 20).map((p: any, i: number) => {
                const isMe = p.id === userId;
                return (
                  <Link key={p.id} href={`/user/${p.username || p.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.99] ${
                      isMe
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}>
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {i === 0 ? <span className="text-xl">🥇</span>
                        : i === 1 ? <span className="text-xl">🥈</span>
                        : i === 2 ? <span className="text-xl">🥉</span>
                        : <span className={`text-sm font-black ${isMe ? 'text-indigo-500' : 'text-slate-400'}`}>#{i + 1}</span>}
                    </div>
                    {/* Avatar */}
                    {p.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0" />
                      : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-base shrink-0"
                          style={{ background: `linear-gradient(135deg, ${league.gradient[0]}, ${league.gradient[league.gradient.length-1]})` }}>
                          {p.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                    }
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {p.full_name}
                        {isMe && <span className="ml-2 text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-500 px-1.5 py-0.5 rounded-full font-black">YOU</span>}
                      </p>
                      {p.username && <p className="text-[11px] text-slate-400 font-bold">@{p.username}</p>}
                    </div>
                    {/* Score — monthly pts + total as tiebreaker */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm" style={{ color: i < 3 ? league.color : 'inherit' }}>
                        {p.monthly_points > 0 ? `${p.monthly_points} m.pts` : `${p.total_points ?? 0} pts`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">{p.monthly_points > 0 ? 'this month' : 'all time'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-700 shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* ── FRIENDS ──────────────────────────────────────────────────────── */}
        {tab === 'friends' && (
          <div className="space-y-1">
            {friends.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">👥</div>
                <p className="font-black text-slate-700 dark:text-slate-300">Follow people to compare leagues</p>
                <Link href="/feed" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30">
                  Explore Feed
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                  {friends.length} Friends · Ranked by Monthly Points
                </p>
                {friends.map((f: any, i: number) => {
                  const fl = getLeague(f.monthly_points || 0);
                  return (
                    <Link key={f.id} href={`/user/${f.username || f.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 active:scale-[0.99] transition-all">
                      <span className="text-sm font-black text-slate-300 dark:text-slate-600 w-6 text-center shrink-0">#{i+1}</span>
                      {f.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={f.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0" />
                        : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0"
                            style={{ background: `linear-gradient(135deg, ${fl.gradient[0]}, ${fl.gradient[fl.gradient.length-1]})` }}>
                            {f.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate text-slate-800 dark:text-slate-100">{f.full_name}</p>
                        <p className="text-[11px] font-bold" style={{ color: fl.color }}>{fl.name} League</p>
                      </div>
                      <LeagueBadge name={fl.name} size={32} />
                      <div className="text-right shrink-0 ml-1">
                        <p className="font-black text-sm text-slate-700 dark:text-slate-300">{f.monthly_points}</p>
                        <p className="text-[10px] text-slate-400 font-bold">pts</p>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── ALL LEAGUES ──────────────────────────────────────────────────── */}
        {tab === 'all' && (
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              9 Leagues · Monthly Points Required
            </p>
            {[...LEAGUES].reverse().map((l) => {
              const isCurrent = l.name === league.name;
              const isNext = nextLeague?.name === l.name;
              const unlocked = LEAGUE_NAMES.indexOf(l.name) <= LEAGUE_NAMES.indexOf(league.name);
              return (
                <div key={l.name}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-900 shadow-md border-2'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                  style={isCurrent ? { borderColor: l.color, boxShadow: `0 4px 24px ${l.glow}25` } : {}}>
                  <div className={`shrink-0 transition-all ${!unlocked && !isNext ? 'opacity-30 grayscale' : ''}`}>
                    <LeagueBadge name={l.name} size={44} animate={isCurrent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100">{l.name}</p>
                      {isCurrent && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: l.color }}>CURRENT</span>
                      )}
                      {isNext && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">NEXT</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-bold">
                      {l.min === 0 ? '0–99' : l.max === Infinity ? `${l.min}+` : `${l.min}–${l.max}`} pts / month
                    </p>
                    {isCurrent && nextLeague && (
                      <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pctToNext}%`, background: l.color }} />
                      </div>
                    )}
                  </div>
                  {unlocked && !isCurrent && (
                    <span className="text-emerald-500 font-black text-lg shrink-0">✓</span>
                  )}
                </div>
              );
            })}

            {/* Reset card */}
            <div className="mt-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <p className="font-black text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-3">
                <Target className="w-4 h-4" /> Monthly Reset Rules
              </p>
              <div className="grid grid-cols-2 gap-1">
                {[['450+ pts','→ 200'],['400–449','→ 200'],['350–399','→ 200'],['250–349','→ 150'],['200–249','→ 150'],['0–199','→ 50']].map(([r,d])=>(
                  <div key={r} className="flex justify-between text-xs text-amber-600 dark:text-amber-500 font-bold bg-white/60 dark:bg-black/20 rounded-xl px-3 py-1.5">
                    <span>{r}</span><span>{d}</span>
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
