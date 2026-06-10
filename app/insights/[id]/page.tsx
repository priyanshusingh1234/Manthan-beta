'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Heart, MessageCircle } from 'lucide-react';

export default function PostInsightsPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!params.id) return;
            const { data } = await supabase.from('posts').select('*').eq('id', params.id).single();
            setPost(data);
            setLoading(false);
            
            // Increment views
            if (params.id) {
                await supabase.rpc('increment_post_views', { p_post_id: params.id }).catch(() => {});
            }
        };
        fetchPost();
    }, [params.id]);

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20 pt-8 sm:pt-12">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold">Back</span>
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Post Insights</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : !post ? (
                    <div className="text-center py-20 text-slate-500 font-bold">Post not found.</div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Discovery</h2>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                        <Eye className="w-6 h-6" />
                                    </div>
                                    <span className="font-semibold">Total Views</span>
                                </div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{post.views_count || 0}</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Interactions</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500">
                                            <Heart className="w-6 h-6" />
                                        </div>
                                        <span className="font-semibold">Likes</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{post.likes_count || 0}</span>
                                </div>
                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/50 w-full"></div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <div className="p-3 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-500">
                                            <MessageCircle className="w-6 h-6" />
                                        </div>
                                        <span className="font-semibold">Comments</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{post.comments_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}
