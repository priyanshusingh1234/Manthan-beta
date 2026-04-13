'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import SuggestedUsersCard from '@/components/SuggestedUsersCard';
import { PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SocialFeedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Fetch posts from /api/feed so the weighted suggestion algorithm applies.
    // Filter to post-type items only — questions are shown in the home feed.
    const fetchFeed = useCallback(async (uid: string | null) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || null;
            const res = await fetch(`/api/feed?t=${Date.now()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            if (!res.ok) throw new Error(await res.text());
            const rawData = await res.json();
            const allItems = Array.isArray(rawData) ? rawData : (rawData?.questions || []);
            setPosts(allItems.filter((item: any) => item.type === 'post'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                const uid = session?.user?.id || null;
                setCurrentUserId(uid);
                fetchFeed(uid);
            }
        });
        return () => { mounted = false; };
    }, [fetchFeed]);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full mix-blend-overlay filter blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl" />

            <main className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 w-full lg:flex lg:gap-8 justify-center">

                <div className="w-full lg:max-w-2xl flex-shrink overflow-x-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3 border border-purple-200/50 dark:border-purple-800/50">
                                <Sparkles className="w-3.5 h-3.5" /> Community Discussion
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                                Social Fire
                            </h1>
                        </div>
                        {currentUserId && (
                            <Link href="/posts/create" className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-colors">
                                <PlusCircle className="w-5 h-5" /> Let&apos;s Post
                            </Link>
                        )}
                    </div>

                    {currentUserId && (
                        <Link href="/posts/create" className="sm:hidden fixed bottom-20 right-6 z-50 flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.5)] hover:bg-indigo-500 active:scale-90 transition-all">
                            <PlusCircle className="w-6 h-6" />
                        </Link>
                    )}

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse space-y-3">
                                    <div className="h-2.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No posts yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Be the first to share an insight, question, or achievement with the community!</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {posts.map((p: any) => (
                                <PostCard
                                    key={p.id}
                                    post={p}
                                    currentUserId={currentUserId}
                                    feedLabel={p._feedLabel}
                                    onUpdate={() => fetchFeed(currentUserId)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="hidden lg:block w-[320px] shrink-0 xl:w-[340px]">
                    <div className="sticky top-28">
                        <SuggestedUsersCard />
                    </div>
                </div>

            </main>
        </div>
    );
}
