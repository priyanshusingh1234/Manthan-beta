'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TeacherBadge from '@/ticks/teacher';
import TopperBadge from '@/ticks/topper';
import Link from 'next/link';
import { UserPlus, Check } from 'lucide-react';
import Image from 'next/image';

interface Suggestion {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    isTeacher: boolean;
    reason: string;
    totalPoints?: number;
}

export default function SuggestedUsersCard() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState<Set<string>>(new Set());

    useEffect(() => {
        let mounted = true;

        async function fetchSuggestions() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                if (mounted) setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/suggestions', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                if (mounted && data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } catch (err) {
                console.error('Failed to fetch suggestions:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchSuggestions();
        return () => { mounted = false; };
    }, []);

    const handleFollow = async (suggestedId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            alert('Please login to follow users.');
            return;
        }

        // Optimistic UI update
        setFollowing(prev => new Set(prev).add(suggestedId));

        try {
            const response = await fetch('/api/follows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ followingId: suggestedId })
            });

            if (!response.ok) {
                throw new Error(`Follow request failed with status ${response.status}`);
            }
        } catch (err) {
            console.error('Follow failed', err);
            // Revert if API fails
            setFollowing(prev => {
                const newSet = new Set(prev);
                newSet.delete(suggestedId);
                return newSet;
            });
        }
    };

    if (loading || suggestions.length === 0) return null;

    return (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[2rem] shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4 px-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">SUGGESTED FOR YOU</h3>
            </div>

            <div className="flex flex-col gap-4">
                {suggestions.map((user) => {
                    const isFollowed = following.has(user.id);

                    return (
                        <div key={user.id} className="flex items-center gap-3 w-full px-2 group cursor-pointer transition-transform hover:-translate-x-1">
                            {/* Avatar */}
                            <Link href={user.isTeacher && user.username ? `/teacher/${user.username}` : user.username ? `/user/${user.username}` : '#'} className="shrink-0 relative h-10 w-10">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    {user.avatar ? (
                                        <Image src={user.avatar} alt={user.name} width={40} height={40} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="font-bold text-slate-400 text-sm">{user.name.charAt(0)}</span>
                                    )}
                                </div>
                            </Link>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex justify-center flex-col h-full items-start">
                                <Link href={user.isTeacher && user.username ? `/teacher/${user.username}` : user.username ? `/user/${user.username}` : '#'} className="flex items-center gap-1.5 min-w-0 max-w-full">
                                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex-shrink">
                                        {user.name}
                                    </p>
                                    {user.isTeacher && <TeacherBadge />}
                                    {Number(user.totalPoints) >= 1500 && <TopperBadge />}
                                </Link>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate w-full mt-0.5">
                                    {user.reason}
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => handleFollow(user.id)}
                                disabled={isFollowed}
                                className={`
                  shrink-0 ml-2 rounded-full p-2 flex items-center justify-center transition-all duration-300
                  ${isFollowed
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                                        : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transform hover:scale-105 active:scale-95 cursor-pointer'}
                `}
                                aria-label={isFollowed ? 'Following' : 'Follow'}
                            >
                                {isFollowed ? <Check size={16} strokeWidth={3} /> : <UserPlus size={16} />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
