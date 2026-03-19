import { getAllProfiles } from "@/lib/profiles";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fast: reads from profiles table instead of auth.admin.listUsers()
        const profiles = await getAllProfiles();

        const students = profiles
            .filter(p => !p.is_teacher && p.username)
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, 10)
            .map((p, i) => ({
                id: p.id,
                rank: i + 1,
                name: p.full_name || 'Student',
                username: p.username || '',
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
