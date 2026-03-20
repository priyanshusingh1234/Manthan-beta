"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Send, Clock, User, MoreVertical, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const TeacherBadge = dynamic(() => import('@/ticks/teacher'), { ssr: false });
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
    const [replyingTo, setReplyingTo] = useState<{name: string, userId: string} | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const isOwner = Boolean(currentUserId && post.author?.id === currentUserId);

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
                body: JSON.stringify({ 
                    content: newComment.trim(),
                    replying_to_user_id: replyingTo?.userId || null 
                })
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

    const handleDeletePost = async () => {
        if (!isOwner || deletingPost) return;
        const confirmed = window.confirm('Delete this post? Image and comments will also be deleted.');
        if (!confirmed) return;

        setDeletingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                alert(body.error || 'Failed to delete post');
                return;
            }

            onUpdate();
        } finally {
            setDeletingPost(false);
            setShowMenu(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Link href={post.author?.isTeacher && post.author?.username ? `/teacher/${post.author.username}` : post.author?.username ? `/user/${post.author.username}` : '#'}>
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800">
                            {post.author?.avatar_url ? (
                                <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                            ) : (
                                <User className="w-5 h-5 absolute inset-0 m-auto text-slate-400" />
                            )}
                        </div>
                    </Link>
                    <div>
                        <Link href={post.author?.isTeacher && post.author?.username ? `/teacher/${post.author.username}` : post.author?.username ? `/user/${post.author.username}` : '#'} className="font-bold text-[15px] hover:text-indigo-600 transition-colors text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {post.author?.name || 'Unknown Scholar'}
                            {post.author?.isTeacher && <TeacherBadge />}
                        </Link>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo} 
                            {post.author?.school && ` • ${post.author.school}`}
                        </p>
                    </div>
                </div>

                {isOwner && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowMenu((v) => !v)}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                            aria-label="Post actions"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={handleDeletePost}
                                    disabled={deletingPost}
                                    className="w-full px-3 py-2.5 text-left text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 disabled:opacity-60"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deletingPost ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-5 pb-3">
                <Link href={`/posts/${post.id}`}>
                    <p className="text-slate-800 dark:text-slate-200 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap cursor-pointer hover:text-indigo-600/90 transition-colors">
                        {post.content}
                    </p>
                </Link>
            </div>

            {/* Optional Image */}
            {post.image_url && (
                <Link href={`/posts/${post.id}`}>
                    <div className="mt-2 w-full max-h-[500px] overflow-hidden bg-slate-100 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800 cursor-pointer">
                        <img 
                            src={post.image_url} 
                            alt="Post media" 
                            loading="lazy"
                            className="w-full object-contain max-h-[500px] hover:scale-[1.02] transition-transform duration-500" 
                        />
                    </div>
                </Link>
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

                <Link 
                    href={`/posts/${post.id}`}
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group transition-all hover:text-indigo-600 text-sm font-bold"
                >
                    <div className="p-2 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                        <MessageCircle className="w-5 h-5 group-active:scale-95 transition-transform" />
                    </div>
                    {commentsCount > 0 && <span>{commentsCount}</span>}
                </Link>
            </div>
        </div>
    );
}
