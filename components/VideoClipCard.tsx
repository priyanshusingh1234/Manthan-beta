'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Heart, MessageCircle,
    Share2, Download, BadgeCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ─── Cloudinary watermark URL ──────────────────────────────────────────────────
// When the user downloads, we serve them the Cloudinary URL with a text
// watermark overlay baked in. This never affects playback — only the
// download link uses it.
function buildWatermarkedUrl(videoUrl: string): string {
    if (!videoUrl.includes('cloudinary.com')) return videoUrl;
    // Insert the watermark transformation before "/upload/"
    return videoUrl.replace(
        '/upload/',
        '/upload/l_text:Arial_28_bold:Dheeyudha,co_white,o_60,g_south_east,x_15,y_15/'
    );
}

interface VideoClipCardProps {
    post: any;              // full post object (has video_url, video_thumbnail, content, author, etc.)
    currentUserId: string | null;
    onUpdate?: (updated?: any) => void;
    compact?: boolean;      // true = feed card, false = single post view
}

export default function VideoClipCard({ post, currentUserId, onUpdate, compact = true }: VideoClipCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);          // start muted (autoplay policy)
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Like state
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [likingPost, setLikingPost] = useState(false);

    // Comment state
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>(post.recent_comments || []);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
        .replace('about ', '').replace('less than ', '');

    // ── Video controls ──────────────────────────────────────────────────────────
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play();
            setPlaying(true);
        } else {
            v.pause();
            setPlaying(false);
        }
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
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        v.currentTime = ratio * v.duration;
    };

    const handleMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    // Pause when scrolled out of view (IntersectionObserver)
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
        const prev = isLiked;
        const prevCount = likesCount;
        setIsLiked(!prev);
        setLikesCount(prev ? prevCount - 1 : prevCount + 1);
        setLikingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setIsLiked(!!data?.is_liked);
            if (typeof data?.likes_count === 'number') setLikesCount(data.likes_count);
        } catch {
            setIsLiked(prev);
            setLikesCount(prevCount);
        } finally { setLikingPost(false); }
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
        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({ title: 'Check out this clip on Dheeyudha!', url });
                return;
            }
            if (navigator.share) { await navigator.share({ title: 'Dheeyudha clip', url }); return; }
            navigator.clipboard.writeText(url);
            alert('Link copied!');
        } catch { /* ignore */ }
    };

    // ── Download with watermark ───────────────────────────────────────────────
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const watermarkedUrl = buildWatermarkedUrl(post.video_url);
        // Open in a new tab — browser will download (most browsers handle .mp4 as download)
        window.open(watermarkedUrl + '?dl=dheeyudha-clip.mp4', '_blank');
    };

    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const authorUsername = post.author?.username;
    const authorProfileUrl = authorUsername ? `/user/${authorUsername}` : '#';

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* ── Author header ── */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <Link href={authorProfileUrl}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        {post.author?.avatar_url
                            ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{(post.author?.name || 'U')[0]}</div>
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
                    <p className="text-[12px] text-slate-500 font-medium">
                        {authorUsername && <span>@{authorUsername} · </span>}
                        {timeAgo}
                    </p>
                </div>
                {/* 🎬 Clip badge */}
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-black bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-full border border-violet-200/60 dark:border-violet-800/60">
                    🎬 Clip
                </span>
            </div>

            {/* ── Caption ── */}
            {post.content?.trim() && (
                <p className="px-4 pb-2 text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>
            )}

            {/* ── Video player ── */}
            <div
                className="relative bg-black overflow-hidden cursor-pointer select-none"
                style={{ aspectRatio: '9/16', maxHeight: compact ? 480 : '80vh' }}
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

                {/* Play/Pause overlay */}
                {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-xl">
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                    </div>
                )}

                {/* Mute button */}
                <button
                    onClick={toggleMute}
                    className="absolute bottom-10 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white z-10"
                >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Duration badge */}
                {duration > 0 && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-black/60 text-white px-2 py-0.5 rounded-full">
                        {fmtTime(duration)}
                    </span>
                )}

                {/* Progress bar */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer z-10"
                    onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
                >
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* ── Action bar ── */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-50 dark:border-slate-800">
                {/* Like */}
                <button
                    onClick={handleLike}
                    disabled={likingPost}
                    className={`group flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-[13px] font-bold ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                >
                    <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
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

                {/* Download (watermarked) */}
                <button
                    onClick={handleDownload}
                    title="Download clip (Dheeyudha watermark included)"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all text-[13px] font-bold ml-auto"
                >
                    <Download className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* ── Comments section ── */}
            {showComments && (
                <div className="px-4 py-3 space-y-3 border-b border-slate-50 dark:border-slate-800">
                    {/* Comment input */}
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

                    {/* Comment list */}
                    {loadingComments ? (
                        <div className="text-center py-4 text-slate-400 text-sm">Loading…</div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.map((c: any) => (
                                <div key={c.id} className="flex gap-2 items-start">
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        {c.author?.avatar_url
                                            ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">{(c.author?.name || 'U')[0]}</div>
                                        }
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-3 py-2">
                                        <p className="text-[12px] font-black text-slate-800 dark:text-white">
                                            {c.author?.name || 'Scholar'}
                                        </p>
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
