'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import SuggestedUsersCard from '@/components/SuggestedUsersCard';
import { ImageIcon, X, Sparkles, User, Send, Video, Loader2, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/utils/compressImage';
import { Check } from 'lucide-react';
import { Suspense } from 'react';

const MAX_CHARS = 500;

function SocialFeedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const POSTS_CACHE_KEY = 'community_posts_cache_v2';
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);

    // Pagination state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Background refresh — queued new posts waiting to be shown
    const [newPostsQueue, setNewPostsQueue] = useState<any[]>([]);
    const currentPostIdsRef = useRef<Set<string>>(new Set());
    const sessionRef = useRef<any>(null);

    // Composer state
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Video clip state
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoUploadProgress, setVideoUploadProgress] = useState(0); // 0-100
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState('');
    const [focused, setFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const CATEGORIES = ['education', 'lifestyle', 'news', 'funny', 'general'];
    const [selectedCategory, setSelectedCategory] = useState<string>('general');


    // ── Auto-grow textarea ──────────────────────────────────────────────────
    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    // ── Fetch feed (initial / manual refresh) ───────────────────────────────
    // ── Fetch feed (initial / manual refresh) ───────────────────────────────
    const fetchFeed = useCallback(async (isInitial = false) => {
        // Only show skeleton loader if we don't have any posts loaded yet (no cache)
        if (isInitial && currentPostIdsRef.current.size === 0) {
            setLoading(true);
        }
        setHasMore(true);
        try {
            const { data: { session: s } } = await supabase.auth.getSession();
            const token = s?.access_token || null;
            sessionRef.current = s;
            // Go directly to /api/posts — fast, targeted, no heavy feed logic
            const res = await fetch(`/api/posts?limit=30`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(await res.text());
            const rawData = await res.json();
            const postItems = (Array.isArray(rawData) ? rawData : []).map((p: any) => ({ ...p, type: 'post' }));

            if (currentPostIdsRef.current.size > 0) {
                // Find posts in postItems that are NOT currently displayed
                const genuinelyNew = postItems.filter((p: any) => !currentPostIdsRef.current.has(p.id));
                if (genuinelyNew.length > 0) {
                    // Queue them up and show the 'New Posts' banner (like IG)
                    setNewPostsQueue(prev => {
                        const merged = [...genuinelyNew, ...prev];
                        const seen = new Set();
                        return merged.filter((p: any) => {
                            if (seen.has(p.id)) return false;
                            seen.add(p.id);
                            return true;
                        });
                    });
                } else {
                    // No new posts, just update existing ones (like state, comments, etc)
                    setPosts(postItems);
                    currentPostIdsRef.current = new Set(postItems.map((p: any) => p.id));
                }
            } else {
                setPosts(postItems);
                currentPostIdsRef.current = new Set(postItems.map((p: any) => p.id));
            }

            try { localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(postItems.slice(0, 20))); } catch {}
            if (postItems.length < 30) setHasMore(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Background poll: silently check for new posts ────────────────────────
    const pollForNewPosts = useCallback(async () => {
        // Don't poll if page is hidden or still doing initial load
        if (document.visibilityState !== 'visible') return;
        try {
            const token = sessionRef.current?.access_token || null;
            const res = await fetch(`/api/posts?limit=10`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return;
            const rawData = await res.json();
            const fresh = (Array.isArray(rawData) ? rawData : []).map((p: any) => ({ ...p, type: 'post' }));
            // Find posts not currently displayed
            const genuinelyNew = fresh.filter((p: any) => !currentPostIdsRef.current.has(p.id));
            if (genuinelyNew.length > 0) {
                setNewPostsQueue(genuinelyNew);
            }
        } catch { /* silent */ }
    }, []);

    // ── Apply queued new posts (when banner is tapped) ───────────────────────
    const applyNewPosts = useCallback(() => {
        if (newPostsQueue.length === 0) return;
        setPosts(prev => {
            const merged = [...newPostsQueue, ...prev.filter(p => !newPostsQueue.some((n: any) => n.id === p.id))];
            currentPostIdsRef.current = new Set(merged.map(p => p.id));
            try { localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(merged.slice(0, 20))); } catch {}
            return merged;
        });
        setNewPostsQueue([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [newPostsQueue]);

    const loadMore = async () => {
        if (!hasMore || loadingMore || posts.length === 0) return;
        setLoadingMore(true);
        try {
            const lastPost = posts[posts.length - 1];
            // Determine timestamp: some come as 'createdAt' (from questions), some as 'created_at' (from posts).
            // But since these are social posts, it's usually created_at.
            const cursor = lastPost.created_at || lastPost.createdAt;
            if (!cursor) {
                setHasMore(false);
                return;
            }

            const token = session?.access_token || null;
            const fbRes = await fetch(`/api/posts?limit=20&before=${encodeURIComponent(cursor)}&t=${Date.now()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });

            if (fbRes.ok) {
                const fbData = await fbRes.json();
                const newPosts = Array.isArray(fbData) ? fbData : [];

                if (newPosts.length === 0) {
                    setHasMore(false);
                } else {
                    const formattedPosts = newPosts.map(p => ({ ...p, type: 'post' }));
                    // Deduplicate
                    setPosts(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNew = formattedPosts.filter(p => !existingIds.has(p.id));
                        return [...prev, ...uniqueNew];
                    });
                    if (newPosts.length < 20) setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more posts:", error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }  // reduced — was 400px which caused instant scroll-to-end
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, posts.length]);

    useEffect(() => {
        let mounted = true;
        // Show cached posts instantly while fresh data loads
        try {
            const cached = localStorage.getItem(POSTS_CACHE_KEY);
            if (cached) {
                const cachedPosts = JSON.parse(cached);
                if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
                    setPosts(cachedPosts);
                    currentPostIdsRef.current = new Set(cachedPosts.map((p: any) => p.id));
                    setLoading(false);
                }
            }
        } catch {}
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) {
                setCurrentUserId(s?.user?.id || null);
                setSession(s);
                sessionRef.current = s;
                fetchFeed(true);
            }
        });
        return () => { mounted = false; };
    }, [fetchFeed]);

    // Background polling — check for new posts every 60 seconds
    useEffect(() => {
        const interval = setInterval(pollForNewPosts, 60_000);
        // Also poll when the user comes back to the tab
        const onVisible = () => { if (document.visibilityState === 'visible') pollForNewPosts(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [pollForNewPosts]);

    // Handle incoming shared text
    useEffect(() => {
        const shareText = searchParams?.get('share');
        if (shareText && !content) {
            setContent(shareText);
            setFocused(true);
            setTimeout(autoGrow, 100);
        }
    }, [searchParams]);

    // ── Mention logic ───────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleContentChange = async (val: string) => {
        if (val.length > MAX_CHARS) return;
        setContent(val);
        autoGrow();

        const el = textareaRef.current;
        const cursor = el?.selectionStart || val.length;
        const before = val.slice(0, cursor);
        const lastAt = before.lastIndexOf('@');
        if (lastAt !== -1) {
            const mention = before.slice(lastAt + 1);
            const charBefore = lastAt > 0 ? before[lastAt - 1] : ' ';
            if ((lastAt === 0 || /[^a-zA-Z0-9_]/.test(charBefore)) && !/\s/.test(mention)) {
                setMentionSearch(mention);
                setMentionIndex(lastAt);
                if (mention.length > 0) {
                    try {
                        const res = await fetch(`/api/search?q=${mention}`);
                        if (res.ok) setSuggestions((await res.json()).users || []);
                    } catch { /* silent */ }
                } else setSuggestions([]);
                return;
            }
        }
        setMentionSearch(null);
        setSuggestions([]);
    };

    const applySuggestion = (user: any) => {
        if (mentionIndex === null) return;
        const before = content.slice(0, mentionIndex);
        const after = content.slice(mentionIndex + (mentionSearch?.length || 0) + 1);
        setContent(`${before}@${user.username} ${after}`);
        setSuggestions([]);
        setMentionSearch(null);
        textareaRef.current?.focus();
    };

    // ── Image handling ──────────────────────────────────────────────────────
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { setPostError('Image exceeds 20MB.'); return; }
        setPostError('');
        try {
            const compressed = await compressImage(file, 'banner');
            setImageFile(compressed);
            setImagePreview(URL.createObjectURL(compressed));
        } catch { setPostError('Failed to process image.'); }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Video handling ──────────────────────────────────────────────────────
    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) { setPostError('Please select a video file.'); return; }
        if (file.size > 200 * 1024 * 1024) { setPostError('Video exceeds 200MB.'); return; }

        setPostError('');
        const url = URL.createObjectURL(file);
        
        // Show preview instantly
        setVideoPreview(url);
        
        // Just save the file object reference directly.
        // Reading it entirely into an arrayBuffer creates a high risk of out-of-memory crashes on mobile devices.
        setVideoFile(file);

        removeImage();

        // Perform duration check in background
        try {
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;

            const duration = await Promise.race([
                new Promise<number>((resolve) => {
                    vid.onloadedmetadata = () => resolve(vid.duration);
                    vid.onerror = () => resolve(0);
                }),
                new Promise<number>((resolve) => setTimeout(() => resolve(0), 4000))
            ]);

            if (duration > 31) {
                setPostError(`Clip too long (${Math.round(duration)}s). Max 30 seconds.`);
                removeVideo();
            }
        } catch (err) {
            console.warn('Metadata check failed, continuing:', err);
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
        setVideoUploadProgress(0);
    };

    const uploadVideoToCloudinary = async (token: string): Promise<{ videoUrl: string; thumbnailUrl: string }> => {
        if (!videoFile) throw new Error('No video file');

        const signRes = await fetch('/api/clips/sign', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!signRes.ok) {
            const errData = await signRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to get upload signature');
        }
        const { cloudName, apiKey, timestamp, signature, folder, eager, eagerAsync } = await signRes.json();

        const form = new FormData();
        // Modern mobile browsers sometimes strip filenames; force one to ensure Cloudinary accepts it
        form.append('file', videoFile, 'clip.mp4');
        form.append('api_key', apiKey);
        form.append('timestamp', String(timestamp));
        form.append('signature', signature);
        form.append('folder', folder);
        form.append('eager', eager);
        form.append('eager_async', eagerAsync ? 'true' : 'false');

        const apiURL = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', apiURL, true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded * 100) / e.total);
                    // Cloudinary does processing after 100%, so we cap it slightly
                    setVideoUploadProgress(Math.min(percent, 95));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during video upload. Check your connection.'));
            xhr.ontimeout = () => reject(new Error('Upload timed out.'));

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        setVideoUploadProgress(100);
                        
                        let finalVideoUrl = data.secure_url;
                        if (data.eager && data.eager.length > 0) {
                            finalVideoUrl = data.eager[0].secure_url;
                        }

                        resolve({
                            videoUrl: finalVideoUrl,
                            thumbnailUrl: finalVideoUrl
                                .replace(/\.[^.]+$/, '.jpg')
                                .replace('/video/upload/', '/video/upload/so_0/'),
                        });
                    } catch (e) {
                        reject(new Error('Failed to parse upload response'));
                    }
                } else {
                    let errMessage = `Upload failed with status ${xhr.status}`;
                    try {
                        const errBody = JSON.parse(xhr.responseText);
                        errMessage = errBody?.error?.message || errMessage;
                    } catch (e) {}
                    console.error('Cloudinary Upload Error XHR:', xhr.responseText);
                    reject(new Error(errMessage));
                }
            };

            xhr.send(form);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile && !videoFile) return;
        if (!session) return;
        setSubmitting(true);
        setPostError('');
        try {
            let imageUrl = null;
            let videoUrl = null;
            let videoThumbnail = null;

            // Upload image if present
            if (imageFile) {
                const ext = (imageFile.name || 'post-image.jpg').split('.').pop() || 'webp';
                const form = new FormData();
                // imageFile is already a compressed Blob/File from compressImage — use it directly
                form.append('file', imageFile, `post-${Date.now()}.${ext}`);
                const up = await fetch('/api/posts/upload', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: form,
                });
                if (!up.ok) {
                    const upData = await up.json().catch(() => ({}));
                    throw new Error(upData.error || `Upload failed (${up.status})`);
                }
                const upData = await up.json();
                imageUrl = upData.url;
            }

            // Upload video if present
            if (videoFile) {
                setVideoUploadProgress(1);
                const result = await uploadVideoToCloudinary(session.access_token);
                videoUrl = result.videoUrl;
                videoThumbnail = result.thumbnailUrl;
            }

            const finalContent = (content.trim() + (videoFile && selectedCategory !== 'general' ? ` #${selectedCategory}` : '')).trim();

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ content: finalContent, imageUrl, videoUrl, videoThumbnail }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed');
            const newPostRaw = await res.json();

            // ── Optimistic UI: prepend instantly so the post is immediately visible ──
            // Grab author info from cache to avoid a round-trip
            let cachedMeta: any = {};
            try { cachedMeta = JSON.parse(localStorage.getItem('dheeyudha_user_meta_cache') || '{}'); } catch { }
            const localMeta = session.user?.user_metadata || {};
            const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');
            const authorAvatar = (() => {
                const u = cachedMeta?.avatar_url || localMeta?.avatar_url;
                return u && !isGoogleUrl(u) ? u : null;
            })();

            const optimisticPost: any = {
                id: newPostRaw.id,
                type: 'post',
                content: finalContent,
                image_url: imageUrl,
                video_url: videoUrl,
                video_thumbnail: videoThumbnail,
                likes_count: 0,
                comments_count: 0,
                created_at: newPostRaw.created_at || new Date().toISOString(),
                is_liked_by_me: false,
                _feedLabel: '✨ Just posted',
                author: {
                    id: session.user.id,
                    name: cachedMeta?.fullName || localMeta?.fullName || localMeta?.full_name || 'You',
                    username: cachedMeta?.username || localMeta?.username || null,
                    avatar_url: authorAvatar,
                    isTeacher: localMeta?.is_teacher || false,
                    totalPoints: 0,
                },
            };

            // Reset composer
            setContent('');
            removeImage();
            removeVideo();
            setSelectedCategory('general');
            setFocused(false);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';

            // If it's a video clip, redirect to the Clips view with this post pinned first.
            // ClipsClient already handles ?postId= by fetching that specific post first.
            if (videoUrl) {
                router.push(`/clips?postId=${newPostRaw.id}`);
                return;  // no need to refresh the social feed
            }

            // For regular (non-video) posts: prepend immediately + background sync
            setPosts(prev => {
                const merged = [optimisticPost, ...prev.filter(p => p.id !== optimisticPost.id)];
                currentPostIdsRef.current.add(optimisticPost.id);
                return merged;
            });

            // Then silently refresh in the background to sync full db state
            fetchFeed();
        } catch (err: any) {
            setPostError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const charsLeft = MAX_CHARS - content.length;
    const canPost = (content.trim() || imageFile || videoFile) && !submitting;
    const meta = session?.user?.user_metadata || {};
    const avatarUrl = (meta.avatar_url && !meta.avatar_url.includes('googleusercontent.com'))
        ? meta.avatar_url
        : null;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full mix-blend-overlay filter blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl" />

            {/* Fixed floating new-posts pill — always visible when scrolled down */}
            {newPostsQueue.length > 0 && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-400">
                    <button
                        onClick={applyNewPosts}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm text-white shadow-2xl shadow-indigo-600/40 active:scale-95 transition-transform"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                    >
                        <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                        {newPostsQueue.length === 1 ? '1 new post' : `${newPostsQueue.length} new posts`}
                    </button>
                </div>
            )}

            <main className="max-w-[1240px] px-4 sm:px-6 mx-auto relative z-10 w-full lg:flex lg:gap-8 justify-center">
                <div className="w-full lg:max-w-2xl flex-shrink overflow-x-hidden">

                    {/* Page title */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3 border border-purple-200/50 dark:border-purple-800/50">
                            <Sparkles className="w-3.5 h-3.5" /> Community Discussion
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                            Social Fire
                        </h1>
                    </div>

                    {/* ── Twitter-style Inline Composer ── */}
                    {currentUserId && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-4 shadow-sm overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="flex gap-3 px-4 pt-4 pb-3">
                                    {/* Avatar */}
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                        {avatarUrl ? (
                                            <Image src={avatarUrl} alt="You" width={44} height={44} className="object-cover w-full h-full" />
                                        ) : (
                                            <User className="w-5 h-5 m-auto text-slate-400 mt-3" />
                                        )}
                                    </div>

                                    {/* Textarea */}
                                    <div className="flex-1 relative">
                                        {/* Mention suggestions */}
                                        {suggestions.length > 0 && (
                                            <div
                                                ref={suggestionsRef}
                                                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50"
                                            >
                                                {suggestions.map(u => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => applySuggestion(u)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                                            {u.avatar_url
                                                                ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                : <User className="w-4 h-4 m-auto text-slate-400 mt-2" />
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold truncate text-slate-900 dark:text-white">@{u.username}</p>
                                                            <p className="text-xs text-slate-500 truncate">{u.full_name}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <textarea
                                            ref={textareaRef}
                                            value={content}
                                            onChange={e => handleContentChange(e.target.value)}
                                            onFocus={() => setFocused(true)}
                                            placeholder="What's happening in the academy?"
                                            rows={focused ? 3 : 1}
                                            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-[16px] leading-relaxed resize-none outline-none py-2 overflow-hidden"
                                            style={{ minHeight: '40px' }}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mx-4 mb-3 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group max-h-80">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain max-h-80" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Video Preview / Uploading State */}
                                {videoPreview && (
                                    <div className="mx-4 mb-3 relative rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-800/40 bg-slate-950 group" style={{ aspectRatio: '9/16', maxHeight: 280 }}>
                                        {submitting ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 absolute inset-0 z-10">
                                                <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mb-3 animate-pulse">
                                                    <Video className="w-6 h-6 text-violet-500" />
                                                </div>
                                                <span className="text-[14px] font-black text-violet-400 mb-4 text-center tracking-tight">
                                                    Optimizing & Uploading...
                                                </span>
                                                <div className="w-full max-w-[200px]">
                                                    <div className="flex justify-between text-xs font-black text-slate-400 mb-1.5 px-1">
                                                        <span>Progress</span>
                                                        <span>{videoUploadProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-full">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ease-out" 
                                                            style={{ width: `${videoUploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <video 
                                                    key={videoPreview}
                                                    src={videoPreview} 
                                                    className="w-full h-full object-contain" 
                                                    muted 
                                                    playsInline 
                                                    controls 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeVideo}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur transition-colors z-10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="absolute bottom-2 left-2 text-[10px] font-black bg-violet-600 text-white px-2 py-0.5 rounded-full z-10 shadow-lg">🎬 30s clip</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                
                                {/* Category Selection for Video Clips */}
                                {videoPreview && !submitting && (
                                    <div className="mx-4 mb-3">
                                        <p className="text-xs font-bold text-slate-500 mb-2">Category for this clip:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                        selectedCategory === cat 
                                                            ? 'bg-violet-600 text-white shadow-md' 
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {postError && (
                                    <p className="mx-4 mb-2 text-xs font-bold text-red-500">{postError}</p>
                                )}

                                {/* Action bar — only visible when focused or has content */}
                                {(focused || content || imagePreview || videoPreview) && (
                                    <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            {/* Image attach */}
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={submitting || !!videoFile}
                                                className="p-2 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors disabled:opacity-40"
                                                title="Add image"
                                            >
                                                <ImageIcon className="w-5 h-5" />
                                            </button>

                                            {/* Video clip attach */}
                                            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                                            <button
                                                type="button"
                                                onClick={() => videoInputRef.current?.click()}
                                                disabled={submitting || !!imageFile}
                                                className="p-2 rounded-full text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors disabled:opacity-40"
                                                title="Add 30s clip"
                                            >
                                                <Video className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Char counter */}
                                            {content.length > 0 && (
                                                <span className={`text-xs font-bold tabular-nums ${charsLeft < 50 ? charsLeft < 20 ? 'text-red-500' : 'text-amber-500' : 'text-slate-400'}`}>
                                                    {charsLeft}
                                                </span>
                                            )}

                                            {/* Post button */}
                                            <button
                                                type="submit"
                                                disabled={!canPost}
                                                className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-black text-sm transition-all ${canPost
                                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-indigo-500/30 hover:scale-[1.03] active:scale-95'
                                                        : 'bg-indigo-200 dark:bg-indigo-900/40 text-indigo-400 dark:text-indigo-600 cursor-not-allowed'
                                                    }`}
                                            >
                                                {submitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                                {submitting ? 'Posting…' : 'Post'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* ── New Posts Banner ── */}
                    {newPostsQueue.length > 0 && (
                        <button
                            onClick={applyNewPosts}
                            className="w-full mb-3 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-black text-sm text-white shadow-lg shadow-indigo-500/30 animate-in slide-in-from-top-2 duration-300"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            <ArrowUp className="w-4 h-4 animate-bounce" />
                            {newPostsQueue.length === 1
                                ? '1 new post — tap to see it'
                                : `${newPostsQueue.length} new posts — tap to see them`}
                        </button>
                    )}

                    {/* ── Feed ── */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 animate-pulse space-y-3">
                                    <div className="h-2.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No posts yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Be the first to share something with the academy!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {posts.map((p: any) => (
                                    <PostCard
                                        key={p.id}
                                        post={p}
                                        currentUserId={currentUserId}
                                        feedLabel={p._feedLabel}
                                        onUpdate={fetchFeed}
                                    />
                                ))}
                            </div>

                            {/* Infinite scroll sentinel */}
                            <div ref={observerTarget} className="py-6 flex justify-center">
                                {loadingMore ? (
                                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        Loading older posts...
                                    </div>
                                ) : hasMore && posts.length > 0 ? (
                                    <div className="text-slate-400 dark:text-slate-500 text-sm italic">
                                        Scroll down to see more
                                    </div>
                                ) : posts.length > 0 ? (
                                    <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-800/50 py-3 px-6 rounded-full">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        You&apos;ve reached the end
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:block w-[320px] shrink-0 xl:w-[340px]">
                    <div className="sticky top-28">
                        <SuggestedUsersCard />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SocialFeedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
            <SocialFeedContent />
        </Suspense>
    );
}
