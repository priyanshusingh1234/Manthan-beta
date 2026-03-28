'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import BadgedName from '@/components/BadgedName';

export default function SinglePostClient({ postId }: { postId: string }) {
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;
                setCurrentUserId(session?.user?.id || null);

                const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
                const res = await fetch(`/api/posts/${postId}`, { headers });
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    setPost(data);
                } else {
                    setPost(null);
                }
            } catch {
                if (mounted) setPost(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [postId]);

    const refreshPost = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
            const res = await fetch(`/api/posts/${postId}`, { headers });
            if (res.ok) setPost(await res.json());
        } catch { }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-bold animate-pulse">Loading discussion...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return <div className="p-20 text-center font-bold text-slate-500">Post not found.</div>;
    }

    const profileUrl = post.author?.isTeacher && post.author?.username ? `/teacher/${post.author.username}` : post.author?.username ? `/user/${post.author.username}` : '#';

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
                                {post.author?.avatar_url ? (
                                    <Image src={post.author.avatar_url} alt="avatar" fill className="object-cover" />
                                ) : (
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto text-slate-400" />
                                )}
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
                                <Clock className="w-2.5 h-2.5" /> {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {post.comments_count || 0}
                        </div>
                    </div>
                </div>

                <PostCard post={post} currentUserId={currentUserId} onUpdate={refreshPost} />
            </main>
        </div>
    );
}
