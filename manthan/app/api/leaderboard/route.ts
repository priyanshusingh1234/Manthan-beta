import { getAllProfiles } from "@/lib/profiles";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const profiles = await getAllProfiles();

        // Show all non-teacher users, sorted by points. No username gating.
        const students = profiles
            .filter(p => !p.is_teacher)
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, 10)
            .map((p, i) => ({
                id: p.id,
                rank: i + 1,
                name: p.full_name || p.username || 'Student',
                username: p.username || p.id,
                school: p.school || 'Unknown School',
                avatar: p.avatar_url || null,
                points: p.total_points,
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
