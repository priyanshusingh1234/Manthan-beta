import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { leaderboardCache } from "@/lib/leaderboardCache";
import { createNotification } from "@/lib/createNotification";

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

const CHECKER_REWARD_POINTS = 2;
const CHECKER_CORRECT_REWARD_POINTS = 1;
const SPAMMER_PENALTY = 1;
const STUDENT_EXTRA_PENALTY = 3;

// Initialize Gemini safely
const GEMINI_KEY = process.env.GOOGLE_GENAI_API_KEY || "";
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

type AIVerdict = { isCorrect: boolean; breakdown: string; raw: string };

async function verifyWithGemini(userImageUrl: string, questionText: string, modelAnswerUrl: string | null): Promise<AIVerdict | null> {
    try {
        // In a real production scenario with image URLs, you would first fetch the image arrayBuffers
        // and send them via inlineData, or download and convert to base64.
        // For this V1 iteration, we will just send the public URLs and hope the model can access them,
        // or we can instruct the AI to do its best. Gemini 1.5 Pro natively supports URL fetches if enabled, 
        // but typically it needs Base64.

        // Since we are uploading to Supabase, we can fetch the image buffer to send to Gemini:
        let studentImagePart: any = undefined;
        try {
            const resp = await fetch(userImageUrl, { signal: AbortSignal.timeout(20000) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuffer = await resp.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = resp.headers.get('content-type') || 'image/jpeg';
            studentImagePart = { inlineData: { data: base64, mimeType } };
        } catch (e) {
            console.error("Failed to fetch student image for AI", e);
            return null; // Fatal error, AI cannot proceed
        }

        let teacherImagePart: any = undefined;
        if (modelAnswerUrl) {
            try {
                const resp = await fetch(modelAnswerUrl, { signal: AbortSignal.timeout(20000) });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuffer = await resp.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = resp.headers.get('content-type') || 'image/jpeg';
                teacherImagePart = { inlineData: { data: base64, mimeType } };
            } catch (e) {
                console.error("Failed to fetch teacher image for AI", e);
            }
        }

        const prompt = `You are a teacher grading a student's answer. 
Question Text: ${questionText}
${teacherImagePart ? "Teacher's Model Answer is provided as an image reference. " : ""}
Student's Answer is provided as an image.

Task:
Determine if the student's actual final answer is correct. They do not need to perfectly show every step exactly as the teacher if their main conclusion and technique are right. 
IMPORTANT LIMITATION: Do not blindly fail a student for using alternative math formulas or different problem-solving techniques. Check their work intelligently to see if it is mathematically and logically sound on its own merit.

Respond ONLY with a valid JSON object matching this schema (no markdown formatting):
{
  "verdict": "correct" or "wrong",
  "breakdown": "A clear, encouraging 3-4 sentence explanation addressing the student directly. Explain exactly where their math/logic fails, or why it was graded correctly despite using a different format."
}`;

        const contents = [];
        contents.push(prompt);
        if (teacherImagePart) contents.push(teacherImagePart);
        if (studentImagePart) contents.push(studentImagePart);

        if (!ai) {
            console.error("Gemini AI not initialized (missing API key)");
            return null;
        }

        // @ts-ignore
        const response = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
            // @ts-ignore
            contents: [{ role: 'user', parts: contents }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        let text = response.text || "{}";
        // Strip markdown backticks if Gemini accidentally includes them despite mimeType
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const json = JSON.parse(text);

        return {
            isCorrect: json.verdict?.toLowerCase() === "correct",
            breakdown: json.breakdown || "No detailed breakdown was provided.",
            raw: text
        };
    } catch (err) {
        console.error("Gemini Verification Error:", err);
        return null; // Fatal error
    }
}

async function processCoopWin(submission: any) {
    if (!submission.challenge_id) return;

    try {
        const { data: challenge } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, initiator_id, partner_id, status")
            .eq("id", submission.challenge_id)
            .single();

        if (!challenge || challenge.status === 'won') return;

        // Mark challenge as won
        await supabaseAdmin.from("coop_challenges").update({ status: 'won', updated_at: new Date().toISOString() }).eq("id", challenge.id);

        const questionPoints = Number((submission.questions as any)?.points || 0);
        const splitPoints = Math.ceil(questionPoints / 2);

        // Identify the other player
        const otherUserId = challenge.initiator_id === submission.student_id ? challenge.partner_id : challenge.initiator_id;

        // Reward the other player (the submitter already got their half provisionally)
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(otherUserId);
        const userMeta = userData?.user?.user_metadata || {};
        await supabaseAdmin.auth.admin.updateUserById(otherUserId, {
            user_metadata: { ...userMeta, totalPoints: (Number(userMeta.totalPoints) || 0) + splitPoints }
        });

        // Notify the other player
        await createNotification({
            userId: otherUserId,
            type: 'coop_challenge',
            title: `Team Victory! 🎉`,
            body: `Your co-op partner got the written answer right! You both earned +${splitPoints} points.`,
            href: `/questions/${submission.question_id}`,
        });

        // Delete the other player's pending submission if it exists, so it disappears from the checker feed
        await supabaseAdmin
            .from("written_submissions")
            .delete()
            .eq("challenge_id", challenge.id)
            .eq("student_id", otherUserId);

    } catch (err) {
        console.error("Failed to process coop win:", err);
    }
}

async function processCoopLoss(submission: any) {
    if (!submission.challenge_id) return;

    try {
        const { data: challenge } = await supabaseAdmin
            .from("coop_challenges")
            .select("id, initiator_id, partner_id, status, partner_attempted")
            .eq("id", submission.challenge_id)
            .single();

        if (!challenge || challenge.status === 'lost' || challenge.status === 'won') return;

        const isPartner = challenge.partner_id === submission.student_id;
        const isInitiator = challenge.initiator_id === submission.student_id;
        const questionPoints = Number((submission.questions as any)?.points || 0);
        const calculatedPenalty = Math.floor(questionPoints / 5);

        if (isPartner) {
            // Partner failed to save. Challenge is permanently lost.
            await supabaseAdmin
                .from("coop_challenges")
                .update({ partner_attempted: true, status: 'lost', updated_at: new Date().toISOString() })
                .eq("id", challenge.id);

            const { data: partnerUser } = await supabaseAdmin.auth.admin.getUserById(submission.student_id);
            const partnerName = partnerUser?.user?.user_metadata?.fullName || partnerUser?.user?.user_metadata?.username || "Your friend";

            await createNotification({
                userId: challenge.initiator_id,
                type: 'coop_challenge',
                title: `${partnerName} couldn't save you!`,
                body: `They failed the checker review. Your co-op challenge is officially lost.`,
                href: `/questions/${submission.question_id}`,
            });
        }
    } catch (err) {
        console.error("Failed to process coop loss:", err);
    }
}

// POST: Submit a checker vote
export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const checkerId = await getVerifiedUserId(auth);
        if (!checkerId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Checkers cannot be teachers
        const { data: checkerData } = await supabaseAdmin.auth.admin.getUserById(checkerId);
        if (checkerData?.user?.user_metadata?.isTeacher) {
            return NextResponse.json({ error: "Teachers cannot act as checkers" }, { status: 403 });
        }

        const { submissionId, vote } = await req.json();
        if (!submissionId || !["correct", "wrong"].includes(vote)) {
            return NextResponse.json({ error: "Invalid vote or missing submissionId" }, { status: 400 });
        }

        // Fetch submission
        const { data: sub, error: subErr } = await supabaseAdmin
            .from("written_submissions")
            .select("*, questions(points)")
            .eq("id", submissionId)
            .single();

        if (subErr || !sub) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Cannot vote on your own submission
        if (sub.student_id === checkerId) {
            return NextResponse.json({ error: "You cannot check your own submission" }, { status: 403 });
        }

        const currentStatus = sub.status;

        // Only allow voting on pending_check
        if (currentStatus !== "pending_check") {
            return NextResponse.json({ error: "This submission has already been fully checked" }, { status: 400 });
        }

        // Check for duplicate vote
        const { data: existingVote } = await supabaseAdmin
            .from("checker_votes")
            .select("id")
            .eq("submission_id", submissionId)
            .eq("checker_id", checkerId)
            .maybeSingle();

        if (existingVote) {
            return NextResponse.json({ error: "You have already voted on this submission" }, { status: 403 });
        }

        // Record the vote
        await supabaseAdmin.from("checker_votes").insert({
            submission_id: submissionId,
            checker_id: checkerId,
            vote,
        });

        // Count votes
        const { data: allVotes } = await supabaseAdmin
            .from("checker_votes")
            .select("checker_id, vote")
            .eq("submission_id", submissionId);

        const votes = allVotes || [];
        const correctVotes = votes.filter(v => v.vote === "correct");
        const wrongVotes = votes.filter(v => v.vote === "wrong");

        let newStatus = currentStatus;
        let message = "Vote recorded";

        // TRIGGER A: 2 Correct Votes → Run AI to confirm (prevent spam-correct collusion)
        if (correctVotes.length >= 2) {
            newStatus = "flagged_for_ai";
            await supabaseAdmin
                .from("written_submissions")
                .update({ status: "flagged_for_ai", updated_at: new Date().toISOString() })
                .eq("id", submissionId);

            // Fetch teacher solution if available
            const { data: teacherSol } = await supabaseAdmin
                .from("teacher_solutions")
                .select("solution_url")
                .eq("question_id", sub.question_id)
                .maybeSingle();

            const questionText = (sub.questions as any)?.body || (sub.questions as any)?.title || "Solve this.";

            // Run AI Verification
            let aiResult: AIVerdict | null = null;
            try {
                aiResult = await Promise.race([
                    verifyWithGemini(sub.submission_url, questionText, teacherSol?.solution_url || null),
                    new Promise<AIVerdict | null>((_, reject) =>
                        setTimeout(() => reject(new Error("AI Verification Timeout")), 45000)
                    )
                ]);
            } catch {
                aiResult = null;
            }

            // AI failed — rollback, keep pending
            if (aiResult === null) {
                await supabaseAdmin.from("checker_votes").delete().eq("checker_id", checkerId).eq("submission_id", submissionId);
                await supabaseAdmin.from("written_submissions").update({ status: "pending_check" }).eq("id", submissionId);
                return NextResponse.json({ error: "AI Verification service is currently overloaded. Please try again in a moment." }, { status: 503 });
            }

            // Save AI breakdown
            try {
                const breakdownBuf = Buffer.from(JSON.stringify({
                    verdict: aiResult.isCorrect ? "correct" : "wrong",
                    breakdown: aiResult.breakdown,
                    raw: aiResult.raw,
                    timestamp: new Date().toISOString()
                }), "utf8");
                await supabaseAdmin.storage
                    .from("written-answers")
                    .upload(`ai-reviews/${submissionId}.json`, breakdownBuf, { contentType: "application/json", upsert: true });
            } catch { /* non-fatal */ }

            if (aiResult.isCorrect) {
                // ✅ AI confirms correct → auto-approve, reward checkers
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "auto_approved", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                newStatus = "auto_approved";
                message = "AI confirmed correct. Community + AI verified.";

                // Reward correct-voters +1 pt each
                for (const cv of correctVotes) {
                    const { data: voterData } = await supabaseAdmin.auth.admin.getUserById(cv.checker_id);
                    const voterMeta = voterData?.user?.user_metadata || {};
                    await supabaseAdmin.auth.admin.updateUserById(cv.checker_id, {
                        user_metadata: { ...voterMeta, totalPoints: (Number(voterMeta.totalPoints) || 0) + CHECKER_CORRECT_REWARD_POINTS },
                    });
                }
                leaderboardCache.invalidate();

                await createNotification({
                    userId: sub.student_id,
                    type: 'answer_approved',
                    title: '✅ AI + Community verified your answer is correct!',
                    body: `${correctVotes.length} checkers and AI both confirmed your submission. Points are locked in!`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                if (sub.challenge_id) await processCoopWin(sub);

            } else {
                // ❌ AI says wrong — spam correct voters caught, penalize them
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "ai_confirmed_wrong", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                newStatus = "ai_confirmed_wrong";
                message = "AI found answer is wrong despite correct votes. Spam-voters penalized.";

                // 1. Penalize spam-correct voters — same as CHECKER_REWARD_POINTS deduction
                for (const cv of correctVotes) {
                    const { data: voterData } = await supabaseAdmin.auth.admin.getUserById(cv.checker_id);
                    const voterMeta = voterData?.user?.user_metadata || {};
                    const penalized = Math.max(0, (Number(voterMeta.totalPoints) || 0) - CHECKER_REWARD_POINTS);
                    await supabaseAdmin.auth.admin.updateUserById(cv.checker_id, {
                        user_metadata: { ...voterMeta, totalPoints: penalized },
                    });
                }

                // 2. Reverse student's provisional points + standard penalty
                const { data: studentData } = await supabaseAdmin.auth.admin.getUserById(sub.student_id);
                const studentMeta = studentData?.user?.user_metadata || {};
                const currentPoints = Number(studentMeta.totalPoints) || 0;
                const questionPoints = Number((sub.questions as any)?.points || 0);
                let totalDeduction = Number(sub.points_awarded || 0);
                if (currentPoints > 0) {
                    totalDeduction += Math.floor(questionPoints / 5) + STUDENT_EXTRA_PENALTY;
                }
                const newStudentTotal = Math.max(0, currentPoints - totalDeduction);
                const battlesWon = Math.max(0, (Number(studentMeta.battlesWon) || 0) - 1);
                await supabaseAdmin.auth.admin.updateUserById(sub.student_id, {
                    user_metadata: { ...studentMeta, totalPoints: newStudentTotal, battlesWon },
                });
                leaderboardCache.invalidate();

                await createNotification({
                    userId: sub.student_id,
                    type: 'ai_confirmed_wrong',
                    title: '❌ AI reviewed your answer — it was wrong',
                    body: `Even though some checkers marked it correct, AI determined your answer was incorrect. Points have been adjusted.`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                if (sub.challenge_id) await processCoopLoss(sub);
            }
        }

        // TRIGGER B: 2 Wrong Votes -> Trigger AI Verification
        else if (wrongVotes.length >= 2) {
            newStatus = "flagged_for_ai";
            await supabaseAdmin
                .from("written_submissions")
                .update({ status: "flagged_for_ai", updated_at: new Date().toISOString() })
                .eq("id", submissionId);

            // 🔔 Notify student their answer was flagged
            await createNotification({
                userId: sub.student_id,
                type: 'answer_flagged',
                title: '⚠️ Your answer was flagged',
                body: `Multiple checkers flagged your submission. AI verification is underway to determine the outcome.`,
                href: `/submission/${submissionId}/ai-review`,
            });

            // Fetch teacher solution if available
            const { data: teacherSol } = await supabaseAdmin
                .from("teacher_solutions")
                .select("solution_url")
                .eq("question_id", sub.question_id)
                .maybeSingle();

            const questionText = (sub.questions as any)?.body || (sub.questions as any)?.title || "Solve this.";

            // Run AI Verification with a generous 45-second timeout
            let aiResult: AIVerdict | null = null;
            try {
                const startTime = Date.now();
                aiResult = await Promise.race([
                    verifyWithGemini(sub.submission_url, questionText, teacherSol?.solution_url || null),
                    new Promise<AIVerdict | null>((_, reject) => setTimeout(() => reject(new Error("AI Verification Timeout")), 45000))
                ]);
                console.log(`[AI VERIFICATION COMPLETION SUCCESS]: took ${Date.now() - startTime}ms`);
            } catch (timeoutErr) {
                console.error("AI Verification failed or timed out:", timeoutErr);
                aiResult = null; // Mark as catastrophic failure
            }

            // If the AI completely failed (timeout or network crash), abort the entire transaction
            if (aiResult === null) {
                // Rollback the vote so they can try again or wait for system to recover
                await supabaseAdmin.from("checker_votes").delete().eq("checker_id", checkerId).eq("submission_id", submissionId);
                await supabaseAdmin.from("written_submissions").update({ status: "pending_check" }).eq("id", submissionId);
                return NextResponse.json({ error: "AI Verification service is currently overloaded. Please try flagging again in a moment." }, { status: 503 });
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

            if (aiResult.isCorrect === true) {
                // Checkers lied / trolled
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "ai_confirmed_correct", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                newStatus = "ai_confirmed_correct";
                message = "AI Verified: Answer was actually correct. Spam Checkers penalized.";

                // Penalize the spam checkers -1 point
                for (const cv of wrongVotes) {
                    const { data: voterData } = await supabaseAdmin.auth.admin.getUserById(cv.checker_id);
                    const voterMeta = voterData?.user?.user_metadata || {};
                    const voterPoints = Math.max(0, (Number(voterMeta.totalPoints) || 0) - SPAMMER_PENALTY);
                    await supabaseAdmin.auth.admin.updateUserById(cv.checker_id, {
                        user_metadata: { ...voterMeta, totalPoints: voterPoints },
                    });
                }
                // Bust leaderboard cache so TopBrains updates immediately
                leaderboardCache.invalidate();

                // 🔔 Notify student their answer was confirmed correct
                await createNotification({
                    userId: sub.student_id,
                    type: 'ai_confirmed_correct',
                    title: '✅ AI confirmed your answer is correct!',
                    body: `Your written answer was verified by AI and marked correct. Points are secured!`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                if (sub.challenge_id) {
                    await processCoopWin(sub);
                }
            } else {
                // Checkers correctly caught a bad assignment
                await supabaseAdmin
                    .from("written_submissions")
                    .update({ status: "ai_confirmed_wrong", updated_at: new Date().toISOString() })
                    .eq("id", submissionId);

                newStatus = "ai_confirmed_wrong";
                message = "AI Verified: Answer is wrong. Checkers rewarded, student penalized.";

                // 1. Penalize Student
                const { data: studentData } = await supabaseAdmin.auth.admin.getUserById(sub.student_id);
                const studentMeta = studentData?.user?.user_metadata || {};
                const currentPoints = Number(studentMeta.totalPoints) || 0;
                const questionPoints = Number((sub.questions as any)?.points || 0);

                let totalDeduction = Number(sub.points_awarded || 0); // Undo provisional points
                if (currentPoints > 0) {
                    const standardPenalty = Math.floor(questionPoints / 5);
                    totalDeduction += standardPenalty + STUDENT_EXTRA_PENALTY;
                }
                const newStudentTotal = Math.max(0, currentPoints - totalDeduction);

                // Fix stats (remove falsely claimed win)
                const battlesWon = Math.max(0, (Number(studentMeta.battlesWon) || 0) - 1);

                await supabaseAdmin.auth.admin.updateUserById(sub.student_id, {
                    user_metadata: {
                        ...studentMeta,
                        totalPoints: newStudentTotal,
                        battlesWon,
                    },
                });

                // 2. Reward Checkers +2 points
                for (const cv of wrongVotes) {
                    const { data: voterData } = await supabaseAdmin.auth.admin.getUserById(cv.checker_id);
                    const voterMeta = voterData?.user?.user_metadata || {};
                    const voterPoints = (Number(voterMeta.totalPoints) || 0) + CHECKER_REWARD_POINTS;
                    await supabaseAdmin.auth.admin.updateUserById(cv.checker_id, {
                        user_metadata: { ...voterMeta, totalPoints: voterPoints },
                    });
                }
                // Bust leaderboard cache so TopBrains updates immediately
                leaderboardCache.invalidate();

                // 🔔 Notify student their answer was confirmed wrong
                await createNotification({
                    userId: sub.student_id,
                    type: 'ai_confirmed_wrong',
                    title: '❌ AI reviewed your answer — it was wrong',
                    body: `Your written answer was flagged by peers and the AI confirmed it was incorrect. Points have been deducted.`,
                    href: `/submission/${submissionId}/ai-review`,
                });

                if (sub.challenge_id) await processCoopLoss(sub);
            }
        }

        return NextResponse.json({
            success: true,
            vote,
            status: newStatus,
            message,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const checkerId = await getVerifiedUserId(auth);
        if (!checkerId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const now = new Date();

        // Fetch ONLY pending_check submissions
        const { data: submissions, error } = await supabaseAdmin
            .from("written_submissions")
            .select(`
        id,
        question_id,
        student_id,
        submission_url,
        status,
        created_at,
        challenge_id,
        questions (
          id,
          title,
          body,
          points,
          subject,
          class_grade
        )
      `)
            .eq("status", "pending_check")
            .neq("student_id", checkerId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[checker-vote GET] DB error fetching submissions:", error);
            return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
        }

        console.log(`[checker-vote GET] checker=${checkerId} found ${submissions?.length ?? 0} open submissions`);

        // Filter out submissions this checker already voted on
        const { data: myVotes } = await supabaseAdmin
            .from("checker_votes")
            .select("submission_id")
            .eq("checker_id", checkerId);

        const votedIds = new Set((myVotes || []).map((v: any) => v.submission_id));
        const available = (submissions || []).filter((s: any) => !votedIds.has(s.id));

        // Enrich each submission
        const enriched = await Promise.all(
            available.map(async (sub: any) => {
                // Teacher model answer
                const { data: teacherSol } = await supabaseAdmin
                    .from("teacher_solutions")
                    .select("solution_url")
                    .eq("question_id", sub.question_id)
                    .maybeSingle();

                // Student first name (anonymized)
                const { data: studentData } = await supabaseAdmin.auth.admin.getUserById(sub.student_id);
                const studentMeta = studentData?.user?.user_metadata || {};
                const firstName = (studentMeta.fullName || studentMeta.name || "Student").split(" ")[0];

                // Count both correct and wrong votes
                const { data: voteInfo } = await supabaseAdmin
                    .from("checker_votes")
                    .select("vote")
                    .eq("submission_id", sub.id);

                const wCount = (voteInfo || []).filter(v => v.vote === "wrong").length;
                const cCount = (voteInfo || []).filter(v => v.vote === "correct").length;

                // Effective status is pure
                const effectiveStatus = sub.status;

                return {
                    ...sub,
                    status: effectiveStatus,
                    studentFirstName: firstName,
                    teacherSolutionUrl: teacherSol?.solution_url || null,
                    wrongVotes: wCount,
                    correctVotes: cCount,
                    requiredToFlag: 2,
                    isCoopChallenge: !!(sub as any).challenge_id,
                    windowOpen: true,
                };
            })
        );

        return NextResponse.json(enriched);
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
