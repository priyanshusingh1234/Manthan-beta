import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
    try {
        const testId = req.nextUrl.searchParams.get('testId');
        
        if (!testId) {
            return NextResponse.json({ error: 'testId is required' }, { status: 400 });
        }

        // 1. Fetch the best attempts for this gauntlet
        const { data: results, error: resultsErr } = await supabaseAdmin
            .from('test_results')
            .select('user_id, score, accuracy, time_taken, completed_at')
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .order('time_taken', { ascending: true });

        if (resultsErr) throw resultsErr;

        // Deduplicate to keep only the best attempt per user
        const seenUsers = new Set<string>();
        const bestAttempts = (results || []).filter((entry: any) => {
            if (seenUsers.has(entry.user_id)) return false;
            seenUsers.add(entry.user_id);
            return true;
        }).slice(0, 50);

        if (bestAttempts.length === 0) {
            return NextResponse.json({ leaderboard: [] });
        }

        // 2. Fetch profiles for these users
        const userIds = bestAttempts.map(a => a.user_id);
        const { data: profiles, error: profilesErr } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);
            
        if (profilesErr) throw profilesErr;
        
        const profileMap = new Map();
        (profiles || []).forEach(p => {
            profileMap.set(p.id, p);
        });

        // 3. Map into leaderboard format expected by the app
        const leaderboard = bestAttempts.map((entry: any, i: number) => {
            const profile = profileMap.get(entry.user_id) || {};
            return {
                rank: i + 1,
                userId: entry.user_id,
                name: profile.full_name || profile.username || 'Anonymous',
                username: profile.username || 'student',
                avatar: profile.avatar_url || null,
                score: entry.score || 0,
                accuracy: entry.accuracy || 0,
                timeTaken: entry.time_taken || 0,
                completedAt: entry.completed_at
            };
        });

        return NextResponse.json({ leaderboard });
    } catch (err: any) {
        console.error('[gauntlet-leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
