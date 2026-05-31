import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, UserCheck, Loader2, Users, X, Check, CheckCircle2, Search } from 'lucide-react-native';
import { Link } from 'expo-router';
import type { User } from '@supabase/supabase-js';
import TeacherBadge from '@/ticks/teacher';

export default function FollowButton({ profileUserId, initialFollowers = 0, initialFollowing = 0, compact = false, isPrivate = false }: { profileUserId: string, initialFollowers?: number, initialFollowing?: number, compact?: boolean, isPrivate?: boolean }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isRequested, setIsRequested] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowers);
    const [followingCount, setFollowingCount] = useState(initialFollowing);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers'); // 'followers' or 'following'
    const [modalUsers, setModalUsers] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    useEffect(() => {
        async function checkFollowStatus() {
            try {
                const { count: fCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileUserId);
                if (fCount !== null) setFollowersCount(fCount);

                const { count: cCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileUserId);
                if (cCount !== null) setFollowingCount(cCount);

                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user ?? null;

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
                        } else {
                            // Check if requested
                            const { data: reqData } = await supabase
                                .from('follow_requests')
                                .select('*')
                                .eq('follower_id', user.id)
                                .eq('following_id', profileUserId)
                                .maybeSingle();
                            
                            if (reqData) {
                                setIsRequested(true);
                            }
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

    useEffect(() => {
        if (modalOpen) {
            window.dispatchEvent(new Event('hide-nav'));
            document.body.style.overflow = 'hidden';
        } else {
            window.dispatchEvent(new Event('show-nav'));
            document.body.style.overflow = '';
        }
        return () => {
            window.dispatchEvent(new Event('show-nav'));
            document.body.style.overflow = '';
        };
    }, [modalOpen]);

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
        const previousIsRequested = isRequested;
        const previousFollowersCount = followersCount;

        if (isFollowing) {
            setIsFollowing(false);
            setFollowersCount(Math.max(0, followersCount - 1));
        } else if (isRequested) {
            setIsRequested(false);
        } else {
            if (isPrivate) {
                setIsRequested(true);
            } else {
                setIsFollowing(true);
                setFollowersCount(followersCount + 1);
            }
        }
        // -------------------------

        try {
            if (previousIsFollowing || previousIsRequested) {
                // Unfollow or Cancel Request - use DELETE endpoint
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('No access token available');
                }

                const response = await fetch('/api/follows', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ followingId: profileUserId }),
                });

                if (!response.ok) {
                    let apiError = 'Failed to unfollow user';
                    try {
                        const body = await response.json();
                        if (body?.error) {
                            apiError = body.error;
                        }
                    } catch {
                        // ignore parse failures and use default message
                    }
                    throw new Error(apiError);
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
                    let apiError = 'Failed to follow user';
                    try {
                        const body = await response.json();
                        if (body?.error) {
                            apiError = body.error;
                        }
                    } catch {
                        // ignore parse failures and use default message
                    }
                    throw new Error(apiError);
                }
            }
        } catch (err) {
            console.error("Follow toggle failed, reverting:", err);
            // REVERT ON FAILURE
            setIsFollowing(previousIsFollowing);
            setIsRequested(previousIsRequested);
            setFollowersCount(previousFollowersCount);
            alert("Failed to update follow status. Please try again.");
        }
    };

    const openUsersModal = async (type: 'followers' | 'following') => {
        if (isPrivate && !isFollowing && currentUser?.id !== profileUserId) {
            alert("This account is private. Follow them to see their connections.");
            return;
        }
        setModalType(type);
        setModalOpen(true);
        setModalLoading(true);
        setModalUsers([]);
        setModalSearchQuery('');

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

    const filteredModalUsers = useMemo(() => {
        if (!modalSearchQuery.trim()) return modalUsers;
        const q = modalSearchQuery.toLowerCase();
        return modalUsers.filter(u =>
            (u.name?.toLowerCase().includes(q)) ||
            (u.username?.toLowerCase().includes(q))
        );
    }, [modalUsers, modalSearchQuery]);

    if (compact) {
        if (loading || (currentUser && currentUser.id === profileUserId)) return null;

        return (
            <View
                onPress={handleToggleFollow}
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
                ) : isRequested ? (
                    <Text className="text-xs font-bold uppercase tracking-wider">Requested</Text>
                ) : (
                    <UserPlus size={16} />
                )}
            </View>
        );
    }

    const StatItem = ({ count, label, onClick }: { count: number, label: string, onClick: () => void }) => (
        <View
            onPress={onClick}
            className="flex flex-col items-center sm:items-start text-center group min-w-[70px]"
        >
            <Text className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}
            </Text>
            <Text className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                {label}
            </Text>
        </View>
    );

    return (
        <View className="w-full">
            <View className={`flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-10 w-full`}>

                {/* Followers / Following Stats */}
                <View className="flex justify-around sm:justify-start gap-8 sm:gap-12 w-full sm:w-auto flex-row">
                    <StatItem count={followersCount} label="Followers" onPress={() => openUsersModal('followers')} />
                    <StatItem count={followingCount} label="Following" onPress={() => openUsersModal('following')} />
                </View>

                {/* Follow Button - only show if not self and loaded */}
                {!loading && (!currentUser || currentUser.id !== profileUserId) && (
                    <View
                        onPress={handleToggleFollow}
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
                                <Text className="group-hover:hidden">Following</Text>
                                <Text className="hidden group-hover:block">Unfollow</Text>
                            </>
                        ) : isRequested ? (
                            <>
                                <Text>Requested</Text>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                <Text>Follow</Text>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* Followers/Following Modal - Instagram style */}
            {modalOpen && (
                <View className="fixed inset-0 z-[999] flex flex-col justify-end sm:justify-center items-center">
                    {/* Backdrop */}
                    <View
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        onPress={() => setModalOpen(false)}
                    />
                    
                    {/* Modal Content */}
                    <View className="relative bg-white dark:bg-slate-900 w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
                        
                        {/* Header with safe area support */}
                        <View className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900 sticky top-0 z-10 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-5 flex-row">
                            <View
                                onPress={() => setModalOpen(false)}
                                className="sm:hidden p-1 mr-4 text-slate-800 dark:text-white"
                            >
                                <X className="w-6 h-6" />
                            </View>
                            <Text className="font-black text-xl text-slate-900 dark:text-white capitalize flex-1 text-center sm:text-left flex-row">
                                {modalType}
                            </Text>
                            <View
                                onPress={() => setModalOpen(false)}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-row"
                            >
                                <X className="w-5 h-5" />
                            </View>
                        </View>

                        <View className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900">
                            <View className="relative group">
                                <TextInput 
                                    type="text" 
                                    placeholder="Search users..."
                                    value={modalSearchQuery}
                                    onChange={(e) => setModalSearchQuery(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-9 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                {modalSearchQuery && (
                                    <View 
                                        onPress={() => setModalSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={14} />
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* User List */}
                        <View className="flex-1 overflow-y-auto px-1 py-1 flex-row">
                            {modalLoading ? (
                                <View className="flex flex-col items-center justify-center h-full py-10">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                    <Text className="text-sm font-bold text-slate-500 tracking-tight">Syncing community...</Text>
                                </View>
                            ) : filteredModalUsers.length > 0 ? (
                                <View className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredModalUsers.map((u) => (
                                        <View key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group flex-row">
                                            <View className="flex items-center gap-3 min-w-0 flex-row">
                                                <View className="relative shrink-0">
                                                    <View className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 group-hover:ring-2 ring-indigo-500/20 transition-all">
                                                        {u.avatar ? (
                                                            <Image src={u.avatar!} alt={u.name} width={48} height={48} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <View className="w-full h-full flex items-center justify-center text-lg font-black text-indigo-600 bg-gradient-to-tr from-slate-100 to-slate-200 flex-row">
                                                                {u.name[0]?.toUpperCase()}
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <View className="min-w-0">
                                                    <View className="flex items-center gap-1.5 flex-row">
                                                        <Text className="font-bold text-slate-900 dark:text-white truncate">{u.name}</Text>
                                                        {u.isTeacher && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                                                    </View>
                                                    <Text className="text-xs font-bold text-slate-400 truncate tracking-tight">@{u.username}</Text>
                                                </View>
                                            </View>

                                            <Link
                                                href={`/user/${u.username}`}
                                                onPress={() => setModalOpen(false)}
                                                className="shrink-0 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-lg transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                                            >
                                                View Profile
                                            </Link>
                                        </View>
                                    ))}
                                </View>
                            ) : modalUsers.length > 0 ? (
                                <View className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                                    <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 flex-row">
                                        <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                    </View>
                                    <Text className="text-lg font-black text-slate-800 dark:text-white mb-1">No results for &quot;{modalSearchQuery}&quot;</Text>
                                    <Text className="text-sm font-bold text-slate-400">Try searching for a different name or username.</Text>
                                    <View 
                                        onPress={() => setModalSearchQuery('')}
                                        className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                                    >
                                        Clear search
                                    </View>
                                </View>
                            ) : (
                                <View className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                                    <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 flex-row">
                                        <Users className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                    </View>
                                    <Text className="text-lg font-black text-slate-800 dark:text-white mb-1">No {modalType} yet</Text>
                                    <Text className="text-sm font-bold text-slate-400">Connections will appear here as the community grows.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
