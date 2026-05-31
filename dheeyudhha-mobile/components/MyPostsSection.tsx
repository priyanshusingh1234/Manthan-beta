"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, LayoutGrid } from 'lucide-react-native';
import PostCard from './PostCard';

interface MyPostsSectionProps {
  userId?: string; // If passed, uses the public /api/posts/user/[id] route (no auth required)
}

export default function MyPostsSection({ userId }: MyPostsSectionProps = {}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resolvedUserId = userId || session?.user?.id || null;
      setCurrentUserId(session?.user?.id || null);

      if (!resolvedUserId) {
        setPosts([]);
        return;
      }

      // Always use the public user route — same one the public profile uses, no auth required
      const res = await fetch(`/api/posts/user/${resolvedUserId}?t=${Date.now()}`, {
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
    <View className="mt-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm p-6 sm:p-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <View className="flex items-center justify-between mb-8 flex-row">
        <View>
          <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Your Journal</Text>
          <Text className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">My Posts</Text>
        </View>
        <Text className="text-xs font-black px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {posts.length} Contributions
        </Text>
      </View>

      {loading ? (
        <View className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <Text className="text-sm font-bold italic">Gathering your thoughts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <View className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 shadow-sm flex-row">
            <LayoutGrid className="w-8 h-8" />
          </View>
          <Text className="text-slate-400 font-bold italic tracking-tight">You haven&apos;t shared any posts yet.</Text>
        </View>
      ) : (
        <View className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onUpdate={loadPosts} 
            />
          ))}
        </View>
      )}
    </View>
  );
}
