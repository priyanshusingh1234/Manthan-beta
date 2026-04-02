'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Medal, Sword, Brain, Shield, Target, Zap, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import { useTopRanks } from '@/hooks/useTopRanks';
import PostCard from './PostCard';
import { supabase } from '@/lib/supabaseClient';

const iconsMapping: Record<string, any> = {
    trophy: Trophy,
    target: Target,
    zap: Zap,
    star: Star,
    shield: Shield,
    sword: Sword,
    brain: Brain
};

interface PublicProfileTabsProps {
  userId: string;
  username: string;
  myRank: number | null;
  totalPoints: number;
  stats: any[];
  recentSolvedQs: any[];
  isTeacher: boolean;
}

export default function PublicProfileTabs({ 
  userId,
  username, 
  myRank, 
  totalPoints, 
  stats, 
  recentSolvedQs,
  isTeacher
}: PublicProfileTabsProps) {
  const { getRank } = useTopRanks();
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'solved' | 'posts'>('stats');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUserId(user?.id || null);
    });
  }, []);

  const fetchUserPosts = async () => {
    if (userPosts.length > 0 || loadingPosts) return;
    setLoadingPosts(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/posts/user/${userId}`, {
            headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        if (res.ok) {
            const data = await res.json();
            setUserPosts(data || []);
        }
    } catch (err) {
        console.error("Failed to fetch user posts:", err);
    } finally {
        setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
        fetchUserPosts();
    }
  }, [activeTab]);

  const liveRank = userId ? getRank(userId) : null;
  const normalizedLiveRank = (liveRank !== undefined && liveRank !== null && Number(liveRank) > 0)
    ? Number(liveRank)
    : null;
  const normalizedServerRank = (myRank !== undefined && myRank !== null && Number(myRank) > 0)
    ? Number(myRank)
    : null;
  const effectiveRank = (normalizedLiveRank && normalizedLiveRank <= 3)
    ? normalizedLiveRank
    : (normalizedServerRank && normalizedServerRank <= 3)
      ? normalizedServerRank
      : normalizedServerRank ?? normalizedLiveRank;

  const achievementsArr = [
    { icon: Medal, title: 'First Victory', description: 'Won your first battle', earned: true },
    { icon: Sword, title: 'Battle Master', description: 'Won 100 battles', earned: totalPoints > 1000 },
    { icon: Brain, title: 'Quiz Genius', description: 'Perfect score in 10 quizzes', earned: true },
    { icon: Award, title: 'Top Tier', description: 'Ranked in top 50 globally', earned: (effectiveRank || 99999) <= 50 },
  ];

  return (
    <div className="w-full">
      {/* Tabs list */}
      <div className="mb-8 relative z-10 overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative shadow-sm">
          <button
            onClick={() => setActiveTab('stats')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'posts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Badges
          </button>
          <button
            onClick={() => setActiveTab('solved')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'solved' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Solved
          </button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {!isTeacher && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center w-full group hover:shadow-lg transition-all">
                                <div className={`${stat.bgColor} dark:bg-slate-800 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                                    {(() => {
                                        const Icon = iconsMapping[stat.icon] || Star;
                                        return <Icon className={`${stat.color} w-5 h-5 sm:w-6 sm:h-6`} />;
                                    })()}
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</div>
                                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {!isTeacher && (
              <div className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-900/40 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-inner group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Achievements</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievementsArr.map((achievement, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-5 rounded-2xl border transition-all duration-300 ${achievement.earned
                        ? 'border-transparent bg-slate-50 dark:bg-slate-800/50'
                        : 'border-slate-100 dark:border-slate-800 bg-transparent opacity-60'
                        }`}
                    >
                      <div
                        className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-sm ${achievement.earned
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                      >
                        <achievement.icon className="w-6 h-6 drop-shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate uppercase text-xs tracking-wider">{achievement.title}</h3>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingPosts ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-slate-500 font-bold italic">Gathering records...</p>
                </div>
            ) : userPosts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                      <LayoutGrid className="w-10 h-10" />
                   </div>
                   <p className="text-slate-400 font-bold italic tracking-tight">This scholar hasn&apos;t posted anything yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                    {userPosts.map((post) => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            currentUserId={currentUserId}
                            onUpdate={() => {
                                // Simple update: just refresh the whole list if needed
                                // (Deletion normally triggers this)
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rank Badge */}
              {(effectiveRank || 99999) <= 3 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center group">
                  <div className="scale-[2] mb-12 mt-6 drop-shadow-2xl">
                    {effectiveRank === 1 ? <GoldBadge /> : effectiveRank === 2 ? <SilverBadge /> : <BronzeBadge />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                    {effectiveRank === 1 ? 'Rank #1 Champion' : effectiveRank === 2 ? 'Rank #2 Elite' : 'Rank #3 Pro'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                    One of the top-tier minds competing on Dheeyudha.
                  </p>
                </div>
              )}

              {/* Topper Badge */}
              {totalPoints >= 1500 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <div className="scale-[1.8] mb-10 mt-4"><TopperBadge /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Lifetime Topper</h3>
                  <p className="text-slate-500 text-sm font-medium px-4">Awarded for achieving over 1,500 lifetime points in battles.</p>
                </div>
              )}

              {/* Placeholder for no badges */}
                {(effectiveRank || 99999) > 3 && totalPoints < 1500 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                      <Award className="w-10 h-10" />
                   </div>
                   <p className="text-slate-400 font-bold italic tracking-tight">No special badges earned yet.</p>
                </div>
              )}
            </div>
        </div>
      )}

      {activeTab === 'solved' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] shadow-sm sm:shadow-lg p-5 sm:p-8 border border-white dark:border-slate-900 relative overflow-hidden group/solved border-slate-100 dark:border-slate-800">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-50 group-hover/solved:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-inner group-hover/solved:scale-110 transition-transform">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Real Solved Questions</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs mb-6 sm:mb-8 font-black uppercase tracking-widest italic opacity-60">Latest triumphs in learning</p>

                <div className="space-y-4">
                    {(!recentSolvedQs || recentSolvedQs.length === 0) ? (
                        <div className="py-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">No questions solved yet.</div>
                    ) : (
                        recentSolvedQs.map((q: any, i: number) => (
                            <Link key={i} href={`/questions/${q.id}`} className="block group/q">
                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-black text-base shadow-inner group-hover/q:scale-105 transition-transform overflow-hidden font-mono shrink-0 border border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-400">{q.subject?.charAt(0) || '?'}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover/q:text-emerald-600 transition-colors truncate">{q.title}</h3>
                                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight truncate">{q.subject}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">+{q.points || q.total_points} Points</span>
                                        </div>
                                        <span>{new Date(q.created_at || q.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                
                {recentSolvedQs && recentSolvedQs.length > 0 && (
                    <div className="mt-8">
                        <Link href={`/user/${username}/solved`} className="block group/btn">
                            <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-900 dark:text-white font-black rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-500">
                                <span>See All Achievements</span>
                                <Trophy className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
