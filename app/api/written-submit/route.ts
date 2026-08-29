import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";
import { createNotification } from "@/lib/createNotification";
import { verifyWithGemini, AIVerdict } from "@/lib/aiVerification";
import { processCoopWin, processCoopLoss } from "@/lib/coopUtils";

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

        const challengeId = formData.get("challengeId") as string | null;

        // Check if student already submitted — use limit(1) to avoid issues with multiple rows
        const { data: existingRows } = await supabaseAdmin
            .from("written_submissions")
            .select("id, status")
            .eq("student_id", userId)
            .eq("question_id", questionId)
            .order("created_at", { ascending: false })
            .limit(1);

        const existing = existingRows?.[0] ?? null;

        if (challengeId) {
            // Verify challenge exists and user is part of it
            const { data: challenge } = await supabaseAdmin
                .from("coop_challenges")
                .select("id, initiator_id, partner_id")
                .eq("id", challengeId)
                .single();

            if (!challenge || (challenge.initiator_id !== userId && challenge.partner_id !== userId)) {
                return NextResponse.json({ error: "Invalid challenge" }, { status: 403 });
            }

            // Only allow re-upload over an explicitly wrong prior submission
            if (existing) {
                if (existing.status !== "ai_confirmed_wrong") {
                    return NextResponse.json({ error: "You have already submitted an answer for this question" }, { status: 403 });
                }
                // Delete the wrong submission so they can retry via co-op
                await supabaseAdmin.from("written_submissions").delete().eq("id", existing.id);
            }
        } else if (existing) {
            // No co-op context — always block re-submission
            return NextResponse.json({ error: "You have already submitted an answer for this question" }, { status: 403 });
        }

        // Upload file to Supabase storage
        if (typeof file === "string") {
            const snippet = file.substring(0, 100);
            console.error(`[Written-Submit] Expected file but got string. Length: ${file.length}, Start: ${snippet}`);
            return NextResponse.json({
                error: "Invalid upload format: received string instead of file",
                receivedSnippet: snippet,
                receivedLength: file.length
            }, { status: 400 });
        }

        const fileName = (file as any).name || "image.jpg";
        const fileExt = fileName.split(".").pop() || "jpg";
        const path = `written-answers/${questionId}/${userId}-${Date.now()}.${fileExt}`;

        // ROBUST: use new Response(file).arrayBuffer() which handles Blobs/Files in any environment that has fetch
        let arrayBuffer: ArrayBuffer;
        try {
            if (typeof (file as any).arrayBuffer === "function") {
                arrayBuffer = await (file as any).arrayBuffer();
            } else {
                arrayBuffer = await new Response(file).arrayBuffer();
            }
        } catch (e: any) {
            console.error("Failed to read file as arrayBuffer:", e.message);
            return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 });
        }

        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabaseAdmin.storage
            .from("written-answers")
            .upload(path, buffer, {
                contentType: (file as any).type || "image/jpeg",
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
                challenge_id: challengeId || null,
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

// PATCH: Student triggers Live AI Grading
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

        // Get the submission and user stats
        const { data: sub, error: subErr } = await supabaseAdmin
            .from("written_submissions")
            .select("*, questions(points, body, title)")
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
        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;
        const battlesAttempted = (Number(userMeta.battlesAttempted) || 0) + 1;
        let battlesWon = Number(userMeta.battlesWon) || 0;

        // Fetch teacher solution
        const { data: teacherSol } = await supabaseAdmin
            .from("teacher_solutions")
            .select("solution_url")
            .eq("question_id", sub.question_id)
            .maybeSingle();

        const questionText = (sub.questions as any)?.body || (sub.questions as any)?.title || "Solve this.";

        let aiResult: AIVerdict | null = null;
        try {
            // Strict 9.0s timeout to prevent Vercel 504 Gateway Timeout on Hobby Plan (10s max)
            aiResult = await Promise.race([
                verifyWithGemini(sub.submission_url, questionText, teacherSol?.solution_url || null, userMeta),
                new Promise<AIVerdict | null>((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 9000))
            ]);
        } catch (err: any) {
            console.error("Live AI Error:", err);
            if (err.message === "AI_TIMEOUT") {
                return NextResponse.json({ error: "AI took too long to respond. Please try grading again." }, { status: 408 });
            }
            return NextResponse.json({ error: "AI grading failed: " + err.message }, { status: 500 });
        }

        if (!aiResult) {
            return NextResponse.json({ error: "AI returned no result." }, { status: 500 });
        }

        // Save the AI breakdown to storage
        try {
            const breakdownBuf = Buffer.from(JSON.stringify({
                verdict: aiResult.isCorrect ? "correct" : aiResult.isPartiallyCorrect ? "partially_correct" : "wrong",
                breakdown: aiResult.breakdown,
                raw: aiResult.raw,
                timestamp: new Date().toISOString()
            }), "utf8");
            await supabaseAdmin.storage
                .from("written-answers")
                .upload(`ai-reviews/${submissionId}.json`, breakdownBuf, {
                    contentType: "application/json",
                    upsert: true
                });
        } catch (uploadErr) {
            console.error("Failed to upload AI breakdown to tracking bucket:", uploadErr);
        }

        let finalStatus = "ai_confirmed_wrong";
        let pointsAwarded = 0;
        let penalty = 0;
        let isWin = false;

        if (aiResult.isCorrect) {
            finalStatus = "ai_confirmed_correct";
            pointsAwarded = sub.challenge_id ? Math.ceil(questionPoints / 2) : questionPoints;
            isWin = true;
        } else if (aiResult.isPartiallyCorrect) {
            finalStatus = "ai_confirmed_partial";
            pointsAwarded = sub.challenge_id ? Math.ceil(questionPoints / 4) : Math.ceil(questionPoints / 2);
            isWin = true; // partial counts as a win for streak/battles
        } else {
            // Wrong
            finalStatus = "ai_confirmed_wrong";
            pointsAwarded = 0;
            penalty = Math.floor(questionPoints / 5);
        }

        if (isWin) battlesWon += 1;

        const newTotal = Math.max(0, currentPoints + pointsAwarded - penalty);

        // Update User
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...userMeta,
                totalPoints: newTotal,
                battlesAttempted,
                battlesWon,
            },
        });

        const { upsertProfile } = await import("@/lib/profiles");
        await upsertProfile(userId, { ...userMeta, totalPoints: newTotal, battlesAttempted, battlesWon });
        leaderboardCache.invalidate();

        // Update Submission
        await supabaseAdmin
            .from("written_submissions")
            .update({
                self_marked_correct: true, // legacy flag for compatibility
                status: finalStatus,
                points_awarded: pointsAwarded > 0 ? pointsAwarded : -penalty,
                checker_deadline: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId);

        // Notifications & Coop
        if (isWin) {
            await createNotification({
                userId: userId,
                type: 'ai_confirmed_correct',
                title: aiResult.isCorrect ? '✅ AI Graded: Full Points!' : '⚠️ AI Graded: Partial Points',
                body: `You've earned ${pointsAwarded} points for your written answer.`,
                href: `/submission/${submissionId}/ai-review`,
                actorAvatar: sub.submission_url || undefined,
            });
            if (sub.challenge_id) await processCoopWin(sub);
        } else {
            await createNotification({
                userId: userId,
                type: 'ai_confirmed_wrong',
                title: '❌ AI Graded: Incorrect',
                body: `Your answer was incorrect. Standard penalty of ${penalty} applied.`,
                href: `/submission/${submissionId}/ai-review`,
                actorAvatar: sub.submission_url || undefined,
            });
            if (sub.challenge_id) await processCoopLoss(sub);
        }

        return NextResponse.json({
            success: true,
            status: finalStatus,
            pointsAwarded: pointsAwarded > 0 ? pointsAwarded : -penalty,
            newTotal,
            breakdown: aiResult.breakdown,
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
