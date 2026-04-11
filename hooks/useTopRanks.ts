'use client';

import { useState, useEffect, useCallback } from 'react';

export function clearRankCache() {
    // No-op: kept for backward compatibility. Cache has been removed.
}

export function useTopRanks() {
    const [ranks, setRanks] = useState<Record<string, number>>({});

    const fetchRanks = useCallback(async () => {
        try {
            // Always fetch fresh — no module-level cache so badges update immediately
            const res = await fetch(`/api/leaderboard?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                const newRanks: Record<string, number> = {};
                (data.topBrains || []).forEach((u: any) => {
                    newRanks[u.id] = u.rank;
                });
                setRanks(newRanks);
            }
        } catch (err) {
            console.error('[useTopRanks] Failed to fetch ranks:', err);
        }
    }, []);

    useEffect(() => {
        fetchRanks();
    }, [fetchRanks]);

    const getRank = (userId: string) => ranks[userId] || null;

    return { ranks, getRank, refetch: fetchRanks };
}
