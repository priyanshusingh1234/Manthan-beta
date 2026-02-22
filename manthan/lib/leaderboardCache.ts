/**
 * Shared in-memory leaderboard cache.
 * By using a singleton module, both the leaderboard API and the checker-vote API
 * can share the same cache instance — so checker-vote can instantly invalidate it
 * when points change, and the next leaderboard request will always be fresh.
 */

export const leaderboardCache = {
    data: null as { topBrains: any[] } | null,
    expiresAt: 0,

    isValid(): boolean {
        return this.data !== null && Date.now() < this.expiresAt;
    },

    set(data: { topBrains: any[] }, ttlMs = 20_000) {
        this.data = data;
        this.expiresAt = Date.now() + ttlMs;
    },

    /** Call this whenever any user's points change */
    invalidate() {
        this.data = null;
        this.expiresAt = 0;
    },
};
