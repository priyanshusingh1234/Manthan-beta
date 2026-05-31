import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from '@/lib/next-navigation';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import { ArrowLeft, Loader2, MessageCircle, Send, X } from 'lucide-react-native';
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Always reset scroll to top on mount so we never land at the bottom
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [posts.length === 0 ? 0 : 1]); // fires once posts first arrive

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchFeed(false);
                }
            },
            { threshold: 0.1, rootMargin: '50px' }  // small margin — don't fire on page load
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
            <View className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-white/50 animate-spin mb-4" />
                <Text className="text-white/50 font-black text-sm tracking-widest uppercase">Loading Clips</Text>
            </View>
        );
    }

    if (posts.length === 0) {
        return (
            <View className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center space-y-4">
                <View
                    onPress={() => router.push('/news')}
                    className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 p-3 rounded-full bg-white/10 text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </View>
                <Text className="text-white font-bold">No clips found.</Text>
            </View>
        );
    }

    return (
        <View className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden">
            {/* Top Back Nav Button - Universal escape hatch */}
            <View
                onPress={() => router.push('/posts')}
                className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-[110] p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-90 transition-transform shadow-lg shadow-black/50"
            >
                <ArrowLeft className="w-5 h-5" />
            </View>
            <View className="absolute top-[max(1.5rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
                <Text className="text-white font-black drop-shadow-xl text-lg tracking-widest uppercase">Clips</Text>
            </View>

            {/* Vertical scroll snap container */}
            <View
                ref={scrollContainerRef}
                className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory overscroll-y-contain hide-scrollbar bg-black"
            >
                {posts.map((post) => (
                    <View key={post.id} className="w-full h-[100dvh] snap-center snap-always flex items-center justify-center relative flex-row">
                        <View className="w-full h-full max-w-[450px] aspect-[9/16] relative bg-black">
                            <VideoClipCard
                                post={post}
                                currentUserId={currentUserId}
                                compact={false}
                                onCommentClick={() => openComments(post.id)}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Sentinel outside snap container so it doesn't cause snapping to bottom */}
            <View ref={observerTarget} className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none">
                {loadingMore && (
                    <View className="absolute bottom-6 left-1/2 -translate-x-1/2">
                        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                    </View>
                )}
                {!hasMore && posts.length > 0 && (
                    <Text className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 text-xs font-black uppercase">You are all caught up</Text>
                )}
            </View>

            {/* Mobile Bottom Comments Sheet (Native-style slide up) */}
            {activeCommentPostId && (
                <View className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-end animate-in fade-in duration-300 flex-row" onPress={() => setActiveCommentPostId(null)}>
                    <View
                        className="w-full bg-[#0a0a0a] rounded-t-[2.5rem] border-t border-white/10 p-6 pt-2 pb-[calc(max(1rem,env(safe-area-inset-bottom))+1rem)] flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-500"
                        onPress={e => e.stopPropagation()}
                    >
                        <View className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-2 mb-6 shrink-0" onPress={() => setActiveCommentPostId(null)} />
                        <View className="flex items-center justify-between mb-6 shrink-0 flex-row">
                            <Text className="font-black text-xl text-white">Discussions</Text>
                            <View onPress={() => setActiveCommentPostId(null)} className="p-2 -mr-2 bg-white/5 rounded-full text-white/40"><X className="w-5 h-5" /></View>
                        </View>
                        <View className="flex-1 overflow-y-auto space-y-5 mb-4 flex-row">
                            {comments.map((c: any) => (
                                <View key={c.id} className="flex gap-3 flex-row">
                                    <View className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                        {c.author?.avatar_url ? <Image src={c.author.avatar_url} className="w-full h-full object-cover" /> : <View className="w-full h-full flex items-center justify-center text-white/30 text-xs flex-row">{(c.author?.name || 'U')[0]}</View>}
                                    </View>
                                    <View className="flex-1 min-w-0 flex-row">
                                        <View className="bg-white/5 rounded-[1.25rem] rounded-tl-none p-4">
                                            <Text className="font-black text-white text-[14px] mb-1 truncate">{c.author?.name || 'Scholar'}</Text>
                                            <Text className="text-white/80 text-[15px] leading-relaxed break-words">
                                                {c.content.split(' ').map((word: string, i: number) => word.startsWith('@') ? <Text key={i} className="text-violet-400 font-bold">{word} </Text> : word + ' ')}
                                            </Text>
                                        </View>
                                        <View className="flex items-center gap-4 mt-1 px-1 flex-row">
                                            <Text className="text-[10px] text-white/20 font-black uppercase tracking-wider">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</Text>
                                            <View
                                                onPress={() => {
                                                    const username = c.author?.username || c.author?.name?.replace(/\s+/g, '') || 'scholar';
                                                    setReplyingTo({ username, userId: c.author?.id });
                                                    setNewComment(`@${username} `);
                                                }}
                                                className="text-[11px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                                            >
                                                Reply
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                            {comments.length === 0 && !loadingComments && (
                                <View className="h-40 flex flex-col items-center justify-center text-white/20">
                                    <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
                                    <Text className="font-bold text-sm italic">Be the first to reply!</Text>
                                </View>
                            )}
                            {loadingComments && (
                                <View className="h-40 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                </View>
                            )}
                        </View>
                        {currentUserId && (
                            <View className="relative flex flex-col shrink-0 mt-2">
                                {replyingTo && (
                                    <View className="flex items-center justify-between px-2 mb-2 bg-white/5 py-1.5 rounded-lg border border-white/10 flex-row">
                                        <Text className="text-[11px] font-bold text-violet-400">Replying to @{replyingTo.username}</Text>
                                        <View onPress={() => setReplyingTo(null)} className="text-white/40 hover:text-white p-1"><X className="w-3 h-3" /></View>
                                    </View>
                                )}
                                <View onPress={submitComment} className="relative flex items-center w-full flex-row">
                                    <TextInput
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-[#111] text-white rounded-2xl px-5 py-4 outline-none border border-white/5 focus:border-white/10 transition-colors"
                                    />
                                    <View
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="absolute right-2 w-10 h-10 rounded-full bg-violet-600 active:scale-95 disabled:bg-white/10 disabled:text-white/30 text-white flex items-center justify-center transition-all flex-row"
                                    >
                                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
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
        </View>
    );
}
