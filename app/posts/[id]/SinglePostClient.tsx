'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft, Clock, MessageCircle, User,
    Play, Pause, Volume2, VolumeX,
    Heart, Share2, Download, BadgeCheck, Send, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import BadgedName from '@/components/BadgedName';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// ── Cloudinary watermark ──────────────────────────────────────────────────────
function buildWatermarkedUrl(videoUrl: string): string {
    if (!videoUrl.includes('cloudinary.com')) return videoUrl;
    return videoUrl.replace(
        '/upload/',
        '/upload/l_text:Arial_28_bold:Dheeyudha,co_white,o_60,g_south_east,x_15,y_15/'
    );
}

// ── Immersive single video page ────────────────────────────────────────────────
function SingleVideoPage({ post, currentUserId, onRefresh, onDeleted }: {
    post: any;
    currentUserId: string | null;
    onRefresh: () => void;
    onDeleted: () => void;
}) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);        // unmuted by default on single page
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimer = useRef<ReturnType<typeof setTimeout>>();

    const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [likingPost, setLikingPost] = useState(false);

    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
        .replace('about ', '').replace('less than ', '');

    const authorProfileUrl = post.author?.isTeacher && post.author?.username
        ? `/teacher/${post.author.username}`
        : post.author?.username ? `/user/${post.author.username}` : '#';

    // Auto-hide controls after 3s inactivity
    const showControls = () => {
        setControlsVisible(true);
        clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
        }, 3000);
    };

    // Video controls
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
        showControls();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
        showControls();
    };

    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        setProgress((v.currentTime / v.duration) * 100);
        setCurrentTime(v.currentTime);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
        showControls();
    };

    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    // Like
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

    // Comments
    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            if (res.ok) setComments(await res.json());
        } finally { setLoadingComments(false); }
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

    // Share
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/posts/${post.id}`;
        const title = `🎬 ${post.author?.name || 'Scholar'}'s clip on Dheeyudha`;
        const text = post.content?.trim() ? post.content.slice(0, 100) : 'Watch this clip on Dheeyudha!';
        try {
            if (Capacitor.isNativePlatform()) { await Share.share({ title, text, url }); return; }
            if (navigator.share) { await navigator.share({ title, text, url }); return; }
            navigator.clipboard.writeText(url);
            alert('Link copied!');
        } catch { /* ignore */ }
    };

    // Download
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(buildWatermarkedUrl(post.video_url) + '?dl=dheeyudha-clip.mp4', '_blank');
    };

    // Fetch comments on load
    useEffect(() => { fetchComments(); }, [post.id]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col" onMouseMove={showControls} onTouchStart={showControls}>

            {/* ── Full-bleed video area ── */}
            <div
                className="relative flex-1 flex w-full bg-black overflow-hidden"
                style={{ minHeight: '60dvh', maxHeight: 'calc(100dvh - 240px)' }}
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
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                />

                {/* ── Overlay: top bar ── */}
                <div
                    className={`absolute top-0 inset-x-0 z-20 flex items-center gap-3 px-4 py-4 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); router.back(); }}
                        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-white font-black text-base tracking-tight">🎬 Clip</span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                        >
                            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* ── Play / Pause center button ── */}
                <div
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-2xl">
                        {playing
                            ? <Pause className="w-7 h-7 text-white" fill="white" />
                            : <Play className="w-7 h-7 text-white ml-1" fill="white" />
                        }
                    </div>
                </div>

                {/* ── Bottom gradient + progress ── */}
                <div
                    className="absolute bottom-0 inset-x-0 z-20"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
                >
                    {/* Time */}
                    {duration > 0 && (
                        <div className="px-4 pb-1 flex items-center gap-1">
                            <span className="text-[11px] text-white/70 font-mono tabular-nums">{fmtTime(currentTime)}</span>
                            <span className="text-[11px] text-white/40 font-mono">/</span>
                            <span className="text-[11px] text-white/40 font-mono tabular-nums">{fmtTime(duration)}</span>
                        </div>
                    )}
                    {/* Scrubber */}
                    <div
                        className="mx-0 h-1.5 bg-white/20 cursor-pointer"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Info + actions panel (dark) ── */}
            <div className="bg-[#121212] border-t border-white/5 flex-shrink-0">

                {/* Author strip */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <Link href={authorProfileUrl} onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0 ring-2 ring-violet-500/40">
                            {post.author?.avatar_url
                                ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center font-black text-violet-400 text-sm">{(post.author?.name || 'U')[0].toUpperCase()}</div>
                            }
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Link href={authorProfileUrl} className="font-black text-[14px] text-white hover:underline truncate">
                                {post.author?.name || 'Scholar'}
                            </Link>
                            {post.author?.isTeacher && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" fill="#60a5fa" />}
                        </div>
                        <p className="text-[12px] text-white/40 font-medium">
                            {post.author?.username && <span>@{post.author.username} · </span>}
                            {timeAgo}
                        </p>
                    </div>
                </div>

                {/* Caption */}
                {post.content?.trim() && (
                    <p className="px-4 pb-3 text-[14px] text-white/80 leading-relaxed">{post.content}</p>
                )}

                {/* Action row */}
                <div className="flex items-center gap-1 px-3 pb-4 border-b border-white/5">
                    {/* Like */}
                    <button
                        onClick={handleLike}
                        disabled={likingPost}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[13px] font-bold transition-all ${isLiked
                            ? 'text-rose-400'
                            : 'text-white/60 hover:text-rose-400 hover:bg-white/5'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current scale-110' : ''} transition-transform`} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => setShowComments(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[13px] font-bold transition-all ${showComments ? 'text-sky-400' : 'text-white/60 hover:text-sky-400 hover:bg-white/5'}`}
                    >
                        <MessageCircle className="w-5 h-5" />
                        {commentsCount > 0 && <span>{commentsCount}</span>}
                    </button>

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-white/60 hover:text-sky-400 hover:bg-white/5 transition-all text-[13px] font-bold"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded-full text-white/40 hover:text-violet-400 hover:bg-white/5 transition-all text-[13px] font-bold"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Comments section ── */}
                {showComments && (
                    <div className="px-4 py-3 space-y-3 pb-24">
                        {/* Comment input */}
                        {currentUserId && (
                            <form onSubmit={submitComment} className="flex gap-2">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add a comment…"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-[13px] outline-none focus:border-violet-500 text-white placeholder-white/30 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || submittingComment}
                                    className="w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-500 rounded-full disabled:opacity-40 transition-colors shrink-0"
                                >
                                    {submittingComment
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <Send className="w-4 h-4 text-white" />
                                    }
                                </button>
                            </form>
                        )}

                        {/* Comment list */}
                        {loadingComments ? (
                            <div className="flex items-center justify-center py-4 gap-2 text-white/30">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-center text-[12px] text-white/30 py-3">No comments yet. Be first! 💬</p>
                        ) : (
                            <div className="space-y-3 max-h-56 overflow-y-auto">
                                {comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-2.5 items-start">
                                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 shrink-0">
                                            {c.author?.avatar_url
                                                ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/40">{(c.author?.name || 'U')[0]}</div>
                                            }
                                        </div>
                                        <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2">
                                            <p className="text-[12px] font-black text-white/80">{c.author?.name || 'Scholar'}</p>
                                            <p className="text-[13px] text-white/60">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main client component ──────────────────────────────────────────────────────
export default function SinglePostClient({ postId }: { postId: string }) {
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
                setPost(res.ok ? await res.json() : null);
            } catch {
                if (mounted) setPost(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [postId]);

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

    // ── Video → immersive single video page ───────────────────────────────
    if (post.video_url) {
        return (
            <SingleVideoPage
                post={post}
                currentUserId={currentUserId}
                onRefresh={refreshPost}
                onDeleted={() => router.back()}
            />
        );
    }

    // ── Regular text/image post ────────────────────────────────────────────
    const profileUrl = post.author?.isTeacher && post.author?.username
        ? `/teacher/${post.author.username}`
        : post.author?.username ? `/user/${post.author.username}` : '#';

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 flex items-center gap-4">
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
