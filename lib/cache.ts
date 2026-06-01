/**
 * lib/cache.ts — Centralized Next.js Data Cache helpers
 *
 * WHY: Vercel spins up a new serverless instance per request (or reuses one from the pool).
 * In-memory caches (like leaderboardCache.ts) are USELESS on Vercel — each instance has its
 * own heap. Two requests in the same second may hit different instances.
 *
 * SOLUTION: Next.js `unstable_cache` writes to the shared Data Cache (backed by the file system
 * on Vercel — shared across all instances for the same deployment). Combined with tag-based
 * invalidation via `revalidateTag`, this gives us:
 *   - True cross-instance caching
 *   - On-demand invalidation when data changes (POST/mutations)
 *   - Automatic stale-while-revalidate semantics
 */

import { unstable_cache } from 'next/cache';
import supabaseAdmin from './supabaseAdmin';

// ─── Cache Tags (use for revalidation on mutations) ────────────────────────────
export const CACHE_TAGS = {
  leaderboard: 'leaderboard',
  posts: 'posts',
  schools: 'schools',
} as const;

// ─── Leaderboard (top 10 by total_points) ─────────────────────────────────────
// Revalidate every 60s OR when revalidateTag('leaderboard') is called after a
// points change. Previously queried Supabase on EVERY request.
export const getCachedLeaderboard = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, school, avatar_url, total_points, is_teacher, cosmetics')
      .eq('is_teacher', false)
      .not('username', 'is', null)
      .neq('username', '')
      .order('total_points', { ascending: false })
      .order('id', { ascending: true })
      .limit(10);

    if (error) throw new Error(error.message);

    return (data || []).map((p: any, i: number) => ({
      id: p.id,
      rank: i + 1,
      name: p.full_name || p.username || 'Student',
      username: p.username,
      school: p.school || 'Unknown School',
      avatar: p.avatar_url || null,
      points: Number(p.total_points) || 0,
      streak: 0,
      schoolColor: 'bg-blue-500',
      cosmetics: p.cosmetics || [],
    }));
  },
  ['leaderboard-top10'],
  { revalidate: 60, tags: [CACHE_TAGS.leaderboard] }  // 1 minute
);

// ─── Community Posts (first page, non-personalized) ───────────────────────────
// Auth-specific fields (is_liked_by_me) are added per-request on top.
// This caches the heavy DB join (posts + post_likes) for 30s across all users.
export const getCachedPublicPosts = unstable_cache(
  async (limit = 30) => {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, author_id, content, image_url, image_urls, video_url, video_thumbnail, likes_count, comments_count, created_at, post_likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    // Fetch author profiles in one shot
    const authorIds = [...new Set((data || []).map((p: any) => p.author_id))] as string[];
    const { data: profilesRaw } = authorIds.length
      ? await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_url, school, is_teacher, total_points, is_ghost, cosmetics')
        .in('id', authorIds)
      : { data: [] };
    const profilesMap = new Map((profilesRaw || []).map((p: any) => [p.id, p]));

    const missingAuthorIds = authorIds.filter(id => {
      const p = profilesMap.get(id);
      return !p || !p.full_name;
    });

    const authUsersMap = new Map();
    if (missingAuthorIds.length > 0) {
      await Promise.allSettled(missingAuthorIds.map(async (id) => {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          if (data?.user) authUsersMap.set(id, data.user);
        } catch { /* silent */ }
      }));
    }

    return (data || []).map((p: any) => {
      const profile = profilesMap.get(p.author_id);
      const isGhost = profile?.is_ghost === true;
      const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);
      let finalContent = p.content || '';
      let isPinned = false;
      if (finalContent.startsWith('[PINNED]')) { isPinned = true; finalContent = finalContent.substring(8).trim(); }

      const authUser = authUsersMap.get(p.author_id);
      const meta = authUser?.user_metadata || {};
      const authName = authUser?.full_name || meta?.fullName || meta?.full_name || meta?.name || meta?.username || (authUser?.email ? authUser.email.split('@')[0] : null);

      return {
        id: p.id,
        author_id: p.author_id,
        content: finalContent,
        image_url: p.image_url,
        image_urls: p.image_urls || [],
        video_url: p.video_url || null,
        video_thumbnail: p.video_thumbnail || null,
        likes_count: likesCount,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
        is_pinned: isPinned,
        // post_likes kept so callers can compute is_liked_by_me per user
        _likeUserIds: (p.post_likes || []).map((l: any) => l.user_id) as string[],
        author: {
          id: p.author_id,
          name: profile?.full_name || authName || profile?.username || 'Student',
          username: profile?.username || meta?.username || null,
          avatar_url: isGhost ? null : (profile?.avatar_url || meta?.avatar_url || meta?.picture || null),
          school: profile?.school || meta?.school || null,
          isTeacher: profile?.is_teacher || meta?.isTeacher || meta?.is_teacher || false,
          totalPoints: Number(profile?.total_points) || Number(meta?.totalPoints) || 0,
          isGhost,
          cosmetics: profile?.cosmetics || meta?.cosmetics || [],
        },
      };
    });
  },
  ['public-posts-page1'],
  { revalidate: 30, tags: [CACHE_TAGS.posts] }
);

// ─── Schools list ──────────────────────────────────────────────────────────────
// Schools change rarely — cache for 5 minutes.
export const getCachedSchools = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('schools')
      .select('id, name, city, state, member_count, avatar_url, total_points')
      .order('total_points', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  },
  ['schools-list'],
  { revalidate: 300, tags: [CACHE_TAGS.schools] }
);
