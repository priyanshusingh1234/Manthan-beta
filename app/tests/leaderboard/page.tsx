"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Loader2, Medal } from 'lucide-react';
import Link from 'next/link';

export default function TestsLeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${API_URL}/api/tests/leaderboard`);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-900 text-white pt-12 pb-24 px-6 md:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-indigo-100 hover:text-white font-bold mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md font-black text-sm uppercase tracking-widest mb-4">
                <Trophy className="w-4 h-4 text-yellow-300" />
                Unit Tests Rankings
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Hall of Fame</h1>
              <p className="text-indigo-200 font-medium text-lg">See who is leading the scoreboard in subjective tests!</p>
            </div>
          </div>
        </div>
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-indigo-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-bold text-slate-500">Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Trophy className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black mb-2">No Rankings Yet</h3>
              <p className="text-slate-500 font-medium mb-8">Be the first to complete a subjective test and claim the top spot!</p>
              <Link href="/" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-500/30">
                Go to Tests
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {leaderboard.map((user, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div key={user.userId} className={`flex items-center gap-4 p-4 md:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                    
                    {/* Rank */}
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-xl">
                      {idx === 0 ? <Medal className="w-8 h-8 text-amber-500" /> :
                       idx === 1 ? <Medal className="w-8 h-8 text-slate-400" /> :
                       idx === 2 ? <Medal className="w-8 h-8 text-amber-700" /> :
                       <span className="text-slate-400">#{idx + 1}</span>}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 uppercase">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-black text-lg truncate text-slate-900 dark:text-slate-100">{user.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{user.school}</p>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-xl font-black text-lg min-w-[4rem] text-center">
                        {user.score}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Pts</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
