'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send, Loader2, User, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import Image from 'next/image';
import BadgedName from '@/components/BadgedName';
import { formatDistanceToNow } from 'date-fns';

export default function SinglePostClient({ postId }: { postId: string }) {
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;
                setCurrentUserId(session?.user?.id || null);
                const headers: Record<string, string> = session?.access_token
                    ? { Authorization: `Bearer ${session.access_token}` } : {};
                const res = await fetch(`/api/posts/${postId}`, { headers });
                if (!mounted) return;
                const data = res.ok ? await res.json() : null;
                setPost(data);
                
                // --- NEW REDIRECT LOGIC ---
                // If this is a video post, we don't show the single page.
                // Instead, we teleport the user to the interactive Clips Feed.
                if (data?.video_url) {
                    router.replace(`/clips?postId=${postId}`);
                    return;
                }

                fetchComments();
            } catch {
                if (mounted) setPost(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [postId]);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments`);
            if (res.ok) setComments(await res.json());
        } catch { }
        finally { setLoadingComments(false); }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment || !currentUserId) return;
        setSubmittingComment(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const c = await res.json();
                setComments(prev => [c, ...prev]);
                setNewComment('');
                refreshPost();
            }
        } finally { setSubmittingComment(false); }
    };

    const refreshPost = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` } : {};
            const res = await fetch(`/api/posts/${postId}`, { headers });
            if (res.ok) setPost(await res.json());
        } catch { }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black">
                <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-white dark:bg-slate-950">
                <p className="text-slate-400 font-bold">Post not found.</p>
            </div>
        );
    }

    // ── Immersive Video View (Mobile Specific) ──────────────────────────
    if (post.video_url) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col md:flex-row overflow-hidden">

                {/* Floating Back Button (Top Left) - Always visible */}
                <button
                    onClick={() => router.push('/clips')}
                    className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-[110] p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* The Immersive Player Shell */}
                <div className="relative flex-1 h-[100dvh] flex items-center justify-center bg-black">
                    <div className="w-full h-full max-w-[450px] aspect-[9/16] relative">
                        <VideoClipCard
                            post={post}
                            currentUserId={currentUserId}
                            onUpdate={(updated) => {
                                if (!updated) router.back();
                                else refreshPost();
                            }}
                            onCommentClick={() => setShowComments(true)}
                            compact={false}
                        />
                    </div>
                </div>

                {/* Desktop Side Panel: Comments (Hidden on mobile) */}
                <div className="hidden md:flex flex-col w-[400px] border-l border-white/10 bg-[#0a0a0a] h-full">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-violet-400" />
                            Discussion
                            <span className="text-xs bg-violet-600 px-2 py-0.5 rounded-full ml-auto">{post.comments_count || 0}</span>
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments.map((c: any) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                    {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px]">{(c.author?.name || 'U')[0]}</div>}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/[0.03]">
                                        <p className="font-black text-white text-[13px] mb-0.5">{c.author?.name || 'Scholar'}</p>
                                        <p className="text-white/70 text-[14px] leading-relaxed">{c.content}</p>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-bold mt-1 px-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {currentUserId && (
                        <form onSubmit={submitComment} className="p-4 border-t border-white/5">
                            <div className="relative flex items-center">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add a reply..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 pr-12 text-white text-sm outline-none focus:border-violet-500 transition-all"
                                />
                                <button type="submit" disabled={!newComment.trim()} className="absolute right-2 p-2 bg-violet-600 rounded-xl text-white">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Mobile Bottom Comments Sheet (Native-style slide up) */}
                <div className="md:hidden">
                    {/* View Comments Trigger (Floating label, bottom center) */}
                    <button
                        onClick={() => setShowComments(true)}
                        className="fixed bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[105] bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full px-6 py-2.5 font-black text-sm flex items-center gap-2 active:scale-95 transition-transform"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count || 0} Comments
                    </button>

                    {showComments && (
                        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-end animate-in fade-in duration-300" onClick={() => setShowComments(false)}>
                            <div
                                className="w-full bg-[#0a0a0a] rounded-t-[2.5rem] border-t border-white/10 p-6 pt-2 pb-[calc(max(2rem,env(safe-area-inset-bottom))+6rem)] flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-500"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-2 mb-6 shrink-0" onClick={() => setShowComments(false)} />
                                <div className="flex items-center justify-between mb-6 shrink-0">
                                    <h3 className="font-black text-xl text-white">Discussions</h3>
                                    <button onClick={() => setShowComments(false)} className="p-2 -mr-2 bg-white/5 rounded-full text-white/40"><X className="w-5 h-5" /></button>
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
                                    {comments.length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center text-white/20">
                                            <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
                                            <p className="font-bold text-sm italic">Be the first to reply!</p>
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
                                        <button type="submit" disabled={!newComment.trim()} className="absolute right-2.5 p-3 bg-violet-600 rounded-xl text-white shadow-lg active:scale-90 transition-transform">
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Regular Text Post View (Standard Scrollable Page) ────────────────
    const profileUrl = post.author?.isTeacher && post.author?.username
        ? `/teacher/${post.author.username}`
        : post.author?.username ? `/user/${post.author.username}` : '#';

    return (
        <div className="min-h-[100dvh] bg-white dark:bg-slate-950 flex flex-col">
            <div 
                className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 flex items-center gap-4 text-slate-900 dark:text-white"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
            >
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-black text-lg tracking-tight">Discussion</h1>
            </div>

            <main 
                className="flex-1 w-full max-w-3xl mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
            >
                <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={profileUrl}>
                            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 shrink-0">
                                {post.author?.avatar_url
                                    ? <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                                    : <User className="w-5 h-5 absolute inset-0 m-auto text-slate-400" />
                                }
                            </div>
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <BadgedName
                                name={post.author?.name || 'Scholar'}
                                userId={post.author?.id}
                                isTeacher={post.author?.isTeacher}
                                totalPoints={Number(post.author?.totalPoints)}
                                nameClassName="font-black text-[16px] text-slate-900 dark:text-slate-100"
                                className="flex items-center gap-1.5 min-w-0"
                            />
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>
                <PostCard post={post} currentUserId={currentUserId} onUpdate={refreshPost} isSinglePost={true} />
            </main>
        </div>
    );
}
