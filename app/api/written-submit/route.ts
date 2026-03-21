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
        const pointsToAward = sub.challenge_id ? Math.ceil(questionPoints / 2) : questionPoints;

        // Award points provisionally
        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;
        const newTotal = currentPoints + pointsToAward;
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
                points_awarded: pointsToAward,
                checker_deadline: null, // Legacy, no longer used
                updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId);

        if (sub.challenge_id) {
            // 🚀 FAST-TRACK AI FOR CO-OP CHALLENGES
            const { data: teacherSol } = await supabaseAdmin
                .from("teacher_solutions")
                .select("solution_url")
                .eq("question_id", sub.question_id)
                .maybeSingle();

            const questionText = (sub.questions as any)?.body || (sub.questions as any)?.title || "Solve this.";

            let aiResult: AIVerdict | null = null;
            try {
                aiResult = await Promise.race([
                    verifyWithGemini(sub.submission_url, questionText, teacherSol?.solution_url || null),
                    new Promise<AIVerdict | null>((_, reject) => setTimeout(() => reject(new Error("AI Verification Timeout")), 30000))
                ]);
            } catch (err) {
                console.error("Co-op Fast-Track AI Error:", err);
                aiResult = null;
            }

            if (!aiResult) {
                // Fallback: leave as pending_check if AI is overloaded
                await supabaseAdmin.from("written_submissions").update({ status: "pending_check" }).eq("id", submissionId);
                return NextResponse.json({ success: true, pointsAwarded: pointsToAward, newTotal, message: "AI overloaded, queued for check." });
            }

            // Save the AI breakdown to storage
            try {
                const breakdownBuf = Buffer.from(JSON.stringify({
                    verdict: aiResult.isCorrect ? "correct" : "wrong",
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

            if (aiResult.isCorrect) {
                // ✅ AI says it's correct!
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "auto_approved", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                await createNotification({
                    userId: userId,
                    type: 'ai_confirmed_correct',
                    title: '✅ AI confirmed your answer is correct!',
                    body: `Your written answer was verified by AI and marked correct. Points are secured!`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                await processCoopWin(sub);

                return NextResponse.json({
                    success: true,
                    pointsAwarded: pointsToAward,
                    newTotal,
                    message: "Fast-Track AI verified correct!",
                });
            } else {
                // ❌ AI says it's wrong!
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "ai_confirmed_wrong", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                // Revert the points + 20% penalty
                const standardPenalty = Math.floor(questionPoints / 5);
                const totalDeduction = pointsToAward + standardPenalty;
                const newStudentTotal = Math.max(0, currentPoints - totalDeduction);
                const updatedBattlesWon = Math.max(0, battlesWon - 1);

                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        ...userMeta,
                        totalPoints: newStudentTotal,
                        battlesWon: updatedBattlesWon,
                    },
                });
                leaderboardCache.invalidate();

                await createNotification({
                    userId: userId,
                    type: 'ai_confirmed_wrong',
                    title: '❌ AI reviewed your answer — it was wrong',
                    body: `During fast-track AI review, your answer was determined incorrect. Standard penalty applied.`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                await processCoopLoss(sub);

                return NextResponse.json({
                    success: true,
                    pointsAwarded: -standardPenalty,
                    newTotal: newStudentTotal,
                    message: "Fast-Track AI verified wrong.",
                });
            }
        } else {
            // STANDARD Flow (Community verification)
            // 🔔 Notify student they earned points
            await createNotification({
                userId: userId,
                type: 'points_earned',
                title: `+${pointsToAward} points earned!`,
                body: `Your answer was submitted for community verification. You've earned ${pointsToAward} points provisionally.`,
                href: `/submission/${submissionId}/ai-review`,
            });

            return NextResponse.json({
                success: true,
                pointsAwarded: pointsToAward,
                newTotal,
            });
        }
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
