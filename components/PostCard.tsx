"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Clock, User, MoreVertical, Trash2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import VideoClipCard from './VideoClipCard';

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
    feedLabel,
    suppliedCurrentUserData,
}: {
    post: any;
    currentUserId: string | null;
    onUpdate?: (updated?: any | null) => void;
    isSinglePost?: boolean;
    feedLabel?: string;
    suppliedCurrentUserData?: any;
}) {
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(isSinglePost); 
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ username: string; userId: string } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const [likingPost, setLikingPost] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    // MENTION LOGIC
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);

    const suggestionsRef = useRef<HTMLDivElement>(null);
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '').replace('less than ', '');
    const ownerId = post.author?.id || post.author_id || null;
    const isOwner = Boolean(currentUserId && ownerId === currentUserId);

    const [isAdmin, setIsAdmin] = useState(false);
    const [isPinning, setIsPinning] = useState(false);

    useEffect(() => {
        setIsLiked(post.is_liked_by_me || false);
        setLikesCount(typeof post.likes_count === 'number' ? post.likes_count : 0);
        setCommentsCount(typeof post.comments_count === 'number' ? post.comments_count : 0);
        setComments(post.recent_comments || []);
        setIsHidden(false);
    }, [post.id, post.is_liked_by_me, post.likes_count, post.comments_count, post.recent_comments]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [localCurrentUserData, setLocalCurrentUserData] = useState<any>(null);

    const currentUserData = suppliedCurrentUserData !== undefined ? suppliedCurrentUserData : localCurrentUserData;

    useEffect(() => {
        if (suppliedCurrentUserData !== undefined) return;
        
        let mounted = true;
        const syncUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (!mounted) return;

            const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
            if (data?.user?.email && adminEmails.includes(data.user.email)) {
                setIsAdmin(true);
            }
            
            let meta = data?.user?.user_metadata || {};
            if (typeof window !== 'undefined') {
                try {
                    const cached = localStorage.getItem('dheeyudha_user_meta_cache');
                    if (cached) meta = { ...meta, ...JSON.parse(cached) };
                } catch { /* ignore */ }
            }
            setLocalCurrentUserData(meta);
        };

        syncUser();

        const handleUpdate = () => syncUser();
        if (typeof window !== 'undefined') {
            window.addEventListener('user_metadata_updated', handleUpdate);
            window.addEventListener('storage', (e) => {
                if (e.key === 'dheeyudha_user_meta_cache') handleUpdate();
            });
        }

        return () => { 
            mounted = false;
            if (typeof window !== 'undefined') window.removeEventListener('user_metadata_updated', handleUpdate);
        };
    }, [suppliedCurrentUserData]);

    const effectiveAuthor = isOwner && currentUserData ? {
        ...post.author,
        // Prioritize the fresh session metadata (currentUserData) for the owner,
        // because the background feed API might still return a stale joined avatar_url
        // from the database cache.
        avatar_url: (currentUserData.avatar_url && !currentUserData.avatar_url.includes('googleusercontent')) 
            ? currentUserData.avatar_url 
            : (post.author.avatar_url || currentUserData.avatar_url),
        name: currentUserData.fullName || post.author.name || currentUserData.name,
        cosmetics: currentUserData.cosmetics || post.author.cosmetics,
    } : post.author;

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
                        className="text-sky-500 dark:text-sky-400 font-medium hover:underline"
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
                    } catch (err) { console.error('Mention fetch failed:', err); }
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

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId || likingPost) return;
        const prevLiked = isLiked;
        const prevCount = likesCount;
        setIsLiked(!prevLiked);
        setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
        setLikingPost(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error('Failed to like');
            const data = await res.json();
            setIsLiked(!!data?.is_liked);
            if (typeof data?.likes_count === 'number') {
                setLikesCount(data.likes_count);
            }
        } catch {
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
        } finally {
            setLikingPost(false);
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
        } finally { setLoadingComments(false); }
    };

    const toggleComments = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showComments && comments.length === 0) {
            await fetchComments();
        }
        setShowComments((v) => !v);
    };

    const handleDeletePost = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOwner || deletingPost) return;
        const confirmed = window.confirm('Delete this post?');
        if (!confirmed) return;
        setDeletingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) {
                const message = await res.text();
                if (res.status === 404) {
                    setIsHidden(true);
                    onUpdate?.(null);
                    setShowMenu(false);
                    return;
                }
                throw new Error(message || 'Failed to delete post');
            }
            setIsHidden(true);
            onUpdate?.(null); // null = deleted — parent removes card immediately
            setShowMenu(false);
        } catch (err: any) {
            alert(err?.message || 'Failed to delete post');
        } finally { setDeletingPost(false); }
    };

    const handlePinPost = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin || isPinning) return;
        setIsPinning(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const action = post.is_pinned ? 'unpin' : 'pin';
            const res = await fetch(`/api/posts/${post.id}/pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                onUpdate?.();
                alert(action === 'pin' ? 'Post Pinned!' : 'Post Unpinned!');
                setShowMenu(false);
            }
        } finally { setIsPinning(false); }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting || !currentUserId) return;
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
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
        } finally { setIsSubmitting(false); }
    };

    if (isHidden) return null;

    // ── Video clip posts get their own specialised card ─────────────────────
    if (post.video_url) {
        return (
            <VideoClipCard
                post={post}
                currentUserId={currentUserId}
                onUpdate={onUpdate}
                compact={!isSinglePost}
            />
        );
    }

    return (
        <div className={`group/card relative bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isSinglePost ? 'border-none' : 'last:border-0'}`}>
            <div className="flex gap-3 px-4 py-3 sm:px-6 sm:py-4">
                {/* Left: Avatar Column */}
                <div className="flex flex-col items-center flex-shrink-0">
                    <Link href={getProfileUrl(effectiveAuthor) || '#'}>
                        <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 z-10">
                            {effectiveAuthor?.cosmetics?.includes('avatar_glow') && (
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-70 animate-pulse transition-opacity"></div>
                            )}
                            <div className={`relative w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 transition-opacity hover:opacity-80 ${effectiveAuthor?.cosmetics?.includes('avatar_glow') ? 'shadow-[0_0_15px_rgba(99,102,241,0.5)] border-2 border-transparent' : ''}`}>
                                {effectiveAuthor?.avatar_url ? (
                                    <Image src={effectiveAuthor.avatar_url} alt="avatar" fill className="object-cover" />
                                ) : (
                                    <User className="w-6 h-6 absolute inset-0 m-auto text-slate-400" />
                                )}
                            </div>
                        </div>
                    </Link>
                    {/* Thread Line - strictly decorative for 'X' look */}
                    {(showComments || isSinglePost) && comments.length > 0 && (
                         <div className="w-[2px] flex-1 bg-slate-200 dark:bg-slate-800 mt-2 rounded-full mb-1" />
                    )}
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 min-w-0 pb-1">
                    {/* Feed Context Tag — Recommendation reason pill */}
                    {feedLabel && !isSinglePost && (
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${
                            feedLabel.includes('Follow')
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : feedLabel.includes('School') || feedLabel.includes('school')
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : feedLabel.includes('Trending') || feedLabel.includes('trending')
                                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                : feedLabel.includes('Pinned')
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        }`}>
                            {feedLabel}
                        </div>
                    )}

                    {/* Admin Pinned Ribbon */}
                    {post.is_pinned && !isSinglePost && (
                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">
                            <span className="text-[10px]">📌</span> Pinned
                        </div>
                    )}
                    
                    {/* Post Header */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-nowrap">
                            <Link href={getProfileUrl(effectiveAuthor) || '#'} className="group/name block truncate">
                                <BadgedName
                                    name={effectiveAuthor?.name || 'Scholar'}
                                    userId={effectiveAuthor?.id}
                                    isTeacher={isTeacherUser(effectiveAuthor)}
                                    totalPoints={Number(effectiveAuthor?.totalPoints)}
                                    nameClassName="font-bold text-[15px] sm:text-[16px] text-slate-900 dark:text-white group-hover/name:underline decoration-1"
                                    className="flex items-center gap-1 min-w-0"
                                />
                            </Link>
                            <span className="text-[14px] sm:text-[15px] text-slate-500 truncate font-medium ml-0.5">
                                @{getUsername(effectiveAuthor) || 'scholar'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
                            <Link href={`/posts/${post.id}`} className="text-[14px] sm:text-[15px] text-slate-500 font-medium hover:underline hidden sm:inline">
                                {timeAgo}
                            </Link>
                        </div>

                        {(isOwner || isAdmin) && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="p-1.5 -mr-1.5 rounded-full hover:bg-sky-500/10 hover:text-sky-500 text-slate-400 transition-colors"
                                >
                                    <MoreVertical className="w-4.5 h-4.5" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                        {(isOwner || isAdmin) && (
                                            <button
                                                onClick={handleDeletePost}
                                                disabled={deletingPost}
                                                className="w-full px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {deletingPost ? 'Removing...' : 'Delete Content'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={handlePinPost}
                                                disabled={isPinning}
                                                className="w-full px-4 py-3 text-left text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center gap-2 transition-colors disabled:opacity-50 border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <span className="text-[14px]">📌</span>
                                                {isPinning ? 'Processing...' : post.is_pinned ? 'Unpin Post' : 'Pin Post Globally'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Time (only on mobile, if name header overflows) */}
                    <Link href={`/posts/${post.id}`} className="sm:hidden text-[13px] text-slate-500 font-medium mb-1 block">
                        {timeAgo}
                    </Link>

                    {/* Post Text */}
                    <Link href={`/posts/${post.id}`}>
                        <div className="text-slate-800 dark:text-slate-200 text-[15px] sm:text-[16px] leading-[1.6] whitespace-pre-wrap font-normal mb-3 sm:mb-4">
                            {formatMentions(post.content)}
                        </div>
                    </Link>

                    {/* Post Media */}
                    {post.image_url && (
                        <div className={`mb-3 sm:mb-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 ${isSinglePost ? '' : 'cursor-pointer hover:border-slate-200 dark:hover:border-slate-700 transition-colors'}`}>
                            {isSinglePost ? (
                                <img src={post.image_url} alt="Post content" className="w-full h-auto max-h-[800px] object-contain" />
                            ) : (
                                <Link href={`/posts/${post.id}`} className="block">
                                    <img src={post.image_url} alt="Post content" className="w-full h-auto max-h-[512px] object-contain hover:opacity-95 transition-opacity" />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between max-w-[320px] -ml-2 text-slate-500">
                        {/* Reply */}
                        <button
                            onClick={toggleComments}
                            className="group flex items-center gap-1.5 sm:gap-2 pr-4 transition-colors hover:text-sky-500"
                        >
                            <div className="p-2 rounded-full ring-sky-500/0 group-hover:bg-sky-500/10 transition-all">
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] font-medium tracking-tight">{commentsCount > 0 ? commentsCount : ''}</span>
                        </button>

                        {/* Like */}
                        <button
                            onClick={handleLike}
                            disabled={likingPost}
                            className={`group flex items-center gap-1.5 sm:gap-2 pr-4 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                        >
                            <div className={`p-2 rounded-full group-hover:bg-rose-500/10 transition-all ${isLiked ? '' : ''}`}>
                                <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
                            </div>
                            <span className={`text-[13px] font-medium tracking-tight ${isLiked ? 'text-rose-500' : ''}`}>{likesCount > 0 ? likesCount : ''}</span>
                        </button>

                        {/* Share */}
                        <button
                            className="group flex items-center transition-colors hover:text-sky-500"
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
                                try {
                                    if (Capacitor.isNativePlatform()) {
                                        await Share.share({ title: 'Dheeyudha Academy Post', url, dialogTitle: 'Share this post' });
                                        return;
                                    }
                                    if (navigator.share) {
                                        await navigator.share({ title: 'Dheeyudha Academy Post', url });
                                        return;
                                    }
                                    navigator.clipboard.writeText(url);
                                    alert('Link copied!');
                                } catch (err) { console.error(err); }
                            }}
                        >
                            <div className="p-2 rounded-full group-hover:bg-sky-500/10 transition-all">
                                <Share2 className="w-[18px] h-[18px]" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="pb-3 border-t border-slate-50 dark:border-slate-800/50">
                    {loadingComments ? (
                        <div className="text-center py-6 text-slate-400 text-sm flex items-center justify-center gap-2">
                             <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin"></div>
                             Looking for replies...
                        </div>
                    ) : (
                        <div className="mt-2">
                            {comments.map((comment: any) => {
                                const isCommentOwner = currentUserId && comment.author?.id === currentUserId;
                                const effectiveCommentAuthor = isCommentOwner && currentUserData ? {
                                    ...comment.author,
                                    // Same fix as effectiveAuthor: DB avatar takes priority
                                    // over session metadata which may hold a stale Google URL.
                                    avatar_url: comment.author.avatar_url || currentUserData.avatar_url,
                                    name: comment.author.name || currentUserData.fullName,
                                    cosmetics: comment.author.cosmetics || currentUserData.cosmetics,
                                } : comment.author;

                                const commentUsername = getUsername(effectiveCommentAuthor);
                                const safeReplyHandle = commentUsername || 'scholar';
                                return (
                                    <div key={comment.id} className="relative flex gap-3 px-4 py-3 sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        {/* Connector Line for nested comments */}
                                        <div className="absolute left-[38px] sm:left-[48px] top-0 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-last:bottom-auto group-last:h-4" />
                                        
                                        <div className="relative z-10 flex-shrink-0">
                                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 z-10">
                                                {effectiveCommentAuthor?.cosmetics?.includes('avatar_glow') && (
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 animate-pulse"></div>
                                                )}
                                                <div className={`relative w-full h-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 ${effectiveCommentAuthor?.cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-white dark:border-slate-900'}`}>
                                                    {effectiveCommentAuthor?.avatar_url ? (
                                                        <Image src={effectiveCommentAuthor.avatar_url} alt="avatar" width={40} height={40} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <User className="w-5 h-5 m-auto text-slate-400 mt-2" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                <BadgedName
                                                    name={effectiveCommentAuthor.name}
                                                    userId={effectiveCommentAuthor.id}
                                                    isTeacher={isTeacherUser(effectiveCommentAuthor)}
                                                    totalPoints={Number(effectiveCommentAuthor.totalPoints)}
                                                    nameClassName="font-bold text-[14px] text-slate-900 dark:text-white"
                                                />
                                                <span className="text-[13px] text-slate-500 font-medium">@{commentUsername || 'scholar'}</span>
                                                <span className="text-slate-400">·</span>
                                                <span className="text-[13px] text-slate-500 font-medium">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }).replace('about ', '').replace('less than ', '')}
                                                </span>
                                            </div>
                                            <div className="text-[14px] sm:text-[15px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                                <span className="text-sky-500 mr-1 font-medium">@{getUsername(effectiveAuthor)}</span>
                                                {formatMentions(comment.content)}
                                            </div>
                                            
                                            <div className="flex items-center gap-6 mt-2.5 text-slate-500">
                                                <button
                                                    className="group flex items-center gap-1.5 hover:text-sky-500 transition-colors"
                                                    onClick={() => {
                                                        setReplyingTo({ username: safeReplyHandle, userId: comment.author.id });
                                                        setNewComment(`@${safeReplyHandle} `);
                                                    }}
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Reply</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {currentUserId && (
                                <div className="mt-4 pb-2">
                                    <form onSubmit={handleCommentSubmit} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 hidden sm:block">
                                             <User className="w-5 h-5 m-auto text-slate-400 mt-2" />
                                        </div>
                                        <div className="flex-1">
                                            {replyingTo && (
                                                <div className="flex items-center justify-between mb-1.5 px-1">
                                                    <span className="text-[12px] font-medium text-sky-500">Replying to @{replyingTo.username}</span>
                                                    <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => handleCommentChange(e.target.value)}
                                                    placeholder="Post your reply"
                                                    className="flex-1 bg-transparent text-slate-900 dark:text-white text-[15px] sm:text-[16px] outline-none py-1.5 resize-none min-h-[40px] border-b border-transparent focus:border-sky-500 transition-colors"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim() || isSubmitting}
                                                    className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-all h-fit self-end"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}

                             {/* Mention Suggestions */}
                             {suggestions.length > 0 && (
                                <div ref={suggestionsRef} className="absolute mt-2 w-full max-w-[280px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5">
                                    {suggestions.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => insertMention(u)}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100">
                                                {u.avatar_url ? <Image src={u.avatar_url} alt="av" width={32} height={32} /> : <User className="w-4 h-4 m-auto mt-2" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{u.full_name}</p>
                                                <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

