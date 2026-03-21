"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Clock, User, MoreVertical, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const TeacherBadge = dynamic(() => import('@/ticks/teacher'), { ssr: false });
const TopperBadge = dynamic(() => import('@/ticks/topper'), { ssr: false });
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function PostCard({
    post,
    currentUserId,
    onUpdate,
}: {
    post: any;
    currentUserId: string | null;
    onUpdate?: () => void;
}) {
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ username: string; userId: string } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const isOwner = Boolean(currentUserId && post.author?.id === currentUserId);

    function getUsername(user: any): string | null {
        return user?.username || user?.user_metadata?.username || user?.profile?.username || null;
    }

    function isTeacherUser(user: any): boolean {
        return Boolean(user?.isTeacher || user?.is_teacher || user?.user_metadata?.isTeacher);
    }

    function getProfileUrl(user: any) {
        if (!user) return null;
        const username = getUsername(user);
        if (!username) return isOwner ? '/profile' : null;
        return isTeacherUser(user) ? `/teacher/${username}` : `/user/${username}`;
    }

    const handleLike = async () => {
        if (!currentUserId) return alert('Log in to like posts!');

        const prevLiked = isLiked;
        const prevCount = likesCount;

        setIsLiked(!prevLiked);
        setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error('Failed to like');
        } catch {
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${post.id}/comments`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data);
                }
            } finally {
                setLoadingComments(false);
            }
        }

        setShowComments((v) => !v);
    };

    const handleDeletePost = async () => {
        if (!isOwner || deletingPost) return;
        const confirmed = window.confirm('Delete this post? Image and comments will also be deleted.');
        if (!confirmed) return;

        setDeletingPost(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok && onUpdate) onUpdate();
        } finally {
            setDeletingPost(false);
            setShowMenu(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    content: newComment.trim(),
                    replying_to_user_id: replyingTo?.userId || null,
                }),
            });
            if (res.ok) {
                const inserted = await res.json();
                setComments((c) => [inserted, ...c]);
                setCommentsCount((prev: number) => prev + 1);
                setNewComment('');
                setReplyingTo(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-b sm:border border-slate-100 dark:border-slate-800 rounded-none sm:rounded-[2.5rem] overflow-hidden shadow-none sm:shadow-sm hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="p-4 sm:p-6 flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                        const profileUrl = getProfileUrl(post.author);
                        const isTeacher = isTeacherUser(post.author);
                        
                        const AuthorAvatar = (
                             <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-100 dark:border-slate-800 shrink-0">
                                {post.author?.avatar_url ? (
                                    <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                                ) : (
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto text-slate-400" />
                                )}
                            </div>
                        );

                        const AuthorText = (
                            <div className="flex flex-col min-w-0">
                                <div className="font-black text-[14px] sm:text-[16px] text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                    {post.author?.name || 'Unknown Scholar'}
                                    {isTeacher && <TeacherBadge />}
                                    {Number(post.author?.totalPoints) >= 1500 && <TopperBadge />}
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                                    <Clock className="w-2.5 h-2.5" /> {timeAgo}
                                    {post.author?.school && <span className="truncate max-w-[100px] sm:max-w-none"> • {post.author.school}</span>}
                                </p>
                            </div>
                        );

                        if (profileUrl) {
                            return (
                                <Link href={profileUrl} className="flex items-center gap-3 group/author min-w-0">
                                    {AuthorAvatar}
                                    {AuthorText}
                                </Link>
                            );
                        }
                        
                        return (
                            <div className="flex items-center gap-3 min-w-0">
                                {AuthorAvatar}
                                {AuthorText}
                            </div>
                        );
                    })()}
                </div>

                {isOwner && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowMenu((v) => !v)}
                            className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={handleDeletePost}
                                    disabled={deletingPost}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-rose-600 dark:玫瑰-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 disabled:opacity-60 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deletingPost ? 'Removing...' : 'Delete Post'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 pb-4">
                <Link href={`/posts/${post.id}`}>
                    <p className="text-slate-800 dark:text-slate-200 text-[14px] sm:text-[16px] leading-[1.6] sm:leading-relaxed whitespace-pre-wrap cursor-pointer hover:opacity-80 transition-opacity font-medium">
                        {post.content}
                    </p>
                </Link>
            </div>

            {/* Media */}
            {post.image_url && (
                <Link href={`/posts/${post.id}`}>
                    <div className="w-full relative bg-slate-50 dark:bg-slate-950/20 border-y border-slate-50 dark:border-slate-800 cursor-pointer overflow-hidden">
                        <img
                            src={post.image_url}
                            alt="Post media"
                            loading="lazy"
                            className="w-full h-auto max-h-[600px] object-contain sm:hover:scale-[1.01] transition-transform duration-700 ease-out"
                        />
                    </div>
                </Link>
            )}

            {/* Actions */}
            <div className="flex items-center gap-5 sm:gap-7 px-4 sm:px-6 py-4">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 font-black text-xs sm:text-sm transition-all active:scale-95 ${
                        isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                    }`}
                >
                    <Heart className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] ${isLiked ? 'fill-current' : ''}`} /> 
                    <span>{likesCount}</span>
                </button>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-black text-xs sm:text-sm active:scale-95"
                >
                    <MessageCircle className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" /> 
                    <span>{commentsCount}</span>
                </button>
                <div className="ml-auto" />
                <button
                    className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-black text-xs sm:text-sm active:scale-95"
                    onClick={async () => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
                        const title = post?.title || (post?.content ? post.content.slice(0, 60) : 'Check out this post!');
                        
                        try {
                            if (Capacitor.isNativePlatform()) {
                                await Share.share({ title, text: title, url, dialogTitle: 'Share this post' });
                            } else if (navigator.share) {
                                await navigator.share({ title, text: title, url });
                            } else if (navigator.clipboard) {
                                await navigator.clipboard.writeText(url);
                                alert('Link copied!');
                            }
                        } catch (err) { console.error('Sharing failed:', err); }
                    }}
                >
                    <Share2 className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>

            {showComments && (
                <div className="px-5 pb-4">
                    {loadingComments ? (
                        <div className="text-center py-6 text-slate-400">Loading comments...</div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map((comment: any) => {
                                const commentUsername = getUsername(comment.author);
                                const commentProfileUrl = getProfileUrl(comment.author);
                                const safeReplyHandle = commentUsername || 'user';

                                 const AuthorAvatar = (
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                                        {comment.author.avatar_url ? (
                                            <Image
                                                src={comment.author.avatar_url}
                                                alt="avatar"
                                                width={36}
                                                height={36}
                                                className="object-cover w-9 h-9"
                                            />
                                        ) : (
                                            <User className="w-5 h-5 m-auto text-slate-400" />
                                        )}
                                    </div>
                                );

                                return (
                                <div key={comment.id} className="flex gap-3 items-start">
                                    {commentProfileUrl ? (
                                        <Link href={commentProfileUrl}>{AuthorAvatar}</Link>
                                    ) : (
                                        AuthorAvatar
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {commentProfileUrl ? (
                                                <Link
                                                    href={commentProfileUrl}
                                                    className="font-bold text-[13px] sm:text-sm truncate max-w-[120px] text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                                                >
                                                    {comment.author.name}
                                                </Link>
                                            ) : (
                                                <span className="font-bold text-[13px] sm:text-sm truncate max-w-[120px] text-slate-900 dark:text-slate-100">
                                                    {comment.author.name}
                                                </span>
                                            )}
                                            {comment.author.isTeacher && <TeacherBadge />}
                                            <span className="text-xs text-slate-400 ml-2">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl px-4 py-2 mt-1">
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{comment.content}</span>
                                        </div>
                                        <button
                                            className="mt-1 text-xs text-indigo-500 font-bold hover:underline"
                                            onClick={() => {
                                                setReplyingTo({ username: safeReplyHandle, userId: comment.author.id });
                                                setNewComment(`@${safeReplyHandle} `);
                                            }}
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            );})}
                        </div>
                    )}

                    <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex-shrink-0 flex items-center justify-center font-black text-indigo-600 text-sm">
                            ME
                        </div>
                        <div className="flex-1">
                            {replyingTo && (
                                <div className="mb-2 text-xs text-indigo-600">
                                    Replying to @{replyingTo.username}
                                    <button
                                        type="button"
                                        className="ml-2 text-rose-500"
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setNewComment('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            <textarea
                                placeholder="Add to the conversation..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-sm min-h-[70px]"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
