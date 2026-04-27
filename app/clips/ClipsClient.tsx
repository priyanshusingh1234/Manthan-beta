'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import { ArrowLeft, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ClipsClient() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Comment Sheet State
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

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

    const openComments = async (postId: string) => {
        setActiveCommentPostId(postId);
        setComments([]);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments`);
            if (res.ok) setComments(await res.json());
        } catch { }
        finally { setLoadingComments(false); }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment || !currentUserId || !activeCommentPostId) return;
        setSubmittingComment(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${activeCommentPostId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const c = await res.json();
                setComments(prev => [c, ...prev]);
                setNewComment('');
                
                // Update post comments count locally
                setPosts(prev => prev.map(p => {
                    if (p.id === activeCommentPostId) {
                        return { ...p, comments_count: (p.comments_count || 0) + 1 };
                    }
                    return p;
                }));
            }
        } finally { setSubmittingComment(false); }
    };

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
                    <div key={post.id} className="w-full h-[100dvh] snap-center snap-always flex items-center justify-center relative">
                        <div className="w-full h-full max-w-[450px] aspect-[9/16] relative bg-black">
                            <VideoClipCard
                                post={post}
                                currentUserId={currentUserId}
                                compact={false}
                                onCommentClick={() => openComments(post.id)}
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

            {/* Mobile Bottom Comments Sheet (Native-style slide up) */}
            {activeCommentPostId && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-end animate-in fade-in duration-300" onClick={() => setActiveCommentPostId(null)}>
                    <div
                        className="w-full bg-[#0a0a0a] rounded-t-[2.5rem] border-t border-white/10 p-6 pt-2 pb-[calc(max(2rem,env(safe-area-inset-bottom))+6rem)] flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-2 mb-6 shrink-0" onClick={() => setActiveCommentPostId(null)} />
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="font-black text-xl text-white">Discussions</h3>
                            <button onClick={() => setActiveCommentPostId(null)} className="p-2 -mr-2 bg-white/5 rounded-full text-white/40"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-5 mb-4">
                            {comments.map((c: any) => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                        {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{(c.author?.name || 'U')[0]}</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-white/5 rounded-[1.25rem] rounded-tl-none p-4">
                                            <p className="font-black text-white text-[14px] mb-1 truncate">{c.author?.name || 'Scholar'}</p>
                                            <p className="text-white/80 text-[15px] leading-relaxed break-words">{c.content}</p>
                                        </div>
                                        <span className="text-[10px] text-white/20 font-black mt-1 px-1 uppercase tracking-wider">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && !loadingComments && (
                                <div className="h-40 flex flex-col items-center justify-center text-white/20">
                                    <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="font-bold text-sm italic">Be the first to reply!</p>
                                </div>
                            )}
                            {loadingComments && (
                                <div className="h-40 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                </div>
                            )}
                        </div>
                        {currentUserId && (
                            <form onSubmit={submitComment} className="relative flex items-center shrink-0">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add comments..."
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-white text-base outline-none focus:bg-white/20 transition-all shadow-xl"
                                />
                                <button type="submit" disabled={!newComment.trim() || submittingComment} className="absolute right-2.5 p-3 bg-violet-600 rounded-xl text-white shadow-lg active:scale-90 transition-transform">
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

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
