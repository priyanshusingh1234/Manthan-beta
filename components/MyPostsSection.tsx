"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, LayoutGrid } from 'lucide-react';
import PostCard from './PostCard';

export default function MyPostsSection() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
      
      if (!session?.access_token) {
        setPosts([]);
        return;
      }

      const res = await fetch('/api/posts/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        setPosts([]);
        return;
      }

      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load my posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      loadPosts();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-6 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Your Journal</h3>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">My Posts</h2>
        </div>
        <span className="text-xs font-black px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {posts.length} Contributions
        </span>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-sm font-bold italic">Gathering your thoughts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 shadow-sm">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-bold italic tracking-tight">You haven&apos;t shared any posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onUpdate={loadPosts} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
