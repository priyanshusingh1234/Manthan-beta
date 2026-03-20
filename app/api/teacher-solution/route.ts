import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

// POST: Teacher uploads model answer for a question
export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const teacherId = await getVerifiedUserId(auth);
        if (!teacherId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: teacherData } = await supabaseAdmin.auth.admin.getUserById(teacherId);
        if (!teacherData?.user?.user_metadata?.isTeacher) {
            return NextResponse.json({ error: "Teachers only" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const questionId = formData.get("questionId") as string | null;

        if (!file || !questionId) {
            return NextResponse.json({ error: "Missing file or questionId" }, { status: 400 });
        }

        // Verify teacher owns this question
        const { data: q } = await supabaseAdmin
            .from("questions")
            .select("id, created_by, points")
            .eq("id", questionId)
            .single();

        if (!q || q.created_by !== teacherId) {
            return NextResponse.json({ error: "You can only upload solutions for your own questions" }, { status: 403 });
        }

        if ((q.points || 0) <= 15) {
            return NextResponse.json({ error: "Model answers only required for questions > 15 points" }, { status: 400 });
        }

        // Upload to storage
        const fileExt = file.name.split(".").pop() || "jpg";
        const path = `teacher-solutions/${questionId}/${teacherId}-${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabaseAdmin.storage
            .from("written-answers")
            .upload(path, buffer, {
                contentType: file.type || "image/jpeg",
                upsert: true,
            });

        if (uploadErr) {
            return NextResponse.json({ error: "Upload failed: " + uploadErr.message }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from("written-answers")
            .getPublicUrl(path);

        // Upsert teacher solution record
        const { error: upsertErr } = await supabaseAdmin
            .from("teacher_solutions")
            .upsert({
                question_id: questionId,
                teacher_id: teacherId,
                solution_path: path,
                solution_url: urlData?.publicUrl || null,
            }, { onConflict: "question_id" });

        if (upsertErr) {
            return NextResponse.json({ error: "Failed to save solution record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            solutionUrl: urlData?.publicUrl || null,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// GET: Fetch teacher's solution for a question (only after student uploads their answer)
export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const questionId = searchParams.get("questionId");

        if (!questionId) {
            return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
        }

        // Check if user has a submission for this question (student must submit before seeing teacher answer)
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const isTeacher = userData?.user?.user_metadata?.isTeacher;

        if (!isTeacher) {
            const { data: sub } = await supabaseAdmin
                .from("written_submissions")
                .select("id")
                .eq("student_id", userId)
                .eq("question_id", questionId)
                .maybeSingle();

            if (!sub) {
                return NextResponse.json({ error: "You must upload your answer before viewing the model answer" }, { status: 403 });
            }
        }

        const { data: solution } = await supabaseAdmin
            .from("teacher_solutions")
            .select("solution_url, solution_path, created_at")
            .eq("question_id", questionId)
            .maybeSingle();

        if (!solution) {
            return NextResponse.json({ hasModelAnswer: false });
        }

        return NextResponse.json({
            hasModelAnswer: true,
            solutionUrl: solution.solution_url,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
