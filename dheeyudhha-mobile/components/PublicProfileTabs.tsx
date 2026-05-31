import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Award, Star, Medal, Sword, Brain, Shield, Target, Zap, LayoutGrid, Loader2, Play } from 'lucide-react-native';
import { Link } from 'expo-router';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import TopperBadge from '@/ticks/topper';
import TeacherBadge from '@/ticks/teacher';
import AdminVerifiedTick from '@/ticks/admin';
import { useTopRanks } from '@/hooks/useTopRanks';
import PostCard from './PostCard';
import VideoClipCard from './VideoClipCard';
import { supabase } from '@/lib/supabaseClient';
import AchievementCards from '@/components/AchievementCards';

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
  weeklyReport?: any;
  isPrivate?: boolean;
  cosmetics?: string[];
}

// ─── Clip thumbnail tile for the 3-col grid ────────────────────────────────
function ClipThumbnailTile({ clip }: { clip: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <Link href={`/clips?postId=${clip.id}`} className="group relative block aspect-[9/16] bg-slate-900 overflow-hidden rounded-lg sm:rounded-xl">
      {clip.video_thumbnail ? (
        <Image src={clip.video_thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <video
          ref={videoRef}
          src={clip.video_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        />
      )}
      {/* Dark overlay on hover */}
      <View className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
      {/* Play icon on hover */}
      <View className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-row">
        <View className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 flex-row">
          <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
        </View>
      </View>
      {/* Duration badge */}
      {duration > 0 && (
        <Text className="absolute bottom-2 right-2 text-[10px] font-black bg-black/70 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          {fmtTime(duration)}
        </Text>
      )}
      {/* Gradient at bottom */}
      <View className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </Link>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function PublicProfileTabs({ 
  userId,
  username, 
  myRank, 
  totalPoints, 
  stats, 
  recentSolvedQs,
  isTeacher,
  weeklyReport,
  isPrivate,
  cosmetics
}: PublicProfileTabsProps) {
  const { getRank } = useTopRanks();
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'solved' | 'posts' | 'clips'>('stats');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userClips, setUserClips] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingClips, setLoadingClips] = useState(false);
  const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
  const [hasFetchedClips, setHasFetchedClips] = useState(false);
  const [postsFetchError, setPostsFetchError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localCosmetics, setLocalCosmetics] = useState<string[]>([]);
  const [equipping, setEquipping] = useState(false);

  useEffect(() => {
    setLocalCosmetics(cosmetics || []);
  }, [cosmetics]);

  const equipBadge = async (badgeId: string) => {
     if (currentUserId !== userId || equipping) return;
     setEquipping(true);
     const newCosmetics = localCosmetics.filter(c => !c.startsWith('equipped_badge_'));
     if (badgeId !== 'none') newCosmetics.push(`equipped_badge_${badgeId}`);
     setLocalCosmetics(newCosmetics);

     try {
         const { data: { session } } = await supabase.auth.getSession();
         await fetch('/api/user/equip-badge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            body: JSON.stringify({ badgeId })
         });
     } catch (e) {
         console.error(e);
     } finally {
         setEquipping(false);
     }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUserId(session?.user?.id || null);
        if (session?.user?.id && isPrivate && session.user.id !== userId) {
            supabase.from('follows').select('*').eq('follower_id', session.user.id).eq('following_id', userId).maybeSingle().then(({data}) => {
                if (data) setIsFollowing(true);
            });
        }
    });
  }, [userId, isPrivate]);

  const fetchUserPosts = async (force = false) => {
    if (loadingPosts) return;
    if (!force && hasFetchedPosts) return;
    setLoadingPosts(true);
    setPostsFetchError(null);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/posts/user/${userId}?t=${Date.now()}`, {
          headers: { 
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
            'Cache-Control': 'no-cache'
          }
        });
        if (res.ok) {
            const data = await res.json();
            setUserPosts(Array.isArray(data) ? data : []);
            setHasFetchedPosts(true);
        } else {
            const errData = await res.json().catch(() => ({}));
            const msg = errData?.error || `Server error ${res.status}`;
            console.error('[PublicProfileTabs] posts fetch failed:', res.status, msg);
            setPostsFetchError(msg);
        }
    } catch (err: any) {
        console.error("Failed to fetch user posts:", err);
        setPostsFetchError(err?.message || 'Network error');
    } finally {
        setLoadingPosts(false);
    }
  };

  // Fetch clips (posts with video_url)
  const fetchUserClips = async (force = false) => {
    if (loadingClips) return;
    if (!force && hasFetchedClips) return;
    setLoadingClips(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/posts/user/${userId}?t=${Date.now()}`, {
          headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
        });
        if (res.ok) {
            const data = await res.json();
            setUserClips((Array.isArray(data) ? data : []).filter((p: any) => !!p.video_url));
            setHasFetchedClips(true);
        }
    } catch (err) { console.error(err); }
    finally { setLoadingClips(false); }
  };

  useEffect(() => {
    if (activeTab === 'posts') fetchUserPosts(true);
    if (activeTab === 'clips') fetchUserClips(true);
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

  // battlesAttempted & battlesWon come through the `stats` array passed from the server
  const battlesAttempted = parseInt(stats.find(s => s.icon === 'zap')?.value || '0', 10);
  const battlesWon       = parseInt(stats.find(s => s.icon === 'trophy')?.value || '0', 10);

  return (
    <View className="w-full">
      {/* Tabs list */}
      <View className="mb-8 relative z-10 overflow-x-auto no-scrollbar">
        <View className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative shadow-sm flex-row">
          <View
            onPress={() => setActiveTab('stats')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Stats
          </View>
          <View
            onPress={() => setActiveTab('posts')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'posts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Posts
          </View>
          <View
            onPress={() => setActiveTab('clips')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'clips' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            🎬 Clips
          </View>
          <View
            onPress={() => setActiveTab('badges')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Badges
          </View>
          <View
            onPress={() => setActiveTab('solved')}
            className={`relative z-10 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'solved' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Solved
          </View>
        </View>
      </View>

      {activeTab === 'stats' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {!isTeacher && (
                <View className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <View key={i} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center w-full group hover:shadow-lg transition-all">
                                <View className={`${stat.bgColor} dark:bg-slate-800 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                                    {(() => {
                                        const Icon = iconsMapping[stat.icon] || Star;
                                        return <Icon className={`${stat.color} w-5 h-5 sm:w-6 sm:h-6`} />;
                                    })()}
                                </View>
                                <View className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</View>
                                <View className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">{stat.label}</View>
                            </View>
                        );
                    })}
                </View>
            )}
            
            {/* PUBLIC WEEKLY REPORT */}
            {weeklyReport && !isTeacher && (
              <View className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <View className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></View>

                <View className="flex items-center gap-4 mb-8 flex-row">
                  <View className="p-3.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-inner group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
                  </View>
                  <Text className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Report</Text>
                </View>

                <View className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <View className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
                    <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 group-hover/card:scale-110 transition-transform flex-row">
                      <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </View>
                    <Text className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Accuracy</Text>
                    <View className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{weeklyReport.stats.accuracy}<Text className="text-3xl text-slate-400">%</Text></View>
                    <View className="text-sm font-semibold mt-4 text-slate-500">
                      {weeklyReport.stats.correctAttempts} / {weeklyReport.stats.totalAttempts} questions
                    </View>
                    <View className="mt-4 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                      <View className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${weeklyReport.stats.accuracy}%` }} />
                    </View>
                  </View>

                  <View className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl border border-indigo-400 shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-transform group/card text-white relative overflow-hidden">
                    <View className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></View>
                    <View className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 group-hover/card:scale-110 transition-transform backdrop-blur-sm flex-row">
                      <Star className="w-7 h-7 text-white drop-shadow-sm" />
                    </View>
                    <Text className="font-bold text-indigo-100 uppercase tracking-widest text-xs mb-2">Weekly Rating</Text>
                    <View className="text-4xl font-black text-white tracking-tight leading-tight">{weeklyReport.rating.label}</View>
                    <Text className="text-sm font-medium text-emerald-50 mt-4 bg-black/20 px-4 py-3 rounded-xl inline-block border border-white/10 backdrop-blur-md leading-relaxed">{weeklyReport.rating.message}</Text>
                  </View>

                  <View className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition-transform group/card">
                    <View className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 dark:border-orange-800 group-hover/card:scale-110 transition-transform flex-row">
                        <Zap className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                    </View>
                    <Text className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">Active Days</Text>
                    <View className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{weeklyReport.stats.activeDays}<Text className="text-2xl text-slate-400">/7</Text></View>
                    <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl inline-block border border-emerald-100 dark:border-emerald-800">
                      Active this week
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {!isTeacher && (
              <View className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-6 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <View className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></View>
                <View className="flex items-center gap-4 mb-6 flex-row">
                  <View className="p-3.5 bg-blue-50 dark:bg-blue-900/40 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-inner">
                    <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </View>
                  <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Achievements</Text>
                </View>
                <AchievementCards userId={userId} battlesWon={battlesWon} battlesAttempted={battlesAttempted} />
              </View>
            )}
        </View>
      )}

      {activeTab === 'posts' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isPrivate && currentUserId !== userId && !isFollowing ? (
                <View className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                   <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 flex-row">
                      <Shield className="w-10 h-10" />
                   </View>
                   <Text className="text-xl font-black text-slate-900 dark:text-white">This Account is Private</Text>
                   <Text className="text-slate-500 font-medium">Follow them to see their posts and clips.</Text>
                </View>
            ) : loadingPosts ? (
                <View className="py-20 text-center flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <Text className="text-slate-500 font-bold italic">Gathering records...</Text>
                </View>
            ) : postsFetchError ? (
                <View className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm">
                   <Text className="text-red-400 font-bold italic tracking-tight">Could not load posts. Tap to retry.</Text>
                   <View onPress={() => fetchUserPosts(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Retry</View>
                </View>
            ) : userPosts.length === 0 ? (
                <View className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                   <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 flex-row">
                      <LayoutGrid className="w-10 h-10" />
                   </View>
                   <Text className="text-slate-400 font-bold italic tracking-tight">This scholar hasn&apos;t posted anything yet.</Text>
                </View>
            ) : (
                <View className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                    {userPosts.map((post) => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            currentUserId={currentUserId}
                            onUpdate={(updatedPost?: any) => {
                                if (!updatedPost) {
                                    // Post was deleted — remove it from local state immediately (no ghost)
                                    setUserPosts(prev => prev.filter(p => p.id !== post.id));
                                } else {
                                    // Post was updated — replace in place
                                    setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
                                }
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
      )}

      {/* ── Clips tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'clips' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isPrivate && currentUserId !== userId && !isFollowing ? (
              <View className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 flex-row">
                    <Shield className="w-10 h-10" />
                 </View>
                 <Text className="text-xl font-black text-slate-900 dark:text-white">This Account is Private</Text>
                 <Text className="text-slate-500 font-medium">Follow them to see their clips.</Text>
              </View>
          ) : loadingClips ? (
            <View className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
              <Text className="text-slate-500 font-bold italic">Loading clips…</Text>
            </View>
          ) : userClips.length === 0 ? (
            <View className="py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <View className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center text-4xl shadow-inner flex-row">🎬</View>
              <Text className="text-slate-400 font-bold italic tracking-tight">No clips posted yet.</Text>
              <Text className="text-slate-400 text-sm max-w-xs">When this scholar posts a 30-second clip, it will appear here.</Text>
            </View>
          ) : (
            <View>
              {/* Header */}
              <View className="flex items-center gap-2 mb-4 flex-row">
                <Text className="text-xl">🎬</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white">Clips</Text>
                <Text className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{userClips.length}</Text>
              </View>

              {/* Full VideoClipCard stack — same card as community feed */}
              <View className="flex flex-col gap-3 max-w-sm mx-auto">
                {userClips.map((clip) => (
                  <Link
                    key={clip.id}
                    href={`/clips?postId=${clip.id}`}
                    className="block rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-violet-200/40 dark:hover:shadow-violet-900/30 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-200"
                    onPress={(e) => {
                      // only navigate if NOT clicking an interactive element inside the card
                      const target = e.target as HTMLElement;
                      // Include 'video' and 'button' specifically to allow play/pause toggle in feed
                      const interactive = target.closest('button, a[href]:not([href="#"]), video');
                      if (interactive && interactive !== e.currentTarget) {
                        e.preventDefault();
                        return;
                      }
                    }}
                  >
                    <VideoClipCard
                      post={clip}
                      currentUserId={currentUserId}
                      onUpdate={(updated) => {
                        if (!updated) setUserClips(prev => prev.filter(c => c.id !== clip.id));
                        else setUserClips(prev => prev.map(c => c.id === updated.id ? updated : c));
                      }}
                      compact={true}
                    />
                  </Link>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'badges' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <View className="flex justify-between items-center mb-6 px-2 flex-row">
             <Text className="font-black text-xl text-slate-900 dark:text-white">Your Badges</Text>
             {currentUserId === userId && localCosmetics.some(c => c.startsWith('equipped_badge_')) && (
                <View 
                  onPress={() => equipBadge('none')}
                  disabled={equipping}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Unequip Active Badge
                </View>
             )}
           </View>
           <View className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rank Badge */}
              {(effectiveRank || 99999) <= 3 && (
                <View className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border ${localCosmetics.includes(`equipped_badge_${effectiveRank === 1 ? 'gold' : effectiveRank === 2 ? 'silver' : 'bronze'}`) ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center text-center relative`}>
                  <View className="scale-[2] mb-12 mt-6 drop-shadow-2xl">
                    {effectiveRank === 1 ? <GoldBadge /> : effectiveRank === 2 ? <SilverBadge /> : <BronzeBadge />}
                  </View>
                  <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                    {effectiveRank === 1 ? 'Rank #1 Champion' : effectiveRank === 2 ? 'Rank #2 Elite' : 'Rank #3 Pro'}
                  </Text>
                  <Text className="text-slate-500 text-sm font-medium leading-relaxed px-4 mb-6">
                    One of the top-tier minds competing on Dheeyudha.
                  </Text>
                  {currentUserId === userId && (
                      <View 
                         onPress={() => equipBadge(effectiveRank === 1 ? 'gold' : effectiveRank === 2 ? 'silver' : 'bronze')}
                         disabled={equipping}
                         className={`w-full py-3 rounded-2xl font-black transition-all ${localCosmetics.includes(`equipped_badge_${effectiveRank === 1 ? 'gold' : effectiveRank === 2 ? 'silver' : 'bronze'}`) ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                         {localCosmetics.includes(`equipped_badge_${effectiveRank === 1 ? 'gold' : effectiveRank === 2 ? 'silver' : 'bronze'}`) ? 'Equipped' : 'Equip'}
                      </View>
                  )}
                </View>
              )}

              {/* Topper Badge */}
              {totalPoints >= 1500 && (
                <View className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border ${localCosmetics.includes('equipped_badge_topper') ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center text-center relative`}>
                  <View className="scale-[1.8] mb-10 mt-4"><TopperBadge /></View>
                  <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Lifetime Topper</Text>
                  <Text className="text-slate-500 text-sm font-medium px-4 mb-6">Awarded for achieving over 1,500 lifetime points in battles.</Text>
                  {currentUserId === userId && (
                      <View 
                         onPress={() => equipBadge('topper')}
                         disabled={equipping}
                         className={`w-full py-3 rounded-2xl font-black transition-all ${localCosmetics.includes('equipped_badge_topper') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                         {localCosmetics.includes('equipped_badge_topper') ? 'Equipped' : 'Equip'}
                      </View>
                  )}
                </View>
              )}

              {/* Teacher Badge */}
              {isTeacher && (
                <View className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border ${localCosmetics.includes('equipped_badge_teacher') ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center text-center relative`}>
                  <View className="scale-[2] mb-10 mt-6"><TeacherBadge /></View>
                  <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Verified Teacher</Text>
                  <Text className="text-slate-500 text-sm font-medium px-4 mb-6">Recognized educator on Dheeyudha platform.</Text>
                  {currentUserId === userId && (
                      <View 
                         onPress={() => equipBadge('teacher')}
                         disabled={equipping}
                         className={`w-full py-3 rounded-2xl font-black transition-all ${localCosmetics.includes('equipped_badge_teacher') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                         {localCosmetics.includes('equipped_badge_teacher') ? 'Equipped' : 'Equip'}
                      </View>
                  )}
                </View>
              )}

              {/* Admin Tick */}
              {/* Note: We rely on the parent page or admins route if possible, but let's assume they have it if it's in their cosmetics already OR we can just check if they are admin, but we don't have adminsData here. We will just check if they ever equipped it, or if we can pass isAdmin down. For now, if they don't have it equipped, we might not know if they are an admin. We need to pass isAdmin down from page.tsx to accurately list it. But it's fine for admins to just show if they have equipped it before, or we can just omit it from the selection list here unless they are known admin. */}
              {localCosmetics.includes('equipped_badge_admin') && (
                <View className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border ${localCosmetics.includes('equipped_badge_admin') ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center text-center relative`}>
                  <View className="scale-[2] mb-10 mt-6"><AdminVerifiedTick /></View>
                  <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Verified Admin</Text>
                  <Text className="text-slate-500 text-sm font-medium px-4 mb-6">Platform Administrator.</Text>
                  {currentUserId === userId && (
                      <View 
                         onPress={() => equipBadge('admin')}
                         disabled={equipping}
                         className={`w-full py-3 rounded-2xl font-black transition-all ${localCosmetics.includes('equipped_badge_admin') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                         {localCosmetics.includes('equipped_badge_admin') ? 'Equipped' : 'Equip'}
                      </View>
                  )}
                </View>
              )}

              {/* Placeholder for no badges */}
                {(effectiveRank || 99999) > 3 && totalPoints < 1500 && !isTeacher && !localCosmetics.includes('equipped_badge_admin') && (
                <View className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                   <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 flex-row">
                      <Award className="w-10 h-10" />
                   </View>
                   <Text className="text-slate-400 font-bold italic tracking-tight">No special badges earned yet.</Text>
                </View>
              )}
            </View>
        </View>
      )}

      {activeTab === 'solved' && (
        <View className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <View className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] shadow-sm sm:shadow-lg p-5 sm:p-8 border border-white dark:border-slate-900 relative overflow-hidden group/solved border-slate-100 dark:border-slate-800">
                <View className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-50 group-hover/solved:opacity-100 transition-opacity"></View>
                <View className="flex items-center gap-4 mb-4 flex-row">
                    <View className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-inner group-hover/solved:scale-110 transition-transform">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    </View>
                    <Text className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Real Solved Questions</Text>
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs mb-6 sm:mb-8 font-black uppercase tracking-widest italic opacity-60">Latest triumphs in learning</Text>

                <View className="space-y-4">
                    {(!recentSolvedQs || recentSolvedQs.length === 0) ? (
                        <View className="py-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">No questions solved yet.</View>
                    ) : (
                        recentSolvedQs.map((q: any, i: number) => (
                            <Link key={i} href={`/questions/${q.id}`} className="block group/q">
                                <View className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    <View className="flex items-center justify-between mb-3 flex-row">
                                        <View className="flex items-center gap-3 sm:gap-4 min-w-0 flex-row">
                                            <View className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-black text-base shadow-inner group-hover/q:scale-105 transition-transform overflow-hidden font-mono shrink-0 border border-slate-100 dark:border-slate-800 flex-row">
                                                <Text className="text-slate-400">{q.subject?.charAt(0) || '?'}</Text>
                                            </View>
                                            <View className="min-w-0">
                                                <Text className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover/q:text-emerald-600 transition-colors truncate">{q.title}</Text>
                                                <Text className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight truncate">{q.subject}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex-row">
                                        <View className="flex items-center gap-2 flex-row">
                                            <Text className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">+{q.points || q.total_points} Points</Text>
                                        </View>
                                        <Text>{new Date(q.created_at || q.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
                                    </View>
                                </View>
                            </Link>
                        ))
                    )}
                </View>
                
                {recentSolvedQs && recentSolvedQs.length > 0 && (
                    <View className="mt-8">
                        <Link href={`/user/${username}/solved`} className="block group/btn">
                            <View className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-900 dark:text-white font-black rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 flex-row">
                                <Text>See All Achievements</Text>
                                <Trophy className="w-4 h-4" />
                            </View>
                        </Link>
                    </View>
                )}
            </View>
        </View>
      )}
    </View>
  );
}
