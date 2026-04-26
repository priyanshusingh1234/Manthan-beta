'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Heart, MessageCircle,
    Share2, Download, BadgeCheck, MoreVertical, Trash2, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// ─── Cloudinary watermark URL ──────────────────────────────────────────────────
function buildWatermarkedUrl(videoUrl: string): string {
    if (!videoUrl.includes('cloudinary.com')) return videoUrl;
    return videoUrl.replace(
        '/upload/',
        '/upload/l_text:Arial_28_bold:Dheeyudha,co_white,o_60,g_south_east,x_15,y_15/'
    );
}

interface VideoClipCardProps {
    post: any;
    currentUserId: string | null;
    onUpdate?: (updated?: any) => void;
    compact?: boolean;
}

export default function VideoClipCard({ post, currentUserId, onUpdate, compact = true }: VideoClipCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [likingPost, setLikingPost] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
        .replace('about ', '').replace('less than ', '');

    const ownerId = post.author?.id || post.author_id || null;
    const isOwner = Boolean(currentUserId && ownerId === currentUserId);

    useEffect(() => {
        const check = async () => {
            const { data } = await supabase.auth.getUser();
            const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
            if (data?.user?.email && adminEmails.includes(data.user.email)) setIsAdmin(true);
        };
        check();
    }, []);

    // ── Video controls ──────────────────────────────────────────────────────────
    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
    };

    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        setProgress((v.currentTime / v.duration) * 100);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
    };

    const handleMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (!entry.isIntersecting) { v.pause(); setPlaying(false); } },
            { threshold: 0.3 }
        );
        obs.observe(v);
        return () => obs.disconnect();
    }, []);

    // ── Like ──────────────────────────────────────────────────────────────────
    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUserId || likingPost) return;
        const prev = isLiked; const prevCount = likesCount;
        setIsLiked(!prev); setLikesCount(prev ? prevCount - 1 : prevCount + 1);
        setLikingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setIsLiked(!!data?.is_liked);
            if (typeof data?.likes_count === 'number') setLikesCount(data.likes_count);
        } catch { setIsLiked(prev); setLikesCount(prevCount); }
        finally { setLikingPost(false); }
    };

    // ── Comments ─────────────────────────────────────────────────────────────
    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            if (res.ok) setComments(await res.json());
        } finally { setLoadingComments(false); }
    };

    const toggleComments = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showComments && comments.length === 0) await fetchComments();
        setShowComments(v => !v);
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment || !currentUserId) return;
        setSubmittingComment(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const c = await res.json();
                setComments(prev => [c, ...prev]);
                setCommentsCount((n: number) => n + 1);
                setNewComment('');
            }
        } finally { setSubmittingComment(false); }
    };

    // ── Share ─────────────────────────────────────────────────────────────────
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/posts/${post.id}`;
        const title = `🎬 ${post.author?.name || 'Scholar'}'s clip on Dheeyudha`;
        const text = post.content?.trim() ? post.content.slice(0, 100) : 'Check out this clip on Dheeyudha!';
        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({ title, text, url, dialogTitle: 'Share Clip' });
                return;
            }
            if (navigator.share) { await navigator.share({ title, text, url }); return; }
            navigator.clipboard.writeText(url);
            alert('Link copied!');
        } catch { /* ignore */ }
    };

    // ── Download ─────────────────────────────────────────────────────────────
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(buildWatermarkedUrl(post.video_url) + '?dl=dheeyudha-clip.mp4', '_blank');
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Delete this clip?')) return;
        setDeletingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (res.ok || res.status === 404) { setIsHidden(true); onUpdate?.(null); }
        } finally { setDeletingPost(false); setShowMenu(false); }
    };

    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const authorUsername = post.author?.username;
    const authorProfileUrl = authorUsername ? `/user/${authorUsername}` : '#';
    const singlePostUrl = `/posts/${post.id}`;

    if (isHidden) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* ── Author header ── */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <Link href={authorProfileUrl}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 ring-2 ring-violet-500/30">
                        {post.author?.avatar_url
                            ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center font-black text-violet-400 bg-violet-50 dark:bg-violet-900/30 text-sm">{(post.author?.name || 'U')[0].toUpperCase()}</div>
                        }
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Link href={authorProfileUrl} className="font-black text-[14px] text-slate-900 dark:text-white hover:underline truncate">
                            {post.author?.name || 'Scholar'}
                        </Link>
                        {post.author?.isTeacher && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" fill="#3b82f6" />}
                    </div>
                    <p className="text-[12px] text-slate-400 font-medium">
                        {authorUsername && <span>@{authorUsername} · </span>}
                        {timeAgo}
                    </p>
                </div>
                {/* Clip badge + menu */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link href={singlePostUrl} className="flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2.5 py-1 rounded-full shadow-sm shadow-violet-500/20">
                        🎬 Clip
                    </Link>
                    {(isOwner || isAdmin) && (
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deletingPost}
                                        className="w-full px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {deletingPost ? 'Deleting...' : 'Delete Clip'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Caption ── */}
            {post.content?.trim() && (
                <p className="px-4 pb-2 text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {post.content}
                </p>
            )}

            {/* ── Video player ── */}
            <div
                className="relative bg-black overflow-hidden cursor-pointer select-none group/video"
                style={{ aspectRatio: '9/16', maxHeight: compact ? 460 : '82vh' }}
                onClick={togglePlay}
            >
                <video
                    ref={videoRef}
                    src={post.video_url}
                    poster={post.video_thumbnail || undefined}
                    className="w-full h-full object-contain"
                    muted={muted}
                    loop
                    playsInline
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleMetadata}
                    onEnded={() => setPlaying(false)}
                />

                {/* gradient overlay (always subtle at bottom) */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Play/Pause overlay */}
                {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10 transition-transform group-hover/video:scale-110">
                            <Play className="w-7 h-7 text-white ml-1" fill="white" />
                        </div>
                    </div>
                )}

                {/* Top controls */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                    {/* Mute */}
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                    >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    {/* Open single page */}
                    <Link
                        href={singlePostUrl}
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Duration badge */}
                {duration > 0 && (
                    <span className="absolute top-3 left-3 text-[10px] font-black bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {fmtTime(duration)}
                    </span>
                )}

                {/* Progress bar */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer z-10 group/bar"
                    onClick={handleSeek}
                >
                    <div className="absolute bottom-0 h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100 group-hover/bar:h-1.5"
                        style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* ── Action bar ── */}
            <div className="flex items-center gap-0.5 px-3 py-2">
                {/* Like */}
                <button
                    onClick={handleLike}
                    disabled={likingPost}
                    className={`group flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-[13px] font-bold ${isLiked
                        ? 'text-rose-500'
                        : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                        }`}
                >
                    <Heart className={`w-[18px] h-[18px] transition-transform ${isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                    {likesCount > 0 && <span>{likesCount}</span>}
                </button>

                {/* Comment */}
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all text-[13px] font-bold"
                >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    {commentsCount > 0 && <span>{commentsCount}</span>}
                </button>

                {/* Share */}
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all text-[13px] font-bold"
                >
                    <Share2 className="w-[18px] h-[18px]" />
                </button>

                {/* Download */}
                <button
                    onClick={handleDownload}
                    title="Download clip"
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all text-[13px] font-bold"
                >
                    <Download className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* ── Comments section ── */}
            {showComments && (
                <div className="px-4 py-3 space-y-3 border-t border-slate-50 dark:border-slate-800">
                    {currentUserId && (
                        <form onSubmit={submitComment} className="flex gap-2">
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Add a comment…"
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-[13px] outline-none focus:border-violet-500 transition-colors text-slate-900 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submittingComment}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[12px] rounded-full disabled:opacity-50 transition-colors"
                            >
                                Post
                            </button>
                        </form>
                    )}
                    {loadingComments ? (
                        <div className="text-center py-4 text-slate-400 text-sm">Loading…</div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.map((c: any) => (
                                <div key={c.id} className="flex gap-2 items-start">
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        {c.author?.avatar_url
                                            ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">{(c.author?.name || 'U')[0]}</div>
                                        }
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-3 py-2">
                                        <p className="text-[12px] font-black text-slate-800 dark:text-white">{c.author?.name || 'Scholar'}</p>
                                        <p className="text-[13px] text-slate-700 dark:text-slate-300">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[12px] text-slate-400 py-2">No comments yet. Be first!</p>
                    )}
                </div>
            )}
        </div>
    );
}
