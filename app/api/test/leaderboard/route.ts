import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const testId = req.nextUrl.searchParams.get('testId');
        if (!testId) return NextResponse.json({ error: 'Missing testId' }, { status: 400 });

        // Fetch top 10 unique users for this test, highest score first, then fastest time
        // Note: For a robust leaderboard, we ideally want 'max(score)' per user.
        // We'll use a Supabase query that gets the highest scoring record for each user.
        const { data, error } = await supabaseAdmin
            .from('test_results')
            .select(`
                score,
                max_score,
                time_taken,
                accuracy,
                completed_at,
                profiles (
                   id,
                   full_name,
                   username,
                   avatar_url,
                   school
                )
            `)
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .order('time_taken', { ascending: true })
            .limit(20);

        if (error) throw error;

        // Since many users might have multiple submissions, we'll filter to show only their best attempt in the top 20
        const seenUsers = new Set();
        const leaderboard = (data || [])
            .filter((entry: any) => {
                if (!entry.profiles || seenUsers.has(entry.profiles.id)) return false;
                seenUsers.add(entry.profiles.id);
                return true;
            })
            .map((entry: any, i: number) => ({
                rank: i + 1,
                userId: entry.profiles.id,
                name: entry.profiles.full_name || entry.profiles.username || 'Scholar',
                username: entry.profiles.username,
                avatar: entry.profiles.avatar_url,
                school: entry.profiles.school,
                score: entry.score,
                maxScore: entry.max_score,
                timeTaken: entry.time_taken,
                accuracy: entry.accuracy,
                completedAt: entry.completed_at
            }))
            .slice(0, 10);

        return NextResponse.json({ leaderboard });
    } catch (err: any) {
        console.error('[test-leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
