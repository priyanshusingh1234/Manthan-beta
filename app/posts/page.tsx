'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import SuggestedUsersCard from '@/components/SuggestedUsersCard';
import { ImageIcon, X, Sparkles, User, Send } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/utils/compressImage';
import { Check } from 'lucide-react';

const MAX_CHARS = 500;

export default function SocialFeedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);

    // Pagination state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Composer state
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState('');
    const [focused, setFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // ── Auto-grow textarea ──────────────────────────────────────────────────
    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    // ── Fetch feed ──────────────────────────────────────────────────────────
    const fetchFeed = useCallback(async () => {
        setLoading(true);
        setHasMore(true);
        try {
            const { data: { session: s } } = await supabase.auth.getSession();
            const token = s?.access_token || null;
            const res = await fetch(`/api/feed?limit=60&t=${Date.now()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            if (!res.ok) throw new Error(await res.text());
            const rawData = await res.json();
            const allItems = Array.isArray(rawData) ? rawData : (rawData?.questions || []);
            const postItems = allItems.filter((item: any) => item.type === 'post');

            if (postItems.length < 5) {
                const fbRes = await fetch(`/api/posts?limit=20&t=${Date.now()}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                });
                if (fbRes.ok) {
                    const fbData = await fbRes.json();
                    const existingIds = new Set(postItems.map((p: any) => p.id));
                    const fallbackPosts = (Array.isArray(fbData) ? fbData : [])
                        .filter((p: any) => !existingIds.has(p.id))
                        .map((p: any) => ({ ...p, type: 'post', _feedLabel: '💡 Community Post' }));
                    const combined = [...postItems, ...fallbackPosts];
                    setPosts(combined);
                    if (fallbackPosts.length < 20) setHasMore(false);
                    return;
                }
            }
            setPosts(postItems);
            // If very few items, probably reached the end
            if (postItems.length < 10 && allItems.length < 60) setHasMore(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

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
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, posts.length]);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) {
                setCurrentUserId(s?.user?.id || null);
                setSession(s);
                fetchFeed();
            }
        });
        return () => { mounted = false; };
    }, [fetchFeed]);

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

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;
        if (!session) return;
        setSubmitting(true);
        setPostError('');
        try {
            let imageUrl = null;
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

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ content: content.trim(), imageUrl }),
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
                content: content.trim(),
                image_url: imageUrl,
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
            setFocused(false);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';

            // Prepend the new post immediately so it's visible right away
            setPosts(prev => [optimisticPost, ...prev.filter(p => p.id !== optimisticPost.id)]);

            // Then silently refresh in the background to sync full db state
            fetchFeed();
        } catch (err: any) {
            setPostError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const charsLeft = MAX_CHARS - content.length;
    const canPost = (content.trim() || imageFile) && !submitting;
    const meta = session?.user?.user_metadata || {};
    const avatarUrl = (meta.avatar_url && !meta.avatar_url.includes('googleusercontent.com'))
        ? meta.avatar_url
        : null;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full mix-blend-overlay filter blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl" />

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

                                {/* Error */}
                                {postError && (
                                    <p className="mx-4 mb-2 text-xs font-bold text-red-500">{postError}</p>
                                )}

                                {/* Action bar — only visible when focused or has content */}
                                {(focused || content || imagePreview) && (
                                    <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            {/* Image attach */}
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={submitting}
                                                className="p-2 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                title="Add image"
                                            >
                                                <ImageIcon className="w-5 h-5" />
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
                                                className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-black text-sm transition-all ${
                                                    canPost
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
