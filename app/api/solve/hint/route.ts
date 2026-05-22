import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { upsertProfile } from "@/lib/profiles";
import { leaderboardCache } from "@/lib/leaderboardCache";

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        
        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { questionId } = await req.json();

        if (!questionId) {
            return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
        }

        // Fetch user data to check points
        const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (uErr || !userResp?.user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userMeta = userResp.user.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;

        if (currentPoints < 1) {
            return NextResponse.json({ error: "Not enough points to purchase a hint." }, { status: 400 });
        }

        // Fetch question hint
        const { data: q, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("hint")
            .eq("id", questionId)
            .single();

        if (qErr || !q) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (!q.hint) {
            return NextResponse.json({ error: "No hint available for this question." }, { status: 404 });
        }

        // Deduct 1 point
        const newTotal = currentPoints - 1;
        const updatedMeta = {
            ...userMeta,
            totalPoints: newTotal,
        };

        // Update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: updatedMeta });
        
        // Update profile
        await upsertProfile(user.id, updatedMeta);
        leaderboardCache.invalidate();

        return NextResponse.json({ success: true, hint: q.hint, newTotal });
    } catch (err: any) {
        console.error("Hint purchase error:", err);
        return NextResponse.json({ error: err.message || "Failed to purchase hint" }, { status: 500 });
    }
}
