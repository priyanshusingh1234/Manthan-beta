'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Heart, MessageCircle,
    Share2, Download, BadgeCheck, MoreVertical, Trash2, Maximize
} from 'lucide-react-native';
import { supabase } from '@/lib/supabaseClient';
import { Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Share } from 'react-native';
import { Link } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import BadgedName from './BadgedName';
import { useRouter } from '@/lib/next-navigation';

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
    const router = useRouter();
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
        const authorName = post.author?.name || post.author?.full_name || post.author?.fullName || 'Scholar';
        const title = `🎬 ${authorName}'s clip on Dheeyudha`;
        const text = post.content?.trim() ? post.content.slice(0, 100) : 'Watch this clip on Dheeyudha!';
        try {
            if ((Platform.OS !== 'web')) {
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
            if (res.ok || res.status === 404) { 
                setIsHidden(true); 
                setShowMenu(false);
                setTimeout(() => onUpdate?.(null), 1500); 
            }
        } finally { setDeletingPost(false); setShowMenu(false); }
    };

    const authorProfileUrl = post.author?.username ? `/user/${post.author.username}` : '#';
    const clipsUrl = `/clips?postId=${post.id}`;

    const renderContent = (text: string) => {
        const parts = text.split(/(#\w+)/g);
        return parts.map((part, i) => 
            part.startsWith('#') 
                ? <Text key={i} className="text-violet-400 font-black">{part}</Text>
                : part
        );
    };

    if (isHidden) {
        return (
            <View className={`mx-auto flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 ${compact ? 'bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 p-8 my-4 w-full max-w-[400px] h-64' : 'h-screen w-full bg-black'}`}>
                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 flex-row">
                    <Trash2 className="w-8 h-8 text-slate-400" />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-center">This clip has been deleted.</Text>
            </View>
        );
    }

    // Component logic ends, view starts
    const authorHeader = (
        <View className="flex items-center justify-between mb-4 px-1 flex-row">
            <Link href={authorProfileUrl} className="flex items-center gap-3 min-w-0 flex-row">
                <View className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 shrink-0 shadow-sm">
                    {post.author?.avatar_url
                        ? <Image src={post.author.avatar_url} className="w-full h-full object-cover" />
                        : <View className="w-full h-full flex items-center justify-center text-slate-400 font-black text-sm uppercase flex-row">{(post.author?.name || post.author?.full_name || post.author?.fullName || 'U')[0]}</View>
                    }
                </View>
                <View className="flex flex-col min-w-0">
                    <BadgedName
                        name={post.author?.name || post.author?.full_name || post.author?.fullName || 'Scholar'}
                        userId={post.author?.id}
                        isTeacher={post.author?.isTeacher}
                        totalPoints={Number(post.author?.totalPoints)}
                        nameClassName="font-black text-[15px] text-slate-900 dark:text-slate-100"
                        className="flex items-center gap-1.5 min-w-0 flex-row"
                    />
                    <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                        {timeAgo}
                    </Text>
                </View>
            </Link>
            {isOwner && (
                <View className="relative">
                    <View onPress={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                    </View>
                    {showMenu && (
                        <View className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <View onPress={handleDelete} disabled={deletingPost} className="w-full px-5 py-4 text-left text-sm font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 flex-row">
                                <Trash2 className="w-5 h-5" /> {deletingPost ? 'Removing...' : 'Delete Content'}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View className={`max-w-[400px] mx-auto ${compact ? 'bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-4 shadow-sm border border-slate-100 dark:border-slate-800/60' : 'h-screen w-full'}`}>
            
            {compact && authorHeader}

            <View className={`relative bg-black overflow-hidden mx-auto ${compact ? 'rounded-[2rem] aspect-[9/16] w-full shadow-2xl' : 'h-full w-full flex items-center overflow-visible'}`}>
                <video
                    ref={videoRef}
                    src={post.video_url}
                    className="w-full h-full object-cover cursor-pointer"
                    muted={muted}
                    loop
                    playsInline
                    preload="metadata"
                    onPress={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setPlaying(false)}
                />

                {/* Premium Gradients */}
                <View className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <View className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {/* Play Overlay */}
                {!playing && (
                    <View onPress={togglePlay} className="absolute inset-0 flex items-center justify-center z-10 w-full h-full bg-transparent border-none flex-row">
                        <View className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl transition-transform scale-100 hover:scale-110 active:scale-95 flex-row">
                            <Play className="w-8 h-8 text-white ml-1 fill-white" />
                        </View>
                    </View>
                )}

                {/* Toolbar (Only show in non-compact or simplified in compact) */}
                <View className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-4 flex flex-col gap-4 z-10">
                    <View onPress={toggleMute} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10 flex-row">
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </View>
                    {!compact && isOwner && (
                        <View className="relative">
                            <View onPress={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10 flex-row">
                                <MoreVertical className="w-5 h-5" />
                            </View>
                            {showMenu && (
                                <View className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-55 overflow-hidden">
                                    <View onPress={handleDelete} disabled={deletingPost} className="w-full px-5 py-4 text-left text-sm font-black text-rose-500 hover:bg-rose-500/20 flex items-center gap-3 flex-row">
                                        <Trash2 className="w-5 h-5" /> {deletingPost ? 'Removing...' : 'Delete Content'}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Interaction Stack (Vertical Right) */}
                <View className={`absolute bottom-[max(2rem,env(safe-area-inset-bottom))] right-4 flex flex-col items-center gap-6 z-20`}>
                    {compact && (
                        <Link href={clipsUrl} className="flex flex-col items-center gap-1.5 group">
                            <View className="w-12 h-12 rounded-full bg-violet-600 shadow-lg flex items-center justify-center group-hover:scale-110 active:scale-90 transition-all border-2 border-white/20 flex-row">
                                <Maximize className="w-5 h-5 text-white" />
                            </View>
                        </Link>
                    )}

                    <View className="flex flex-col items-center gap-1">
                        <View onPress={handleLike} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all flex-row">
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                        </View>
                        {likesCount > 0 && <Text className="text-white text-[11px] font-black drop-shadow-xl">{likesCount}</Text>}
                    </View>

                    <View className="flex flex-col items-center gap-1">
                        <View 
                            onPress={(e) => { e.stopPropagation(); if (onCommentClick) onCommentClick(); else if (compact) router.push(clipsUrl); }} 
                            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all flex-row"
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </View>
                        {commentsCount > 0 && <Text className="text-white text-[11px] font-black drop-shadow-xl">{commentsCount}</Text>}
                    </View>

                    <View onPress={handleShare} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-90 transition-all flex-row">
                        <Share2 className="w-6 h-6 text-white" />
                    </View>

                    {!compact && (
                        <View onPress={handleDownload} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 text-white active:scale-90 transition-all flex-row">
                            <Download className="w-5 h-5" />
                        </View>
                    )}
                </View>

                {/* Info Overlay (Bottom Left) */}
                <View className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-16 z-20 pointer-events-none mb-1">
                    {!compact && (
                        <Link href={authorProfileUrl} className="flex items-center gap-3 mb-4 pointer-events-auto group flex-row">
                            <View className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                {post.author?.avatar_url ? <Image src={post.author.avatar_url} className="w-full h-full object-cover" /> : <View className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-black text-lg flex-row">{(post.author?.name || post.author?.full_name || post.author?.fullName || 'U')[0].toUpperCase()}</View>}
                            </View>
                            <View className="flex flex-col">
                                <View className="flex items-center gap-1.5 flex-row">
                                    <Text className="font-black text-white text-[17px] drop-shadow-2xl">{post.author?.name || post.author?.full_name || post.author?.fullName || 'Scholar'}</Text>
                                    {post.author?.isTeacher && <BadgeCheck className="w-4.5 h-4.5 text-blue-400 fill-blue-500" />}
                                </View>
                                <Text className="text-[12px] text-white/60 font-black tracking-wide drop-shadow-lg">@{post.author?.username || 'scholar'} • {timeAgo}</Text>
                            </View>
                        </Link>
                    )}
                    {post.content && (
                        <View className="pointer-events-auto">
                            <Text className="text-[14px] text-white font-bold drop-shadow-2xl leading-relaxed line-clamp-3">
                                {renderContent(post.content)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Pro Progress Bar */}
                <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-30 cursor-pointer group" onPress={handleSeek}>
                    <View className="h-full bg-violet-600 transition-all shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ width: `${progress}%` }} />
                </View>
            </View>
        </View>
    );
}
