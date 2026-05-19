'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLeague, getNextLeague, LEAGUES } from '@/lib/leagues';
import LeagueBadge from '@/components/LeagueBadge';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users, Crown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaguePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await fetch('/api/league', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setData(await res.json());
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
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

  // Days left in month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' }}>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/5 px-4 pt-4 pb-3 flex items-center gap-3" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-black text-white">Leagues</h1>
        <span className="ml-auto text-xs text-white/40 font-bold">{daysLeft}d left this month</span>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6 pt-6">

        {/* Hero — Current League */}
        <div className="relative rounded-3xl overflow-hidden" style={{ background: `radial-gradient(ellipse at top, ${league.glow}22 0%, #0a0a1a 70%)`, border: `1px solid ${league.glow}30` }}>
          <div className="p-6 flex flex-col items-center text-center">
            <div className="mb-2">
              <LeagueBadge name={league.name} size={120} animate />
            </div>
            <h2 className="text-3xl font-black text-white mt-3 tracking-tight">{league.name} <span className="text-white/40">League</span></h2>
            <p className="text-white/50 text-sm mt-1">{monthlyPts} monthly points</p>

            {/* Rank badge */}
            <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 border border-white/10">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-white font-black text-sm">Rank #{rank}</span>
              <span className="text-white/40 text-xs">in {league.name}</span>
            </div>
          </div>

          {/* Progress to next league */}
          {nextLeague && (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-white/50 font-bold">{league.name}</span>
                <span className="font-black" style={{ color: nextLeague.color }}>{nextLeague.name} — {ptsToNext} pts away</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pctToNext}%`, background: `linear-gradient(90deg, ${league.color}, ${nextLeague.color})`, boxShadow: `0 0 10px ${league.glow}` }}
                />
              </div>
              <p className="text-center text-white/30 text-xs mt-2">Earn {ptsToNext} more pts to reach {nextLeague.name}</p>
            </div>
          )}
        </div>

        {/* All Leagues Overview */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-black text-sm">All Leagues</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[...LEAGUES].reverse().map((l) => {
              const isCurrent = l.name === league.name;
              return (
                <div key={l.name} className={`flex items-center gap-3 px-4 py-3 ${isCurrent ? 'bg-white/10' : ''}`}>
                  <LeagueBadge name={l.name} size={36} />
                  <div className="flex-1">
                    <p className={`font-black text-sm ${isCurrent ? 'text-white' : 'text-white/60'}`}>{l.name}</p>
                    <p className="text-white/30 text-xs">{l.min === 0 ? '0' : l.min}+ pts / month</p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full text-white" style={{ background: l.color }}>YOU</span>
                  )}
                  {nextLeague?.name === l.name && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/10 text-white/60">NEXT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Friends' Leagues */}
        {friends.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-black text-sm">Friends' Leagues</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {friends.map((f: any) => {
                const fl = getLeague(f.monthly_points || 0);
                return (
                  <Link key={f.id} href={`/user/${f.username || f.id}`} className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 w-24 active:scale-95 transition-transform">
                    <div className="relative">
                      {f.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={f.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                        : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-black">{f.full_name?.[0]}</div>
                      }
                      <div className="absolute -bottom-1 -right-1">
                        <LeagueBadge name={fl.name} size={20} />
                      </div>
                    </div>
                    <p className="text-white/80 text-[11px] font-bold text-center leading-tight truncate w-full">{f.full_name?.split(' ')[0]}</p>
                    <p className="text-[10px] font-black" style={{ color: fl.color }}>{fl.name}</p>
                    <p className="text-white/30 text-[9px]">{f.monthly_points} pts</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-black text-sm">{league.name} Leaderboard</h3>
            </div>
            <div className="divide-y divide-white/5">
              {leaderboard.slice(0, 15).map((p: any, i: number) => {
                const isMe = p.id === userId;
                return (
                  <Link key={p.id} href={`/user/${p.username || p.id}`}
                    className={`flex items-center gap-3 px-4 py-3 active:bg-white/5 transition-colors ${isMe ? 'bg-white/10' : ''}`}>
                    <span className={`w-7 text-center font-black text-sm ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/30'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    {p.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-black shrink-0">{p.full_name?.[0]}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-white/80'}`}>{p.full_name} {isMe && '(You)'}</p>
                    </div>
                    <span className="font-black text-sm" style={{ color: league.color }}>{p.monthly_points}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-10 text-white/30">
            <p className="font-bold">No one else in your league yet.</p>
            <p className="text-sm mt-1">Earn points to climb!</p>
          </div>
        )}
      </div>
    </div>
  );
}
