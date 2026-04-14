import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { LeaderboardUser } from "@/lib/leaderboardCache";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // No in-memory cache: every request queries Supabase directly so that
        // avatar changes, point awards, and profile updates are reflected
        // immediately across all serverless instances without waiting for a TTL
        // or relying on a single instance's invalidate() call.
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, school, avatar_url, total_points, is_teacher, cosmetics')
            .eq('is_teacher', false)
            .not('username', 'is', null)
            .neq('username', '')
            .order('total_points', { ascending: false })
            .order('id', { ascending: true })
            .limit(10);

        if (error) throw new Error(error.message);

        const students: LeaderboardUser[] = (data || []).map((p: any, i: number) => ({
            id: p.id,
            rank: i + 1,
            name: p.full_name || p.username || 'Student',
            username: p.username,
            school: p.school || 'Unknown School',
            avatar: p.avatar_url || null,
            points: Number(p.total_points) || 0,
            streak: 0,
            schoolColor: 'bg-blue-500',
            cosmetics: p.cosmetics || [],
        }));

        const response = { topBrains: students };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        });
    } catch (err: any) {
        console.error('[leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
