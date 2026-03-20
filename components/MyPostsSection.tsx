"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, MessageCircle, Heart, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MyPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export default function MyPostsSection() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm('Delete this post? This will also remove its image and comments.');
    if (!confirmed) return;

    setDeletingId(postId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Failed to delete post');
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-6 sm:p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Posts</h2>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {posts.length} total
        </span>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-semibold">Loading posts...</span>
        </div>
      ) : !hasPosts ? (
        <div className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          You have not posted anything yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <p className="text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {post.content}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>

              {post.image_url && (
                <div className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-[360px] object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes_count || 0}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments_count || 0}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-900/20 disabled:opacity-60"
                >
                  {deletingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
