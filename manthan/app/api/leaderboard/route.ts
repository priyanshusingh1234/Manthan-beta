import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function fetchFreshLeaderboard() {
    // Query the student_leaderboard VIEW directly via SQL — this reads from auth.users
    // in real-time (no Supabase REST API caching lag like auth.admin.listUsers() has)
    const { data, error } = await supabaseAdmin
        .from("student_leaderboard")
        .select("id, name, username, school, avatar, points")
        .order("points", { ascending: false })
        .limit(10);

    if (error) throw new Error(error.message);

    const topBrains = (data || []).map((u: any, i: number) => ({
        id: u.id,
        name: u.name || "Student",
        username: u.username,
        school: u.school || "Unknown School",
        avatar: u.avatar || null,
        points: Number(u.points) || 0,
        rank: i + 1,
        streak: 0,
        schoolColor: "bg-blue-500",
    }));

    return { topBrains };
}

export async function GET(req: Request) {
    try {
        const forceRefresh = new URL(req.url).searchParams.get("refresh") === "1";

        if (!forceRefresh && leaderboardCache.isValid()) {
            return NextResponse.json(leaderboardCache.data!, {
                status: 200,
                headers: { "X-Cache": "HIT", "Cache-Control": "no-store" },
            });
        }

        const fresh = await fetchFreshLeaderboard();
        leaderboardCache.set(fresh, 20_000);

        return NextResponse.json(fresh, {
            status: 200,
            headers: { "X-Cache": "MISS", "Cache-Control": "no-store" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
