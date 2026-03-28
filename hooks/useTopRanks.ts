'use client';

import { useState, useEffect } from 'react';

// Simple global cache for ranks during the session
let globalRankCache: Record<string, number> = {};
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTopRanks() {
    const [ranks, setRanks] = useState<Record<string, number>>(globalRankCache);

    useEffect(() => {
        const fetchRanks = async () => {
            if (Date.now() - lastFetch < CACHE_DURATION && Object.keys(globalRankCache).length > 0) {
                return;
            }

            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    const newRanks: Record<string, number> = {};
                    (data.topBrains || []).forEach((u: any, i: number) => {
                        newRanks[u.id] = u.rank;
                    });
                    globalRankCache = newRanks;
                    lastFetch = Date.now();
                    setRanks(newRanks);
                }
            } catch (err) {
                console.error("Failed to fetch ranks for badges:", err);
            }
        };

        fetchRanks();
    }, []);

    const getRank = (userId: string) => ranks[userId] || null;

    return { ranks, getRank };
}
