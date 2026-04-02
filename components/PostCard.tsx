"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Clock, User, MoreVertical, Trash2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const TeacherBadge = dynamic(() => import('@/ticks/teacher'), { ssr: false });
const TopperBadge = dynamic(() => import('@/ticks/topper'), { ssr: false });
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import BadgedName from './BadgedName';

export default function PostCard({
    post,
    currentUserId,
    onUpdate,
    isSinglePost = false,
}: {
    post: any;
    currentUserId: string | null;
    onUpdate?: () => void;
    isSinglePost?: boolean;
}) {
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(isSinglePost); // Auto-show comments if on single post page
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ username: string; userId: string } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    // MENTION LOGIC
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);

    const suggestionsRef = useRef<HTMLDivElement>(null);
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const isOwner = Boolean(currentUserId && post.author?.id === currentUserId);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isSinglePost && comments.length === 0) {
            fetchComments();
        }
    }, [isSinglePost]);

    function getUsername(user: any): string | null {
        return user?.username || user?.user_metadata?.username || user?.profile?.username || null;
    }

    function getProfileUrl(user: any): string | null {
        const username = getUsername(user);
        if (!username) return null;
        return user?.isTeacher ? `/teacher/${username}` : `/user/${username}`;
    }

    function isTeacherUser(user: any): boolean {
        return user?.isTeacher || user?.is_teacher || user?.user_metadata?.isTeacher || false;
    }

    function formatMentions(text: string) {
        if (!text) return null;
        const parts = text.split(/(@[\w.-]+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                const username = part.substring(1);
                return (
                    <Link
                        key={i}
                        href={`/user/${username}`}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </Link>
                );
            }
            return <span key={i}>{part}</span>;
        });
    }

    const handleCommentChange = async (val: string) => {
        setNewComment(val);

        const activeEl = document.activeElement as HTMLTextAreaElement;
        const cursorPosition = activeEl?.selectionStart || val.length;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const lastAtSign = textBeforeCursor.lastIndexOf('@');

        if (lastAtSign !== -1) {
            const potentialMention = textBeforeCursor.slice(lastAtSign + 1);
            const charBeforeAt = lastAtSign > 0 ? textBeforeCursor[lastAtSign - 1] : ' ';
            const isAtStartOrValidBoundary = lastAtSign === 0 || /[^a-zA-Z0-9_]/.test(charBeforeAt);

            if (isAtStartOrValidBoundary && !/\s/.test(potentialMention)) {
                setMentionSearch(potentialMention);
                setMentionIndex(lastAtSign);

                if (potentialMention.length > 0) {
                    try {
                        const res = await fetch(`/api/search?q=${potentialMention}`);
                        if (res.ok) {
                            const data = await res.json();
                            setSuggestions(data.users || []);
                        }
                    } catch (err) {
                        console.error('Mention fetch failed:', err);
                    }
                } else {
                    setSuggestions([]);
                }
                return;
            }
        }

        setMentionSearch(null);
        setSuggestions([]);
    };

    const insertMention = (suggestion: any) => {
        const username = suggestion.username || suggestion.user_metadata?.username;
        if (!username || mentionIndex === null) return;

        const textBefore = newComment.substring(0, mentionIndex);
        const textAfter = newComment.substring(mentionIndex + (mentionSearch?.length || 0) + 1);
        const updatedContent = `${textBefore}@${username} ${textAfter}`;

        setNewComment(updatedContent);
        setSuggestions([]);
        setMentionSearch(null);
        setMentionIndex(null);
    };

    const handleLike = async () => {
        if (!currentUserId) return;

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

    const fetchComments = async () => {
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
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            await fetchComments();
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
            if (res.ok) {
                if (onUpdate) onUpdate();
            }
        } finally {
            setDeletingPost(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting || !currentUserId) return;

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
                    content: newComment,
                    replying_to_user_id: replyingTo?.userId,
                }),
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]);
                setCommentsCount((c: number) => c + 1);
                setNewComment('');
                setReplyingTo(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href={getProfileUrl(post.author) || '#'}>
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-indigo-100/50 dark:bg-indigo-900/30 border-[2px] border-white dark:border-indigo-800 shrink-0 shadow-sm shadow-indigo-200/50 dark:shadow-none">
                            {post.author?.avatar_url ? (
                                <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                            ) : (
                                <User className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto text-slate-400" />
                            )}
                        </div>
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <Link href={getProfileUrl(post.author) || '#'}>
                            <BadgedName
                                name={post.author?.name || 'Unknown Scholar'}
                                userId={post.author?.id}
                                isTeacher={isTeacherUser(post.author)}
                                totalPoints={Number(post.author?.totalPoints)}
                                nameClassName="font-black text-[14px] sm:text-[16px] text-slate-900 dark:text-slate-100"
                                className="flex items-center gap-1.5 min-w-0"
                            />
                        </Link>
                        {!isSinglePost ? (
                            <Link href={`/posts/${post.id}`}>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-1 mt-0.5 hover:text-indigo-500 transition-colors">
                                    <Clock className="w-2.5 h-2.5" /> {timeAgo}
                                    {post.author?.school && <span className="truncate max-w-[100px] sm:max-w-none"> • {post.author.school}</span>}
                                </p>
                            </Link>
                        ) : (
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> {timeAgo}
                                {post.author?.school && <span className="truncate max-w-[100px] sm:max-w-none"> • {post.author.school}</span>}
                            </p>
                        )}
                    </div>
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
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 disabled:opacity-60 transition-colors"
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
            {!isSinglePost ? (
                <div className="px-6 pb-2">
                    <Link href={`/posts/${post.id}`}>
                        <div className="text-slate-800 dark:text-slate-200 text-[14px] sm:text-[16px] leading-[1.6] sm:leading-relaxed whitespace-pre-wrap cursor-pointer hover:opacity-80 transition-opacity font-medium mb-4">
                            {formatMentions(post.content)}
                        </div>
                    </Link>
                    {post.image_url && (
                        <Link href={`/posts/${post.id}`} className="block relative w-full bg-indigo-100/30 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/40 cursor-pointer overflow-hidden mb-4">
                            <img
                                src={post.image_url}
                                alt="Post media"
                                loading="lazy"
                                className="w-full h-auto max-h-[600px] object-contain sm:hover:scale-[1.01] transition-transform duration-700 ease-out"
                            />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="px-6 pb-2">
                    <div className="text-slate-800 dark:text-slate-200 text-[14px] sm:text-[16px] leading-[1.6] sm:leading-relaxed whitespace-pre-wrap font-medium mb-4">
                        {formatMentions(post.content)}
                    </div>
                    {post.image_url && (
                        <div className="w-full relative bg-indigo-100/30 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/40 overflow-hidden mb-4">
                            <img
                                src={post.image_url}
                                alt="Post media"
                                loading="lazy"
                                className="w-full h-auto max-h-[600px] object-contain"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-5 sm:gap-7 px-4 sm:px-6 py-4">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 font-black text-xs sm:text-sm transition-all active:scale-95 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                        }`}
                >
                    <Heart className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                </button>
                {isSinglePost ? (
                    <button
                        onClick={toggleComments}
                        className={`flex items-center gap-1.5 font-black text-xs sm:text-sm active:scale-95 transition-colors ${showComments ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <MessageCircle className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] ${showComments ? 'fill-indigo-500/10' : ''}`} />
                        <span>{commentsCount}</span>
                    </button>
                ) : (
                    <Link href={`/posts/${post.id}`} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-black text-xs sm:text-sm active:scale-95">
                        <MessageCircle className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
                        <span>{commentsCount}</span>
                    </Link>
                )}
                <div className="ml-auto" />
                <button
                    className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-black text-xs sm:text-sm active:scale-95"
                    onClick={async () => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
                        const title = post?.title || (post?.content ? post.content.slice(0, 60) : 'Check out this post!');

                        try {
                            if (Capacitor.isNativePlatform()) {
                                await Share.share({ title, text: title, url, dialogTitle: 'Share this post' });
                                return;
                            }

                            if (navigator.share) {
                                await navigator.share({ title, text: title, url });
                                return;
                            }

                            if (navigator.clipboard) {
                                await navigator.clipboard.writeText(url);
                                alert('Link copied!');
                            }
                        } catch (err) { console.error('Sharing operation failed:', err); }
                    }}
                >
                    <Share2 className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>

            {showComments && (
                <div className="px-5 pb-4">
                    {loadingComments ? (
                        <div className="text-center py-6 text-slate-400 font-bold italic">Loading comments...</div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map((comment: any) => {
                                const commentUsername = getUsername(comment.author);
                                const commentProfileUrl = getProfileUrl(comment.author);
                                const safeReplyHandle = commentUsername || 'user';

                                return (
                                    <div key={comment.id} className="flex gap-3 items-start group/comment">
                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0">
                                            {comment.author?.avatar_url ? (
                                                <Image src={comment.author.avatar_url} alt="avatar" width={36} height={36} className="object-cover w-9 h-9" />
                                            ) : (
                                                <User className="w-5 h-5 m-auto text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {commentProfileUrl ? (
                                                    <Link href={commentProfileUrl}>
                                                        <BadgedName
                                                            name={comment.author.name}
                                                            userId={comment.author.id}
                                                            isTeacher={isTeacherUser(comment.author)}
                                                            totalPoints={Number(comment.author.totalPoints)}
                                                            nameClassName="font-bold text-[13px] sm:text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <BadgedName
                                                        name={comment.author.name}
                                                        userId={comment.author.id}
                                                        isTeacher={isTeacherUser(comment.author)}
                                                        totalPoints={Number(comment.author.totalPoints)}
                                                        nameClassName="font-bold text-[13px] sm:text-sm text-slate-900 dark:text-slate-100"
                                                    />
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl px-4 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-sm shadow-indigo-100/10 whitespace-pre-wrap">
                                                {formatMentions(comment.content)}
                                            </div>
                                            <button
                                                className="mt-1.5 text-[11px] text-indigo-500 font-black hover:text-indigo-600 uppercase tracking-wider px-1"
                                                onClick={() => {
                                                    setReplyingTo({ username: safeReplyHandle, userId: comment.author.id });
                                                    setNewComment(`@${safeReplyHandle} `);
                                                }}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {currentUserId && (
                                <div className="relative mt-4">
                                    {replyingTo && (
                                        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-x border-t border-indigo-100 dark:border-indigo-800 rounded-t-2xl">
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                                <MessageCircle className="w-3 h-3" /> Replying to @{replyingTo.username}
                                            </span>
                                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
                                                <X className="w-3.5 h-3.5 text-slate-400" />
                                            </button>
                                        </div>
                                    )}
                                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => handleCommentChange(e.target.value)}
                                            placeholder={replyingTo ? "Write your reply..." : "Write a comment..."}
                                            className={`flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[50px] max-h-[150px] resize-none ${replyingTo ? 'rounded-b-2xl' : 'rounded-2xl'}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim() || isSubmitting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 h-[50px] self-end"
                                        >
                                            {isSubmitting ? '...' : 'Post'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* User Suggestions Dropdown */}
                            {suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in slide-in-from-bottom-2"
                                >
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Suggested Scholars</p>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {suggestions.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => insertMention(user)}
                                                className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-800">
                                                    {user.avatar_url ? (
                                                        <Image src={user.avatar_url} alt="avatar" width={32} height={32} className="object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 m-auto text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user.full_name || user.user_metadata?.fullName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 truncate">@{user.username || user.user_metadata?.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
