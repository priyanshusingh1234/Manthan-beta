'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import SuggestedUsersCard from '@/components/SuggestedUsersCard';
import { PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SocialFeedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchFeed = async (userId: string | null) => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts', {
                headers: userId ? { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } : {}
            });
            const data = await res.json();
            if (res.ok) setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setCurrentUserId(session?.user?.id || null);
                fetchFeed(session?.user?.id || null);
            }
        });
        return () => { mounted = false; };
    }, []);

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
                                <PlusCircle className="w-5 h-5" /> Let's Post
                            </Link>
                        )}
                    </div>

                    {currentUserId && (
                        <div className="sm:hidden mb-6">
                            <Link href="/posts/create" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">
                                <PlusCircle className="w-5 h-5" /> Share Something New
                            </Link>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="font-bold text-slate-500 dark:text-slate-400">Loading timeline...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No posts yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Be the first to share an insight, question, or achievement with the community!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map((p: any) => (
                                <PostCard 
                                    key={p.id} 
                                    post={p} 
                                    currentUserId={currentUserId} 
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
