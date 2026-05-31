'use client';

import { useState, useEffect, useCallback } from 'react';

export function clearRankCache() {
    // No-op: kept for backward compatibility. Cache has been removed.
}

export function useTopRanks() {
    const [ranks, setRanks] = useState<Record<string, number>>({});

    const fetchRanks = useCallback(async () => {
        try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, total_points')
                .eq('is_teacher', false)
                .not('username', 'is', null)
                .neq('username', '')
                .order('total_points', { ascending: false })
                .order('id', { ascending: true })
                .limit(20);

            if (!error && data) {
                const newRanks: Record<string, number> = {};
                data.forEach((u, i) => {
                    newRanks[u.id] = i + 1;
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
