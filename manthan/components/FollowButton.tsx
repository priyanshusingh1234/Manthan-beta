'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, UserCheck, Loader2, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import TeacherBadge from '@/ticks/teacher';

export default function FollowButton({ profileUserId, initialFollowers = 0, initialFollowing = 0 }: { profileUserId: string, initialFollowers?: number, initialFollowing?: number }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowers);
    const [followingCount, setFollowingCount] = useState(initialFollowing);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

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

        setActionLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', profileUserId);

                if (!error) {
                    setIsFollowing(false);
                    setFollowersCount(prev => Math.max(0, prev - 1));
                }
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

                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Follow toggle failed:", err);
            alert("Failed to follow user. Please try again.");
        } finally {
            setActionLoading(false);
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

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-slate-100 w-full">

                {/* Followers / Following Stats */}
                <div className="flex gap-8">
                    <button
                        onClick={() => openUsersModal('followers')}
                        className="flex flex-col items-center sm:items-start text-center group"
                    >
                        <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{followersCount}</span>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 uppercase tracking-widest mt-1">Followers</span>
                    </button>

                    <button
                        onClick={() => openUsersModal('following')}
                        className="flex flex-col items-center sm:items-start text-center group"
                    >
                        <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{followingCount}</span>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 uppercase tracking-widest mt-1">Following</span>
                    </button>
                </div>

                {/* Follow Button - only show if not self and loaded */}
                {!loading && (!currentUser || currentUser.id !== profileUserId) && (
                    <button
                        onClick={handleToggleFollow}
                        disabled={actionLoading}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 group px-8 py-3 rounded-2xl font-bold transition-all duration-300 ring-2 ring-transparent active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:ring-red-100'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300'
                            }`}
                    >
                        {actionLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isFollowing ? (
                            <>
                                <UserCheck className="w-5 h-5 group-hover:hidden" />
                                <UserPlus className="w-5 h-5 hidden group-hover:block" />
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

            {/* Followers/Following Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-slideUp">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                {modalType}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {modalLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                                    <p>Loading {modalType}...</p>
                                </div>
                            ) : modalUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-500">No {modalType} found</p>
                                    <p className="text-sm mt-1">When users follow, they will appear here.</p>
                                </div>
                            ) : (
                                modalUsers.map(u => (
                                    <Link
                                        key={u.id}
                                        href={u.isTeacher ? `/teacher/${u.username}` : `/user/${u.username}`}
                                        onClick={() => setModalOpen(false)}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                                    >
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover bg-slate-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center text-lg font-bold text-indigo-500">
                                                {u.name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                {u.name}
                                                {u.isTeacher && <TeacherBadge />}
                                            </div>
                                            <div className="text-sm font-mono text-slate-500">@{u.username}</div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
