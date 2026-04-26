'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from '@/components/VideoClipCard';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import Image from 'next/image';
import BadgedName from '@/components/BadgedName';
import { Clock, User } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-sm animate-pulse">Loading…</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <p className="text-slate-400 font-bold">Post not found.</p>
            </div>
        );
    }

    // ── Video Page ───────────────────────────────────────────────────────────
    if (post.video_url) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center py-6 px-4">
                
                {/* Shorts-style Vertical Player Shell */}
                <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl justify-center items-stretch lg:max-h-[85vh]">
                    
                    {/* The Video Container - no fixed headers here, global header is above */}
                    <div className="relative w-full max-w-[420px] aspect-[9/16] mx-auto lg:mx-0 bg-black shadow-2xl rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/5 shrink-0">
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

                    {/* Integrated Comments Section (Visible on all screens in standard layout) */}
                    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2rem] overflow-hidden min-h-[400px] lg:min-h-0 shadow-sm transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-violet-500" />
                                Comments
                                <span className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 px-2 py-0.5 rounded-full ml-auto">
                                    {post.comments_count || 0}
                                </span>
                            </h2>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingComments ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 dark:text-white/10">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="font-bold text-sm">Loading discussions...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40 text-slate-400 dark:text-white/40">
                                    <div className="text-4xl mb-2">💬</div>
                                    <p className="font-bold">No comments yet</p>
                                    <p className="text-xs">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-3 group">
                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                                            {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/30 text-[10px]">{(c.author?.name || 'U')[0]}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-white/[0.02]">
                                                <p className="font-black text-slate-900 dark:text-white text-[13px] mb-0.5">{c.author?.name || 'Scholar'}</p>
                                                <p className="text-slate-600 dark:text-white/70 text-[14px] leading-relaxed">{c.content}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold mt-1.5 px-1 inline-block">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        {currentUserId && (
                            <form onSubmit={submitComment} className="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.01]">
                                <div className="relative flex items-center">
                                    <input
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Add to the conversation..."
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 pr-14 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="absolute right-2 p-2.5 bg-violet-600 rounded-xl text-white hover:bg-violet-500 disabled:opacity-40 transition-all shadow-lg shadow-violet-500/20"
                                    >
                                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Vertical Scroll Hint for Mobile */}
                <div className="lg:hidden mt-8 flex flex-col items-center opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 mb-1">Scroll for Details</p>
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/30 animate-bounce" />
                </div>
            </div>
        );
    }

    // ── Regular text/image post ────────────────────────────────────────────
    const profileUrl = post.author?.isTeacher && post.author?.username
        ? `/teacher/${post.author.username}`
        : post.author?.username ? `/user/${post.author.username}` : '#';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Global Header is already handled by ClientLayout */}
            <main className="max-w-3xl mx-auto pt-6 px-4">
                <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={profileUrl}>
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 shrink-0">
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
