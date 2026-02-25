import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").toLowerCase().trim();
        const exclude = searchParams.get("exclude") || "";

        if (q.length < 2) {
            return NextResponse.json({ users: [] });
        }

        // Fetch all users (paginated — up to 1000 for now)
        const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        });

        if (error) throw error;

        const matched = usersData.users
            .filter((u) => {
                if (u.id === exclude) return false;
                // Skip teachers
                if (u.user_metadata?.isTeacher) return false;

                const name = (u.user_metadata?.fullName || u.user_metadata?.name || "").toLowerCase();
                const username = (u.user_metadata?.username || "").toLowerCase();

                return name.includes(q) || username.includes(q);
            })
            .slice(0, 15) // max 15 results
            .map((u) => ({
                id: u.id,
                name: u.user_metadata?.fullName || u.user_metadata?.name || "Unknown",
                username: u.user_metadata?.username || "",
                avatar: u.user_metadata?.avatar_url || u.user_metadata?.avatar || null,
            }));

        return NextResponse.json({ users: matched });
    } catch (err: any) {
        console.error("[users/search] Error:", err);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
