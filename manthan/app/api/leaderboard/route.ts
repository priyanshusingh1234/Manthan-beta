import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Use the Auth Admin API directly — bypasses the student_leaderboard VIEW
        // and Supabase PostgREST caching. This reads auth.users in real-time.
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
        });

        if (error) throw new Error(error.message);

        // Filter to students only (non-teachers), sort by totalPoints desc
        const students = (data.users || [])
            .filter((u) => !u.user_metadata?.isTeacher)
            .map((u) => ({
                id: u.id,
                name: (u.user_metadata?.fullName as string) || u.email?.split('@')[0] || 'Student',
                username: (u.user_metadata?.username as string) || '',
                school: (u.user_metadata?.school as string) || 'Unknown School',
                avatar: (u.user_metadata?.avatar_url as string) || null,
                points: Number(u.user_metadata?.totalPoints) || 0,
                streak: 0,
                schoolColor: 'bg-blue-500',
            }))
            .filter((u) => u.username) // must have a username to appear
            .sort((a, b) => b.points - a.points)
            .slice(0, 10)
            .map((u, i) => ({ ...u, rank: i + 1 }));

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
