"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Send, Clock, User, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function PostCard({ post, currentUserId, onUpdate }: { post: any, currentUserId: string | null, onUpdate: () => void }) {
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    const handleLike = async () => {
        if (!currentUserId) return alert("Log in to like posts!");
        
        const previousState = isLiked;
        const previousCount = likesCount;
        
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/like`, { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (!res.ok) throw new Error("Failed to toggle like");
        } catch (err) {
            setIsLiked(previousState);
            setLikesCount(previousCount);
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            const data = await res.json();
            if (res.ok) setComments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleComments = () => {
        if (!showComments && comments.length === 0) {
            fetchComments();
        }
        setShowComments(!showComments);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ content: newComment.trim() })
            });

            if (res.ok) {
                const inserted = await res.json();
                setComments([inserted, ...comments]);
                setCommentsCount(commentsCount + 1);
                setNewComment("");
                setReplyingTo(null);
                onUpdate();
            } else {
                alert("Failed to post comment.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.author?.username || post.author?.id}`}>
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800">
                            {post.author?.avatar_url ? (
                                <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                            ) : (
                                <User className="w-5 h-5 absolute inset-0 m-auto text-slate-400" />
                            )}
                        </div>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.author?.username || post.author?.id}`} className="font-bold text-[15px] hover:text-indigo-600 transition-colors text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {post.author?.name || 'Unknown Scholar'}
                            {post.author?.isTeacher && (
                                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Teacher
                                </span>
                            )}
                        </Link>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo} 
                            {post.author?.school && ` • ${post.author.school}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-3">
                <p className="text-slate-800 dark:text-slate-200 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            {/* Optional Image */}
            {post.image_url && (
                <div className="mt-2 w-full max-h-[500px] overflow-hidden bg-slate-100 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800">
                    <img 
                        src={post.image_url} 
                        alt="Post media" 
                        loading="lazy"
                        className="w-full object-contain max-h-[500px] hover:scale-[1.02] transition-transform duration-500" 
                    />
                </div>
            )}

            {/* Actions Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 mt-2">
                <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 group transition-all text-sm font-bold ${isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'}`}
                >
                    <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-rose-50 dark:bg-rose-500/10' : 'group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10'}`}>
                        <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : 'group-active:scale-95'}`} />
                    </div>
                    {likesCount > 0 && <span>{likesCount}</span>}
                </button>

                <button 
                    onClick={toggleComments}
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group transition-all hover:text-indigo-600 text-sm font-bold"
                >
                    <div className="p-2 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                        <MessageCircle className="w-5 h-5 group-active:scale-95 transition-transform" />
                    </div>
                    {commentsCount > 0 && <span>{commentsCount}</span>}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-5 rounded-b-3xl">
                    <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
                            <div className="flex-1 relative">
                                {replyingTo && (
                                    <div className="absolute -top-7 left-0 right-0 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1 rounded-t-xl text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                                        <span>Replying to {replyingTo}</span>
                                        <button type="button" onClick={() => { setReplyingTo(null); setNewComment(""); }} className="hover:text-red-500">Cancel</button>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder={currentUserId ? "Add a comment..." : "Log in to comment"}
                                    disabled={!currentUserId || isSubmitting}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className={`w-full bg-white dark:bg-slate-900 border ${replyingTo ? 'border-indigo-500 rounded-b-xl rounded-tr-xl' : 'border-slate-200 dark:border-slate-700 rounded-xl'} focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 text-sm font-medium outline-none disabled:opacity-50`}
                                />
                            </div>
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || isSubmitting}
                            className="bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center shrink-0"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>

                    <div className="pt-2 space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {loadingComments ? (
                            <div className="text-center py-4 text-xs font-bold text-slate-400 animate-pulse">Loading discussion...</div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-4 text-sm font-medium text-slate-400">No comments yet. Be the first to start the discussion!</div>
                        ) : (
                            // Render from oldest to newest usually for threads, but here it's flat descending
                            // Let's reverse the array just for rendering so visual lines flow logically from top to bottom
                            [...comments].reverse().map((comment: any, idx: number, arr: any[]) => {
                                const isReply = comment.content.startsWith('@');
                                // Check if the previous one wasn't a reply, we can start a "thread" line
                                const isFollowingParent = isReply && idx > 0 && !arr[idx - 1].content.startsWith('@');
                                
                                return (
                                <div key={comment.id} className={`flex gap-3 relative ${isReply ? 'ml-8 lg:ml-12 mt-1' : 'mt-4'}`}>
                                    {isReply && (
                                        <div className="absolute -left-6 top-0 w-6 h-5 border-b-2 border-l-2 border-slate-300 dark:border-slate-700 rounded-bl-xl z-0" />
                                    )}
                                    <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 relative z-10">
                                        {comment.author?.avatar_url ? (
                                            <Image src={comment.author.avatar_url} alt="avatar" fill className="object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 absolute inset-0 m-auto text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <div className={`bg-white dark:bg-slate-800 border ${isReply ? 'border-indigo-100 dark:border-indigo-900/50' : 'border-slate-200 dark:border-slate-700/80'} rounded-2xl p-3 shadow-sm inline-block max-w-[95%]`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100">{comment.author?.name || 'Anonymous'}</span>
                                                {comment.author?.isTeacher && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold mt-1.5 ml-2">
                                            <span className="text-slate-400">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                            {currentUserId && (
                                                <button 
                                                    onClick={() => {
                                                        const name = comment.author?.name || 'User';
                                                        setReplyingTo(name);
                                                        setNewComment(`@${name} `);
                                                    }}
                                                    className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                                                >
                                                    Reply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
