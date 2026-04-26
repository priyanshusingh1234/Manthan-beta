'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Heart, MessageCircle,
    Share2, Download, BadgeCheck, MoreVertical, Trash2, Maximize
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
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

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

    // ── Share ─────────────────────────────────────────────────────────────────
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/posts/${post.id}`;
        const title = `🎬 ${post.author?.name || 'Scholar'}'s clip on Dheeyudha`;
        const text = post.content?.trim() ? post.content.slice(0, 100) : 'Watch this clip on Dheeyudha!';
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

    const authorUsername = post.author?.username;
    const authorProfileUrl = authorUsername ? `/user/${authorUsername}` : '#';
    const singlePostUrl = `/posts/${post.id}`;

    if (isHidden) return null;

    return (
        <div className={`relative bg-black w-full overflow-hidden ${compact ? 'rounded-2xl max-h-[600px] aspect-[9/16]' : 'h-full flex items-center'}`}>
            {/* Video Player */}
            <video
                ref={videoRef}
                src={post.video_url}
                poster={post.video_thumbnail || undefined}
                className="w-full h-full object-cover cursor-pointer"
                muted={muted}
                loop
                playsInline
                preload="metadata"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleMetadata}
                onEnded={() => setPlaying(false)}
            />

            {/* Gradient Overlays for readability */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Play/Pause Overlay */}
            {!playing && (
                <button 
                    onClick={togglePlay} 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 w-full h-full bg-transparent border-none appearance-none"
                    aria-label="Play video"
                >
                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10 transition-transform scale-100 hover:scale-110">
                        <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    </div>
                </button>
            )}

            {/* Top right floating: Mute / Menu */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
                <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                {(isOwner || isAdmin) && (
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button
                                    onClick={handleDelete}
                                    disabled={deletingPost}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deletingPost ? 'Deleting...' : 'Delete Clip'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* YouTube Shorts style right-side buttons */}
            <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5 z-10">
                
                {/* See Full Video (Specific request) - only in compact */}
                {compact && (
                    <Link href={singlePostUrl} className="flex flex-col items-center gap-1 group">
                        <div className="w-11 h-11 rounded-full bg-violet-600/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-violet-500 transition-colors shadow-lg">
                            <Maximize className="w-[20px] h-[20px] text-white" />
                        </div>
                        <span className="text-[10px] text-white font-black drop-shadow-md">Full Video</span>
                    </Link>
                )}

                {/* Like */}
                <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Heart className={`w-[22px] h-[22px] ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </div>
                    {likesCount > 0 && <span className="text-white text-xs font-bold drop-shadow-md">{likesCount}</span>}
                </button>

                {/* Comment (links to full page if in feed) */}
                <Link href={singlePostUrl} onClick={(e) => { if (!compact) e.preventDefault(); }} className="flex flex-col items-center gap-1 group">
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <MessageCircle className="w-[22px] h-[22px] text-white" />
                    </div>
                    {commentsCount > 0 && <span className="text-white text-xs font-bold drop-shadow-md">{commentsCount}</span>}
                </Link>

                {/* Share */}
                <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Share2 className="w-[22px] h-[22px] text-white" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
                </button>

                {/* Download */}
                {!compact && (
                     <button onClick={handleDownload} className="flex flex-col items-center gap-1 group">
                        <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <Download className="w-[22px] h-[22px] text-white" />
                        </div>
                    </button>
                )}
            </div>

            {/* Bottom Left Info Overlays */}
            <div className="absolute bottom-6 left-3 right-16 flex flex-col gap-2 z-10 pointer-events-auto">
                <Link href={authorProfileUrl} className="flex items-center gap-2 w-fit">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 ring-2 ring-white/20 shrink-0">
                        {post.author?.avatar_url
                            ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center font-black text-white text-sm">{(post.author?.name || 'U')[0].toUpperCase()}</div>
                        }
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[15px] drop-shadow-md">{post.author?.name || 'Scholar'}</span>
                            {post.author?.isTeacher && <BadgeCheck className="w-4 h-4 text-blue-400" fill="#3b82f6" />}
                        </div>
                        <span className="text-[12px] text-white/80 font-medium drop-shadow-md">
                            {authorUsername && `@${authorUsername}`} • {timeAgo}
                        </span>
                    </div>
                </Link>

                {post.content?.trim() && (
                    <p className="text-[14px] text-white/90 drop-shadow-md line-clamp-2 mt-1 leading-snug">
                        {post.content}
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer z-20 group" onClick={handleSeek}>
                <div className="absolute bottom-0 h-full bg-violet-500 group-hover:h-2 transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
