'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ClipsClient() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);

    const fetchFeed = useCallback(async (isInitial = true) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || null;
            if (isInitial) setCurrentUserId(session?.user?.id || null);

            let url = `/api/posts?clipsOnly=true&limit=10&t=${Date.now()}`;
            if (!isInitial && posts.length > 0) {
                const cursor = posts[posts.length - 1].created_at;
                url += `&before=${encodeURIComponent(cursor)}`;
            }

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store'
            });

            if (!res.ok) throw new Error(await res.text());
            const newPosts = await res.json();

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => {
                    if (isInitial) return newPosts;
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                if (newPosts.length < 10) setHasMore(false);
            }
        } catch (err) {
            console.error('Clips fetch error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [posts]);

    useEffect(() => {
        fetchFeed(true);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchFeed(false);
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, fetchFeed]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-white/50 animate-spin mb-4" />
                <p className="text-white/50 font-black text-sm tracking-widest uppercase">Loading Clips</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center space-y-4">
                <button
                    onClick={() => router.push('/news')}
                    className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 p-3 rounded-full bg-white/10 text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <p className="text-white font-bold">No clips found.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden">
            {/* Top Back Nav Button - Universal escape hatch */}
            <button
                onClick={() => router.push('/posts')}
                className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-[110] p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-90 transition-transform shadow-lg shadow-black/50"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="absolute top-[max(1.5rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
                <h1 className="text-white font-black drop-shadow-xl text-lg tracking-widest uppercase">Clips</h1>
            </div>

            {/* Vertical scroll snap container */}
            <div className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar bg-black">
                {posts.map((post) => (
                    <div key={post.id} className="w-full h-[100dvh] snap-center snap-always flex items-center justify-center">
                        <div className="w-full h-full max-w-[450px] aspect-[9/16] relative bg-black">
                            <VideoClipCard
                                post={post}
                                currentUserId={currentUserId}
                                compact={false}
                                onCommentClick={() => {
                                    // Let SinglePostClient handle immersive comments by navigating to it
                                    router.push(`/posts/${post.id}`);
                                }}
                            />
                        </div>
                    </div>
                ))}
                
                {/* Sentinel for infinite scroll */}
                <div ref={observerTarget} className="w-full h-20 snap-center flex items-center justify-center bg-black">
                    {loadingMore && <Loader2 className="w-6 h-6 text-white/50 animate-spin" />}
                    {!hasMore && posts.length > 0 && <p className="text-white/20 text-xs font-black uppercase">You are all caught up</p>}
                </div>
            </div>

            {/* Hide scrollbar styling */}
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </div>
    );
}
