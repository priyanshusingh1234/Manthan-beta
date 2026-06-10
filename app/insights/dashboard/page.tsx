'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';

export default function ProfessionalDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });
    const [topPosts, setTopPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch all posts by user
            const { data: posts } = await supabase
                .from('posts')
                .select('id, content, views_count, likes_count, comments_count, created_at')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (posts) {
                const totalViews = posts.reduce((acc, p) => acc + (p.views_count || 0), 0);
                const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count || 0), 0);
                const totalComments = posts.reduce((acc, p) => acc + (p.comments_count || 0), 0);

                setStats({ views: totalViews, likes: totalLikes, comments: totalComments });

                // Sort by views
                const sorted = [...posts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
                setTopPosts(sorted.slice(0, 5));
            }
            setLoading(false);
        };
        fetchDashboardData();
    }, []);

    return (
        <ClientLayout>
            <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-20 pt-8 sm:pt-12">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold">Back to Profile</span>
                </button>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Professional Dashboard</h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Track your content performance</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Overall Stats */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mb-3">
                                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.views}</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Views</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 mb-3">
                                    <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.likes}</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Likes</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <div className="p-2.5 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-500 mb-3">
                                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.comments}</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Comments</span>
                            </div>
                        </div>

                        {/* Top Performing Posts */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 mt-8">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Top Performing Posts</h2>
                            </div>
                            
                            {topPosts.length === 0 ? (
                                <p className="text-slate-500 text-center py-4 font-medium">No posts yet to show performance.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topPosts.map((post, idx) => (
                                        <div key={post.id} onClick={() => router.push(`/insights/${post.id}`)} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500 dark:text-slate-400 shrink-0">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {post.content || 'Media Post'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                                                {post.views_count || 0}
                                                <Eye className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
