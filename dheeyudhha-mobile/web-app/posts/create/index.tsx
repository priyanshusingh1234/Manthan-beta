import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from '@/lib/next-navigation';
import { ImageIcon, X, Send, User, ChevronLeft, Sparkles } from 'lucide-react-native';
import { Link } from 'expo-router';
import { compressImage } from '@/utils/compressImage';

export default function CreatePostPage() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [error, setError] = useState('');

    // MENTION LOGIC
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

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
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (!currentSession) {
                router.push('/login');
            } else {
                setSession(currentSession);
            }
        });
    }, [router]);

    const handleContentChange = async (val: string) => {
        setContent(val);
        
        // Detect @ mention
        const activeEl = textareaRef.current;
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

    const applySuggestion = (user: any) => {
        if (mentionIndex === null) return;
        const handle = user.username;
        const before = content.slice(0, mentionIndex);
        const after = content.slice(mentionIndex + (mentionSearch?.length || 0) + 1);
        setContent(`${before}@${handle} ${after}`);
        setSuggestions([]);
        setMentionSearch(null);
        textareaRef.current?.focus();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                setError('Image exceeds 20MB limit. Please choose a smaller file.');
                return;
            }
            setError('');
            setLoading(true);
            try {
                const finalFile = await compressImage(file, 'banner'); 
                setImageFile(finalFile);
                const objectUrl = URL.createObjectURL(finalFile);
                setImagePreview(objectUrl);
            } catch (err) {
                console.error("Image processing failed", err);
                setError("Failed to process image.");
            } finally {
                setLoading(false);
            }
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) {
            setError("Post cannot be completely empty.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            let imageUrl = null;

            if (imageFile && session) {
                // Ensure we have a real Blob before uploading.
                // On mobile, imageFile from compressImage may not be a standard Blob.
                // Fetch from the imagePreview blob: URL to get a guaranteed real Blob.
                let uploadBlob: Blob;
                const isRealBlob = (imageFile instanceof Blob) ||
                    (imageFile && typeof (imageFile as any).size === 'number' && typeof (imageFile as any).slice === 'function');

                if (isRealBlob) {
                    uploadBlob = imageFile as unknown as Blob;
                } else if (imagePreview) {
                    const res = await fetch(imagePreview);
                    uploadBlob = await res.blob();
                } else {
                    throw new Error("No valid image data available. Please re-select the image.");
                }

                const ext = (imageFile as any)?.name?.split('.').pop() || 'jpg';
                const form = new FormData();
                form.append('file', uploadBlob, `post-${Date.now()}.${ext}`);

                const uploadRes = await fetch('/api/posts/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: form,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
                imageUrl = uploadData.url;
            }

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ content: content.trim(), imageUrl })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create post.");
            }

            router.push('/posts');
        } catch (err: any) {
            console.error("Submission failed:", err);
            setError(err.message === 'Failed to fetch' 
                ? "Network Error: Failed to reach server. Please check your internet connection or try a smaller image." 
                : err.message
            );
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 pt-4 sm:pt-8 md:pt-12 px-4 sm:px-6">
            <View className="max-w-2xl mx-auto">
                <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors flex-row">
                    <ChevronLeft className="w-4 h-4" /> Back to Feed
                </Link>

                <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
                    <View className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 flex-row">
                        <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden relative flex-row">
                            {(() => {
                                const m = session.user.user_metadata || {};
                                const av = m.avatar_url && !m.avatar_url.includes('googleusercontent.com') ? m.avatar_url : null;
                                return av ? (
                                    <Image src={av} alt="You" className="object-cover w-full h-full" />
                                ) : (
                                    <User className="w-6 h-6 text-slate-400" />
                                );
                            })()}
                        </View>
                        <View>
                            <Text className="font-black text-xl text-slate-900 dark:text-white">Create a new post</Text>
                            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Share something with the community</Text>
                        </View>
                    </View>

                    {error && (
                        <View className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold text-sm border border-red-200 dark:border-red-500/30">
                            {error}
                        </View>
                    )}

                    <View onPress={handleSubmit} className="space-y-6">
                        <View className="relative">
                            {/* Suggestions Dropdown */}
                            {suggestions.length > 0 && (
                                <View 
                                    ref={suggestionsRef}
                                    className="absolute top-full left-0 mt-2 w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in slide-in-from-top-2"
                                >
                                    <View className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <Text className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Suggested Scholars</Text>
                                    </View>
                                    <View className="max-h-48 overflow-y-auto">
                                        {suggestions.map((u) => (
                                            <View
                                                key={u.id}
                                                type="button"
                                                onPress={() => applySuggestion(u)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800 text-left group flex-row"
                                            >
                                                <View className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100/50 border border-indigo-200/50 px-0.5 pt-0.5">
                                                    {u.avatar_url ? (
                                                        <Image src={u.avatar_url} className="w-full h-full object-cover rounded-full" alt="avatar" />
                                                    ) : (
                                                        <User className="w-4 h-4 m-auto text-slate-400" />
                                                    )}
                                                </View>
                                                <View className="min-w-0">
                                                    <Text className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">@{u.username}</Text>
                                                    <Text className="text-[10px] text-slate-500 truncate">{u.full_name}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder="What's on your mind? Did you learn something new?"
                                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-h-[160px] text-slate-900 dark:text-white text-[15px] resize-y outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 mb-2"
                                disabled={loading}
                            />
                            <Text className="text-[11px] font-bold text-[#8B4513] dark:text-[#D2B48C] px-1 flex items-center gap-1 flex-row">
                                <Sparkles className="w-3 h-3" /> Tip: You can tag other users using @username in your post.
                            </Text>
                        </View>

                        {imagePreview && (
                            <View className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[400px] bg-slate-100 dark:bg-slate-950 flex items-center justify-center group flex-row">
                                <Image src={imagePreview} alt="Preview" className="max-w-full max-h-[400px] object-contain transition-transform group-hover:scale-[1.02] duration-500" />
                                <View
                                    type="button"
                                    onPress={removeImage}
                                    disabled={loading}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10 shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </View>
                            </View>
                        )}

                        <View className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                            <TextInput
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                disabled={loading}
                            />
                            
                            <View
                                type="button"
                                onPress={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors group flex-row"
                            >
                                <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                Add high-res Image
                            </View>

                            <View
                                type="submit"
                                disabled={loading || (!content.trim() && !imageFile)}
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                                    (content.trim() || imageFile) 
                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg hover:shadow-indigo-500/25 shadow-indigo-500/10 hover:-translate-y-0.5' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <View className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" /> Post to Community
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
