import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, school, avatar_url, total_points, is_teacher')
            .eq('is_teacher', false)
            .not('username', 'is', null)
            .neq('username', '')
            .order('total_points', { ascending: false })
            .limit(10);

        if (error) {
            throw new Error(error.message);
        }

        const students = (data || []).map((p: any, i: number) => ({
            id: p.id,
            rank: i + 1,
            name: p.full_name || p.username || 'Student',
            username: p.username,
            school: p.school || 'Unknown School',
            avatar: p.avatar_url || null,
            points: Number(p.total_points) || 0,
            streak: 0,
            schoolColor: 'bg-blue-500',
        }));

        return NextResponse.json({ topBrains: students }, {
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
