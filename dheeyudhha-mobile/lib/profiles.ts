/**
 * profiles.ts — Fast profile lookups via the `profiles` table.
 * 
 * This replaces all auth.admin.listUsers() calls across the codebase.
 * The profiles table is kept in sync via upsertProfile() which is called
 * on every signup / metadata update.
 */

import supabaseAdmin from './supabaseAdmin';
import { leaderboardCache } from './leaderboardCache';
import { sanitizeUsernameInput } from './username';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    school: string | null;
    school_id: string | null;
    is_teacher: boolean;
    streak_count: number;
    streak_longest: number;
    last_streak_at: string | null;
    daily_solve_count: number;
    daily_solve_date: string | null;
    daily_solved: number;
    total_points: number;
    xp: number;
    username: string | null;
    updated_at: string;
    cosmetics?: string[] | null;
    is_ghost?: boolean;
    login_bonus_day: number;
    last_login_claim_date: string | null;
    login_bonus_completed: boolean;
    is_private: boolean;
}

/**
 * Upsert a single user's profile from their auth user_metadata.
 * Call this on every signup and every metadata update.
 *
 * AVATAR PRESERVATION RULE:
 * We NEVER erase an existing custom avatar from profiles.avatar_url unless the
 * incoming metadata explicitly provides a better one. Every point-awarding route
 * (solve, test/submit, written-submit, etc.) calls this with partial auth metadata
 * that only carries the Google OAuth avatar_url — not the user's uploaded photo.
 * Without this guard, each game action would overwrite profiles.avatar_url → null.
 */
export async function upsertProfile(userId: string, meta: Record<string, any>, preserveDBPoints: boolean = false) {
    const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');

    // Determine the best avatar to persist:
    //   1. avatar_url from incoming meta (user just uploaded) — always wins
    //   2. Existing profiles.avatar_url if it's already a non-Google custom URL — preserve it
    //   3. Otherwise null — never write a stale Google URL into the DB
    const incomingCustom = meta.avatar_url && !isGoogleUrl(meta.avatar_url)
        ? meta.avatar_url
        : null;

    let finalAvatar: string | null = incomingCustom;

    let dbPoints: number | undefined;

    if (!finalAvatar || preserveDBPoints || true) { // Always fetch existing to protect DB Custom Avatars
        // Read the current DB value
        try {
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('avatar_url, total_points, xp, cosmetics')
                .eq('id', userId)
                .maybeSingle();

            if (existing?.avatar_url && !isGoogleUrl(existing.avatar_url)) {
                // If the DB already has a custom avatar, IT IS SACRED.
                // We NEVER let stale JWTs from background routes overwrite the DB's avatar.
                // The ONLY way this changes is if explicit targeted .update() queries are run.
                finalAvatar = existing.avatar_url;
            }
            if (existing) {
                dbPoints = existing.total_points;
                // If incoming meta doesn't have cosmetics, but DB does, preserve DB ones
                if (!meta.cosmetics && existing.cosmetics) {
                    meta.cosmetics = existing.cosmetics;
                }
            }
        } catch { /* non-fatal — fall through to null */ }
    }

    const sanitizedUsername = sanitizeUsernameInput(String(meta.username || ''));

    const { error } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: meta.fullName || meta.name || null,
        avatar_url: finalAvatar,
        school: meta.school || null,
        school_id: meta.school_id ? String(meta.school_id) : null,
        is_teacher: meta.isTeacher === true,
        streak_count: Number(meta.streakCount) || 0,
        streak_longest: Number(meta.streakLongest) || 0,
        last_streak_at: meta.lastStreakAt || null,
        last_streak_count: Number(meta.lastStreakCount) || 0,
        daily_solve_count: Number(meta.dailySolveCount) || 0,
        daily_solve_date: meta.dailySolveDate || null,
        daily_solved: Number(meta.dailySolved) || 0,
        total_points: preserveDBPoints && dbPoints !== undefined ? dbPoints : (Number(meta.totalPoints) || 0),
        xp: Number(meta.xp) || 0,
        username: sanitizedUsername || null,
        updated_at: new Date().toISOString(),
        cosmetics: meta.cosmetics || [],
        login_bonus_day: Number(meta.loginBonusDay) || 0,
        last_login_claim_date: meta.lastLoginClaimDate || null,
        login_bonus_completed: meta.loginBonusCompleted === true,
        is_private: meta.isPrivate === true,
        monthly_points: meta.monthlyPoints !== undefined ? Number(meta.monthlyPoints) : undefined,
        monthly_points_month: meta.monthlyPointsMonth !== undefined ? String(meta.monthlyPointsMonth) : undefined,
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

/**
 * Fetch Top Students specifically (ignores teachers and limits count).
 * Prevents over-fetching all users into memory just for the leaderboard.
 */
export async function getTopStudents(limit: number = 50): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_teacher', false)
        .not('username', 'is', null)
        .order('total_points', { ascending: false })
        .order('id', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('[getTopStudents] error:', error.message);
        return [];
    }
    return (data || []) as Profile[];
}