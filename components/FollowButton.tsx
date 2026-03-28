'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, UserCheck, Loader2, Users, X, Check, CheckCircle2, Search } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import TeacherBadge from '@/ticks/teacher';

export default function FollowButton({ profileUserId, initialFollowers = 0, initialFollowing = 0, compact = false }: { profileUserId: string, initialFollowers?: number, initialFollowing?: number, compact?: boolean }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowers);
    const [followingCount, setFollowingCount] = useState(initialFollowing);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers'); // 'followers' or 'following'
    const [modalUsers, setModalUsers] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        async function checkFollowStatus() {
            try {
                const { count: fCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileUserId);
                if (fCount !== null) setFollowersCount(fCount);

                const { count: cCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileUserId);
                if (cCount !== null) setFollowingCount(cCount);

                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setCurrentUser(user);
                    if (user.id !== profileUserId) {
                        const { data, error } = await supabase
                            .from('follows')
                            .select('*')
                            .eq('follower_id', user.id)
                            .eq('following_id', profileUserId)
                            .maybeSingle();

                        if (data) {
                            setIsFollowing(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking follow status:", err);
            } finally {
                setLoading(false);
            }
        }

        if (profileUserId) {
            checkFollowStatus();
        }
    }, [profileUserId]);

    const handleToggleFollow = async () => {
        if (!currentUser) {
            alert("Please login to follow users.");
            return;
        }

        if (currentUser.id === profileUserId) {
            return;
        }

        // --- OPTIMISTIC UPDATE ---
        const previousIsFollowing = isFollowing;
        const previousFollowersCount = followersCount;

        setIsFollowing(!previousIsFollowing);
        setFollowersCount(prev => previousIsFollowing ? Math.max(0, prev - 1) : prev + 1);
        // -------------------------

        try {
            if (previousIsFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', profileUserId);

                if (error) throw error;
            } else {
                // Follow - use API endpoint to create notification
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('No access token available');
                }

                const response = await fetch('/api/follows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ followingId: profileUserId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to follow user');
                }
            }
        } catch (err) {
            console.error("Follow toggle failed, reverting:", err);
            // REVERT ON FAILURE
            setIsFollowing(previousIsFollowing);
            setFollowersCount(previousFollowersCount);
            alert("Failed to update follow status. Please try again.");
        }
    };

    const openUsersModal = async (type: 'followers' | 'following') => {
        setModalType(type);
        setModalOpen(true);
        setModalLoading(true);
        setModalUsers([]);

        try {
            const res = await fetch(`/api/follows?userId=${profileUserId}&type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setModalUsers(data.users || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setModalLoading(false);
        }
    };

    if (compact) {
        if (loading || (currentUser && currentUser.id === profileUserId)) return null;

        return (
            <button
                onClick={handleToggleFollow}
                disabled={loading}
                className={`
                    shrink-0 ml-2 rounded-full p-2 flex items-center justify-center transition-all duration-300 disabled:opacity-50
                    ${isFollowing
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 group cursor-pointer'
                        : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transform hover:scale-105 active:scale-95 cursor-pointer'}
                `}
                aria-label={isFollowing ? 'Following' : 'Follow'}
            >
                {isFollowing ? (
                    <>
                        <Check size={16} strokeWidth={3} className="group-hover:hidden" />
                        <X size={16} strokeWidth={3} className="hidden group-hover:block" />
                    </>
                ) : (
                    <UserPlus size={16} />
                )}
            </button>
        );
    }

    const StatItem = ({ count, label, onClick }: { count: number, label: string, onClick: () => void }) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center sm:items-start text-center group min-w-[70px]"
        >
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                {label}
            </span>
        </button>
    );

    return (
        <div className="w-full">
            <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-10 w-full`}>

                {/* Followers / Following Stats */}
                <div className="flex justify-around sm:justify-start gap-8 sm:gap-12 w-full sm:w-auto">
                    <StatItem count={followersCount} label="Followers" onClick={() => openUsersModal('followers')} />
                    <StatItem count={followingCount} label="Following" onClick={() => openUsersModal('following')} />
                </div>

                {/* Follow Button - only show if not self and loaded */}
                {!loading && (!currentUser || currentUser.id !== profileUserId) && (
                    <button
                        onClick={handleToggleFollow}
                        disabled={loading}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 group px-8 py-2.5 rounded-xl font-bold transition-all duration-300 ring-2 ring-transparent active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:ring-red-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:hover:ring-red-900/50'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 dark:shadow-indigo-900/20'
                            }`}
                    >
                        {isFollowing ? (
                            <>
                                <UserCheck className="w-5 h-5 group-hover:hidden" />
                                <X className="w-5 h-5 hidden group-hover:block" />
                                <span className="group-hover:hidden">Following</span>
                                <span className="hidden group-hover:block">Unfollow</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                <span>Follow</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Followers/Following Modal - Instagram style */}
            {modalOpen && (
                <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        onClick={() => setModalOpen(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-900 w-full h-[92vh] sm:h-[600px] sm:max-w-md sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        
                        {/* Header with safe area support */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900 sticky top-0 z-10 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-5">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="sm:hidden p-1 mr-4 text-slate-800 dark:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="font-black text-xl text-slate-900 dark:text-white capitalize flex-1 text-center sm:text-left">
                                {modalType}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900">
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder="Search users..."
                                    className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto px-1 py-1">
                            {modalLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-10">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                    <p className="text-sm font-bold text-slate-500 tracking-tight">Syncing community...</p>
                                </div>
                            ) : modalUsers.length > 0 ? (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {modalUsers.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="relative shrink-0">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 group-hover:ring-2 ring-indigo-500/20 transition-all">
                                                        {u.avatar ? (
                                                            <Image src={u.avatar} alt={u.name} width={48} height={48} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg font-black text-indigo-600 bg-gradient-to-tr from-slate-100 to-slate-200">
                                                                {u.name[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{u.name}</h4>
                                                        {u.isTeacher && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400 truncate tracking-tight">@{u.username}</p>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/user/${u.username}`}
                                                onClick={() => setModalOpen(false)}
                                                className="shrink-0 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-lg transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                                            >
                                                View Profile
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                        <Users className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">No {modalType} yet</h4>
                                    <p className="text-sm font-bold text-slate-400">Connections will appear here as the community grows.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
