import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";

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

// POST: Upload student's written answer
export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const questionId = formData.get("questionId") as string | null;

        if (!file || !questionId) {
            return NextResponse.json({ error: "Missing file or questionId" }, { status: 400 });
        }

        // Validate question exists and is > 15 points
        const { data: q, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("id, points, title")
            .eq("id", questionId)
            .single();

        if (qErr || !q) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if ((q.points || 0) <= 15) {
            return NextResponse.json({ error: "Written submissions only for questions > 15 points" }, { status: 400 });
        }

        // Check if student already submitted
        const { data: existing } = await supabaseAdmin
            .from("written_submissions")
            .select("id, status")
            .eq("student_id", userId)
            .eq("question_id", questionId)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "You have already submitted an answer for this question" }, { status: 403 });
        }

        // Upload file to Supabase storage
        const fileExt = file.name.split(".").pop() || "jpg";
        const path = `written-answers/${questionId}/${userId}-${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabaseAdmin.storage
            .from("written-answers")
            .upload(path, buffer, {
                contentType: file.type || "image/jpeg",
                upsert: false,
            });

        if (uploadErr) {
            console.error("Storage upload error:", uploadErr);
            return NextResponse.json({ error: "Failed to upload file: " + uploadErr.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from("written-answers")
            .getPublicUrl(path);

        // Save submission record (status = 'pending' until student self-marks)
        const { data: submission, error: insertErr } = await supabaseAdmin
            .from("written_submissions")
            .insert({
                question_id: questionId,
                student_id: userId,
                submission_path: path,
                submission_url: urlData?.publicUrl || null,
                status: "pending",
                self_marked_correct: false,
                points_awarded: 0,
            })
            .select()
            .single();

        if (insertErr) {
            return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            submissionUrl: urlData?.publicUrl || null,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// PATCH: Student self-marks their answer as correct
export async function PATCH(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { submissionId } = await req.json();
        if (!submissionId) {
            return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
        }

        // Get the submission
        const { data: sub, error: subErr } = await supabaseAdmin
            .from("written_submissions")
            .select("*, questions(points)")
            .eq("id", submissionId)
            .eq("student_id", userId)
            .single();

        if (subErr || !sub) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        if (sub.status !== "pending") {
            return NextResponse.json({ error: "This submission has already been processed" }, { status: 400 });
        }

        const questionPoints = (sub.questions as any)?.points || 0;

        // Award points provisionally
        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;
        const newTotal = currentPoints + questionPoints;
        const battlesAttempted = (Number(userMeta.battlesAttempted) || 0) + 1;
        const battlesWon = (Number(userMeta.battlesWon) || 0) + 1;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...userMeta,
                totalPoints: newTotal,
                battlesAttempted,
                battlesWon,
            },
        });
        leaderboardCache.invalidate(); // reflect new points in TopBrains immediately

        // Update submission status to pending_check
        await supabaseAdmin
            .from("written_submissions")
            .update({
                self_marked_correct: true,
                status: "pending_check",
                points_awarded: questionPoints,
                checker_deadline: null, // Legacy, no longer used
                updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId);

        return NextResponse.json({
            success: true,
            pointsAwarded: questionPoints,
            newTotal,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// DELETE: Delete a pending submission (student realized it's wrong before claiming)
export async function DELETE(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const url = new URL(req.url);
        const submissionId = url.searchParams.get("submissionId");

        if (!submissionId) {
            return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
        }

        const { data: sub, error: subErr } = await supabaseAdmin
            .from("written_submissions")
            .select("id, status, submission_path")
            .eq("id", submissionId)
            .eq("student_id", userId)
            .single();

        if (subErr || !sub) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        if (sub.status !== "pending") {
            return NextResponse.json({ error: "Can only delete pending submissions" }, { status: 400 });
        }

        // Delete from storage
        if (sub.submission_path) {
            await supabaseAdmin.storage
                .from("written-answers")
                .remove([sub.submission_path]);
        }

        // Delete from DB
        await supabaseAdmin
            .from("written_submissions")
            .delete()
            .eq("id", submissionId);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
