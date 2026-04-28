'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const [excludeIds, setExcludeIds] = useState<string[]>([]);

    // Comment Sheet State
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ username: string; userId: string } | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);

    const fetchFeed = useCallback(async (isInitial = true, targetPostId?: string) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || null;
            if (isInitial) setCurrentUserId(session?.user?.id || null);

            let newExclude = [...excludeIds];
            let initialTargetPost: any = null;

            // If we have a specific target postId (from URL), fetch it specifically first
            if (isInitial && targetPostId) {
                const res = await fetch(`/api/posts/${targetPostId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    initialTargetPost = await res.json();
                    if (initialTargetPost) newExclude.push(targetPostId);
                }
            }

            let url = `/api/clips/feed?limit=10&t=${Date.now()}`;
            if (newExclude.length > 0) {
                url += `&exclude=${newExclude.join(',')}`;
            }

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store'
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            const fetchedPosts = data.posts || [];

            if (fetchedPosts.length === 0 && !initialTargetPost) {
                setHasMore(false);
            } else {
                setExcludeIds(data.excludeIds || []);
                setPosts(prev => {
                    const combined = initialTargetPost 
                        ? [initialTargetPost, ...fetchedPosts] 
                        : fetchedPosts;

                    if (isInitial) return combined;
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = combined.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                if (fetchedPosts.length < 5) setHasMore(false);
            }
        } catch (err) {
            console.error('Clips fetch error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [excludeIds]);

    const searchParams = useSearchParams();
    const targetPostId = searchParams.get('postId');

    useEffect(() => {
        fetchFeed(true, targetPostId || undefined);
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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ 
                    content: newComment,
                    replying_to_user_id: replyingTo?.userId,
                })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [comment, ...prev]);
                setNewComment('');
                setReplyingTo(null);
                setPosts(prev => prev.map(p => p.id === activeCommentPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
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
                        className="w-full bg-[#0a0a0a] rounded-t-[2.5rem] border-t border-white/10 p-6 pt-2 pb-[calc(max(1rem,env(safe-area-inset-bottom))+1rem)] flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-500"
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
                                            <p className="text-white/80 text-[15px] leading-relaxed break-words">
                                                {c.content.split(' ').map((word: string, i: number) => word.startsWith('@') ? <span key={i} className="text-violet-400 font-bold">{word} </span> : word + ' ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 px-1">
                                            <span className="text-[10px] text-white/20 font-black uppercase tracking-wider">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                            <button
                                                onClick={() => {
                                                    const username = c.author?.username || c.author?.name?.replace(/\s+/g, '') || 'scholar';
                                                    setReplyingTo({ username, userId: c.author?.id });
                                                    setNewComment(`@${username} `);
                                                }}
                                                className="text-[11px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                                            >
                                                Reply
                                            </button>
                                        </div>
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
                            <div className="relative flex flex-col shrink-0 mt-2">
                                {replyingTo && (
                                    <div className="flex items-center justify-between px-2 mb-2 bg-white/5 py-1.5 rounded-lg border border-white/10">
                                        <span className="text-[11px] font-bold text-violet-400">Replying to @{replyingTo.username}</span>
                                        <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white p-1"><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                <form onSubmit={submitComment} className="relative flex items-center w-full">
                                    <input
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-[#111] text-white rounded-2xl px-5 py-4 outline-none border border-white/5 focus:border-white/10 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="absolute right-2 w-10 h-10 rounded-full bg-violet-600 active:scale-95 disabled:bg-white/10 disabled:text-white/30 text-white flex items-center justify-center transition-all"
                                    >
                                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                    </button>
                                </form>
                            </div>
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
