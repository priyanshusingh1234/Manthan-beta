import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
    try {
        const testId = req.nextUrl.searchParams.get('testId');
        
        let query = supabaseAdmin
            .from('test_submissions')
            .select('user_id, total_score, created_at, profiles!user_id(full_name, username, avatar_url, school)')
            .eq('status', 'completed')
            .order('total_score', { ascending: false });

        if (testId) {
            query = query.eq('test_id', testId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[tests-leaderboard] query error:', error);
            throw error;
        }

        // Dedupe - keep only the best attempt per user if they submitted multiple times somehow
        const seenUsers = new Set<string>();
        const bestAttempts = (data || []).filter((entry: any) => {
            if (seenUsers.has(entry.user_id)) return false;
            seenUsers.add(entry.user_id);
            return true;
        }).slice(0, 100);

        // Map into a standard leaderboard format
        const leaderboard = bestAttempts.map((entry: any, i: number) => {
            const profile = entry.profiles || {};
            return {
                rank: i + 1,
                userId: entry.user_id,
                name: profile.full_name || profile.username || 'Student',
                username: profile.username || 'student',
                avatar: profile.avatar_url || null,
                school: profile.school || 'Unknown',
                score: entry.total_score || 0,
                completedAt: entry.created_at
            };
        });

        return NextResponse.json({ leaderboard });
    } catch (err: any) {
        console.error('[tests-leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
