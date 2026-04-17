/**
 * profiles.ts — Fast profile lookups via the `profiles` table.
 * 
 * This replaces all auth.admin.listUsers() calls across the codebase.
 * The profiles table is kept in sync via upsertProfile() which is called
 * on every signup / metadata update.
 */

import supabaseAdmin from './supabaseAdmin';
import { leaderboardCache } from './leaderboardCache';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    school: string | null;
    school_id: string | null;
    is_teacher: boolean;
    is_ghost: boolean;
    streak_count: number;
    last_streak_at: string | null;
    daily_solved: number;
    total_points: number;
    username: string | null;
    updated_at: string;
    cosmetics?: string[] | null;
}

/**
 * Upsert a single user's profile from their auth user_metadata.
 * Call this on every signup and every metadata update.
 */
export async function upsertProfile(userId: string, meta: Record<string, any>) {
    // Intentionally store ONLY user-uploaded custom avatars in profiles.avatar_url.
    // Do NOT fall back to Google/provider avatars (avatar_url, picture): those URLs
    // expire for third-party requests and expose provider account information in
    // public surfaces (feed, leaderboard, question cards, etc.).
    // When a user has no custom avatar, profiles.avatar_url remains null and the UI
    // falls back to initials — this is the desired behaviour.
    const finalAvatar = meta.custom_avatar_url || null;

    const { error } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: meta.fullName || meta.name || null,
        avatar_url: finalAvatar,
        school: meta.school || null,
        school_id: meta.school_id ? String(meta.school_id) : null,
        is_teacher: meta.isTeacher === true,
        streak_count: Number(meta.streakCount) || 0,
        last_streak_at: meta.lastStreakAt || null,
        daily_solved: Number(meta.dailySolved) || 0,
        total_points: Number(meta.totalPoints) || 0,
        username: meta.username || null,
        updated_at: new Date().toISOString(),
        cosmetics: meta.cosmetics || [],
    }, { onConflict: 'id' });

    if (error) {
        console.error('[upsertProfile] failed:', error.message);
    } else {
        leaderboardCache.invalidate();
    }
}

/**
 * Fetch profiles for a list of user IDs.
 * Returns a Map<userId, Profile> for O(1) lookups.
 */
export async function getProfilesMap(userIds: string[]): Promise<Map<string, Profile>> {
    if (!userIds.length) return new Map();

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (error) {
        console.error('[getProfilesMap] error:', error.message);
        return new Map();
    }

    return new Map((data || []).map(p => [p.id, p as Profile]));
}

/**
 * Fetch a single profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('[getProfile] error:', error.message);
        return null;
    }
    return data as Profile | null;
}

/**
 * Fetch ALL profiles — for leaderboard type queries.
 * Much faster than listUsers() since it queries a regular table.
 */
export async function getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .order('id', { ascending: true });

    if (error) {
        console.error('[getAllProfiles] error:', error.message);
        return [];
    }
    return (data || []) as Profile[];
}
