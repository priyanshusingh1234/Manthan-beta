import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch { return null; }
}

// GET /api/debug-written — shows all written submissions and checker votes in DB
// Only accessible to teachers
export async function GET(req: Request) {
    const auth = req.headers.get("authorization");
    const userId = await getVerifiedUserId(auth);
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userData?.user?.user_metadata?.isTeacher) {
        return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    const { data: submissions } = await supabaseAdmin
        .from("written_submissions")
        .select("id, question_id, student_id, status, self_marked_correct, points_awarded, checker_deadline, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: votes } = await supabaseAdmin
        .from("checker_votes")
        .select("id, submission_id, checker_id, vote, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    const { data: solutions } = await supabaseAdmin
        .from("teacher_solutions")
        .select("id, question_id, teacher_id, solution_url, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

    const now = new Date().toISOString();

    return NextResponse.json({
        serverTime: now,
        submissionsCount: submissions?.length ?? 0,
        submissions: submissions ?? [],
        votesCount: votes?.length ?? 0,
        votes: votes ?? [],
        solutionsCount: solutions?.length ?? 0,
        solutions: solutions ?? [],
    });
}
