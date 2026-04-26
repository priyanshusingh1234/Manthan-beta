'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import Image from 'next/image';
import BadgedName from '@/components/BadgedName';
import { Clock, User, Send, Loader2 } from 'lucide-react';
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
                if (data?.video_url) fetchComments();
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
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-white/40 font-bold text-sm animate-pulse">Loading…</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400 font-bold">Post not found.</p>
            </div>
        );
    }

    // ── Video → YouTube Shorts style ───────────────────────────────
    if (post.video_url) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center pt-16 pb-20 sm:pb-4 px-0 sm:px-4">
                {/* Fixed Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-4 text-white">
                    <button onClick={() => router.back()} className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-black text-[15px] leading-tight">🎬 Clip</span>
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Scholar Shorts</span>
                    </div>
                </div>

                {/* Shorts Container */}
                <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1200px] justify-center items-start">
                    
                    {/* The Video Player (Shorts-style 9:16) */}
                    <div className="relative w-full max-w-[450px] aspect-[9/16] mx-auto bg-black shadow-[0_0_50px_rgba(139,92,246,0.1)] sm:rounded-[2.5rem] overflow-hidden border border-white/5 ring-1 ring-white/10 flex-shrink-0">
                        <VideoClipCard
                            post={post}
                            currentUserId={currentUserId}
                            onUpdate={(updated) => {
                                if (!updated) router.back();
                                else refreshPost();
                            }}
                            compact={false}
                        />
                    </div>

                    {/* Desktop Side Panel: Comments / Info */}
                    <div className="hidden lg:flex flex-col w-full max-w-[400px] h-[80vh] bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-violet-400" />
                                Comments
                                <span className="text-xs bg-violet-600 px-2 py-0.5 rounded-full ml-auto">{post.comments_count || 0}</span>
                            </h2>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingComments ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="font-bold text-sm">Fetching discussions...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                                    <div className="text-4xl mb-2">💬</div>
                                    <p className="font-bold">No comments yet</p>
                                    <p className="text-xs">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-3 group">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                            {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{(c.author?.name || 'U')[0]}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/[0.03]">
                                                <p className="font-black text-white text-[13px] mb-0.5">{c.author?.name || 'Scholar'}</p>
                                                <p className="text-white/70 text-[14px] leading-relaxed">{c.content}</p>
                                            </div>
                                            <span className="text-[10px] text-white/30 font-bold mt-1 px-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Comment input */}
                        {currentUserId && (
                            <form onSubmit={submitComment} className="p-4 border-t border-white/5 bg-white/[0.01]">
                                <div className="relative flex items-center">
                                    <input
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Say something nice..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 pr-14 text-white text-sm outline-none focus:border-violet-500 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="absolute right-2 p-2.5 bg-violet-600 rounded-xl text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
                                    >
                                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Mobile Bottom Comments Trigger (Floating badge) */}
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                     <button 
                        onClick={() => setShowComments(true)}
                        className="bg-violet-600 text-white rounded-full px-6 py-3 font-black text-sm shadow-2xl shadow-violet-600/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                     >
                        <MessageCircle className="w-4 h-4" />
                        View {post.comments_count || 0} Comments
                     </button>
                </div>

                {/* Mobile Comments Sheet (Slide up) */}
                {showComments && (
                    <div className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
                        <div className="w-full bg-slate-950 rounded-t-[2.5rem] border-t border-white/10 p-6 pt-2 pb-10 flex flex-col h-[70vh] animate-in slide-in-from-bottom duration-500">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0" onClick={() => setShowComments(false)} />
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h3 className="font-black text-xl text-white">Discussions</h3>
                                <button onClick={() => setShowComments(false)} className="text-white/40 font-bold hover:text-white">Close</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-3">
                                         <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                            {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{(c.author?.name || 'U')[0]}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-2xl rounded-tl-none p-4">
                                                <p className="font-black text-white text-[14px] mb-1">{c.author?.name || 'Scholar'}</p>
                                                <p className="text-white/80 text-[15px]">{c.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {currentUserId && (
                                <form onSubmit={submitComment} className="relative flex items-center shrink-0">
                                    <input
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Add a reply..."
                                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-white text-base outline-none focus:bg-white/[0.15] transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="absolute right-2 p-3 bg-violet-600 rounded-xl text-white"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Regular text/image post ────────────────────────────────────────────
    const profileUrl = post.author?.isTeacher && post.author?.username
        ? `/teacher/${post.author.username}`
        : post.author?.username ? `/user/${post.author.username}` : '#';

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 flex items-center gap-4 text-slate-900 dark:text-white">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-black text-lg tracking-tight">Discussion</h1>
            </div>
            <main className="max-w-3xl mx-auto pt-6 px-4">
                <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={profileUrl}>
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-100 dark:border-slate-800 shrink-0">
                                {post.author?.avatar_url
                                    ? <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                                    : <User className="w-5 h-5 absolute inset-0 m-auto text-slate-400" />
                                }
                            </div>
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <BadgedName
                                name={post.author?.name || 'Unknown Scholar'}
                                userId={post.author?.id}
                                isTeacher={post.author?.is_teacher || post.author?.isTeacher}
                                totalPoints={Number(post.author?.totalPoints)}
                                nameClassName="font-black text-[14px] sm:text-[16px] text-slate-900 dark:text-slate-100"
                                className="flex items-center gap-1.5 min-w-0"
                            />
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {post.comments_count || 0}
                        </div>
                    </div>
                </div>
                <PostCard post={post} currentUserId={currentUserId} onUpdate={refreshPost} isSinglePost={true} />
            </main>
        </div>
    );
}
