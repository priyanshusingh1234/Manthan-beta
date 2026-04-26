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
import { formatDistanceToNow } from 'date-fns';
import BadgedName from './BadgedName';

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
    onCommentClick?: () => void;
    compact?: boolean;
}

export default function VideoClipCard({ post, currentUserId, onUpdate, onCommentClick, compact = true }: VideoClipCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
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

    // IntersectionObserver for auto-play/pause
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const v = videoRef.current;
                if (!v) return;
                // Play if at least 60% visible
                if (entry.intersectionRatio > 0.6) {
                    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
                } else {
                    v.pause();
                    setPlaying(false);
                }
            },
            { threshold: [0.6] }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    // Global mute sync
    useEffect(() => {
        const handleGlobalMute = (e: any) => {
            const isMuted = e.detail?.muted;
            if (typeof isMuted === 'boolean') {
                setMuted(isMuted);
                if (videoRef.current) videoRef.current.muted = isMuted;
            }
        };
        window.addEventListener('dheeyudha-video-mute', handleGlobalMute);
        return () => window.removeEventListener('dheeyudha-video-mute', handleGlobalMute);
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
        else { v.pause(); setPlaying(false); }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        const newMuted = !v.muted;
        v.muted = newMuted;
        setMuted(newMuted);
        
        // Sync to all other video players
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dheeyudha-video-mute', { detail: { muted: newMuted } }));
        }
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
        } catch { }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(buildWatermarkedUrl(post.video_url) + '?dl=dheeyudha-clip.mp4', '_blank');
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Delete this content?')) return;
        setDeletingPost(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (res.ok || res.status === 404) { setIsHidden(true); onUpdate?.(null); }
        } finally { setDeletingPost(false); setShowMenu(false); }
    };

    const authorProfileUrl = post.author?.username ? `/user/${post.author.username}` : '#';
    const singlePostUrl = `/posts/${post.id}`;

    if (isHidden) return null;

    // Component logic ends, view starts
    const authorHeader = (
        <div className="flex items-center justify-between mb-4 px-1">
            <Link href={authorProfileUrl} className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 shrink-0 shadow-sm">
                    {post.author?.avatar_url
                        ? <img src={post.author.avatar_url} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-sm uppercase">{(post.author?.name || 'U')[0]}</div>
                    }
                </div>
                <div className="flex flex-col min-w-0">
                    <BadgedName
                        name={post.author?.name || 'Scholar'}
                        userId={post.author?.id}
                        isTeacher={post.author?.isTeacher}
                        totalPoints={Number(post.author?.totalPoints)}
                        nameClassName="font-black text-[15px] text-slate-900 dark:text-slate-100"
                        className="flex items-center gap-1.5 min-w-0"
                    />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                        {timeAgo}
                    </p>
                </div>
            </Link>
            {(isOwner || isAdmin) && (
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <button onClick={handleDelete} disabled={deletingPost} className="w-full px-5 py-4 text-left text-sm font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3">
                                <Trash2 className="w-5 h-5" /> {deletingPost ? 'Removing...' : 'Delete Content'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className={`max-w-[400px] mx-auto ${compact ? 'bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-4 shadow-sm border border-slate-100 dark:border-slate-800/60' : 'h-screen w-full'}`}>
            
            {compact && authorHeader}

            <div className={`relative bg-black overflow-hidden mx-auto ${compact ? 'rounded-[2rem] aspect-[9/16] w-full shadow-2xl' : 'h-full w-full flex items-center overflow-visible'}`}>
                <video
                    ref={videoRef}
                    src={post.video_url}
                    className="w-full h-full object-cover cursor-pointer"
                    muted={muted}
                    loop
                    playsInline
                    preload="metadata"
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setPlaying(false)}
                />

                {/* Premium Gradients */}
                <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {/* Play Overlay */}
                {!playing && (
                    <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10 w-full h-full bg-transparent border-none">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl transition-transform scale-100 hover:scale-110 active:scale-95">
                            <Play className="w-8 h-8 text-white ml-1 fill-white" />
                        </div>
                    </button>
                )}

                {/* Toolbar (Only show in non-compact or simplified in compact) */}
                <div className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-4 flex flex-col gap-4 z-10">
                    <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    {!compact && (isOwner || isAdmin) && (
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-55 overflow-hidden">
                                    <button onClick={handleDelete} disabled={deletingPost} className="w-full px-5 py-4 text-left text-sm font-black text-rose-500 hover:bg-rose-500/20 flex items-center gap-3">
                                        <Trash2 className="w-5 h-5" /> {deletingPost ? 'Removing...' : 'Delete Content'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Interaction Stack (Vertical Right) */}
                <div className={`absolute bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)] right-4 flex flex-col items-center gap-6 z-20`}>
                    {compact && (
                        <Link href={singlePostUrl} className="flex flex-col items-center gap-1.5 group">
                            <div className="w-12 h-12 rounded-full bg-violet-600 shadow-lg flex items-center justify-center group-hover:scale-110 active:scale-90 transition-all border-2 border-white/20">
                                <Maximize className="w-5 h-5 text-white" />
                            </div>
                        </Link>
                    )}

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={handleLike} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all">
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                        </button>
                        {likesCount > 0 && <span className="text-white text-[11px] font-black drop-shadow-xl">{likesCount}</span>}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); if (onCommentClick) onCommentClick(); else if (compact) window.location.href = singlePostUrl; }} 
                            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all"
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </button>
                        {commentsCount > 0 && <span className="text-white text-[11px] font-black drop-shadow-xl">{commentsCount}</span>}
                    </div>

                    <button onClick={handleShare} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all">
                        <Share2 className="w-6 h-6 text-white" />
                    </button>

                    {!compact && (
                        <button onClick={handleDownload} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 text-white active:scale-90 transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Info Overlay (Bottom Left) */}
                <div className="absolute bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)] left-4 right-16 z-20 pointer-events-none mb-1">
                    {!compact && (
                        <Link href={authorProfileUrl} className="flex items-center gap-3 mb-4 pointer-events-auto group">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-black text-lg">{(post.author?.name || 'U')[0].toUpperCase()}</div>}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-white text-[17px] drop-shadow-2xl">{post.author?.name || 'Scholar'}</span>
                                    {post.author?.isTeacher && <BadgeCheck className="w-4.5 h-4.5 text-blue-400 fill-blue-500" />}
                                </div>
                                <span className="text-[12px] text-white/60 font-black tracking-wide drop-shadow-lg">@{post.author?.username || 'scholar'} • {timeAgo}</span>
                            </div>
                        </Link>
                    )}
                    {post.content && (
                        <div className="pointer-events-auto">
                            <p className="text-[14px] text-white font-bold drop-shadow-2xl leading-relaxed line-clamp-3">
                                {post.content}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pro Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-30 cursor-pointer group" onClick={handleSeek}>
                    <div className="h-full bg-violet-600 transition-all shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}
