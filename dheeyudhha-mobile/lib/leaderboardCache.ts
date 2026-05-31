/**
 * Shared leaderboard cache — now delegates to Next.js Data Cache via revalidateTag.
 *
 * BEFORE: In-memory singleton. Useless on Vercel — each serverless instance has its
 * own heap, so invalidate() on instance A has NO effect on instances B, C, D, ...
 *
 * AFTER: invalidate() calls revalidateTag('leaderboard') which purges the shared
 * Next.js Data Cache, correctly invalidating across ALL instances simultaneously.
 * The actual cached query lives in lib/cache.ts (getCachedLeaderboard).
 */

// Keep the LeaderboardUser type here since it's imported across the codebase
export interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    school: string;
    avatar: string | null;
    points: number;
    rank: number;
    streak: number;
    schoolColor: string;
    cosmetics?: string[];
}

export const leaderboardCache = {
    /** @deprecated No-op kept for compatibility. Data Cache TTL is 60s. */
    data: null as null,
    /** @deprecated No-op kept for compatibility. */
    expiresAt: 0,
    /** @deprecated No-op kept for compatibility. */
    isValid(): boolean { return false; },
    /** @deprecated No-op kept for compatibility. */
    set(_data: any, _ttl?: number) {},

    /**
     * No-op — leaderboard refreshes strictly on the 20-minute Data Cache TTL.
     * Kept for call-site compatibility; do NOT call revalidateTag here or individual
     * solves will bust the cache and defeat the 20-min rule.
     */
    invalidate() { /* intentional no-op — TTL handles refresh */ },
};

