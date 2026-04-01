'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ImageIcon, X, Send, User, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { compressImage } from '@/utils/compressImage';

export default function CreatePostPage() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (!currentSession) {
                router.push('/login');
            } else {
                setSession(currentSession);
            }
        });
    }, [router]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Increase limit to 20MB for modern phone cameras
            if (file.size > 20 * 1024 * 1024) {
                setError('Image exceeds 20MB limit. Please choose a smaller file.');
                return;
            }
            setError('');
            setLoading(true);
            try {
                // Use the standard utility that converts blobl to proper File and appends .webp extension
                const finalFile = await compressImage(file, 'banner'); // 'banner' preset fits well for posts
                
                setImageFile(finalFile);
                
                // Show local preview immediately fast
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
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `post-${Date.now()}.${fileExt}`;
                const filePath = `posts/${session.user.id}/${fileName}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('public-images')
                    .upload(filePath, imageFile, {
                        contentType: imageFile.type || 'image/webp',
                        upsert: false
                    });

                if (uploadError) throw new Error(uploadError.message || "Image upload failed");

                const { data: publicUrlData } = supabase.storage
                    .from('public-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrlData.publicUrl;
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 pt-4 sm:pt-8 md:pt-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Feed
                </Link>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                            {session.user.user_metadata?.avatar_url ? (
                                <img src={session.user.user_metadata.avatar_url} alt="You" className="object-cover w-full h-full" />
                            ) : (
                                <User className="w-6 h-6 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-slate-900 dark:text-white">Create a new post</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Share something with the community</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold text-sm border border-red-200 dark:border-red-500/30">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind? Did you learn something new?"
                                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-h-[160px] text-slate-900 dark:text-white text-[15px] resize-y outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 mb-2"
                                disabled={loading}
                            />
                            <p className="text-[11px] font-bold text-[#8B4513] dark:text-[#D2B48C] px-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Tip: You can tag other users using @username in your post.
                            </p>
                        </div>

                        {imagePreview && (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[400px] bg-slate-100 dark:bg-slate-950 flex items-center justify-center group">
                                <img src={imagePreview} alt="Preview" className="max-w-full max-h-[400px] object-contain transition-transform group-hover:scale-[1.02] duration-500" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    disabled={loading}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10 shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                disabled={loading}
                            />
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors group"
                            >
                                <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                Add high-res Image
                            </button>

                            <button
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
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" /> Post to Community
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
