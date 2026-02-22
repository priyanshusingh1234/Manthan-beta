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

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { questionId, selectedOption, startedAt, timeTaken } = await req.json();

        if (!questionId) {
            return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
        }

        // 1. Fetch Question
        const { data: q, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("*")
            .eq("id", questionId)
            .single();

        if (qErr || !q) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        // 2. Check if already attempted
        const { data: existingAttempt } = await supabaseAdmin
            .from("question_attempts")
            .select("id")
            .eq("user_id", userId)
            .eq("question_id", questionId)
            .maybeSingle();

        if (existingAttempt) {
            return NextResponse.json({ error: "You have already attempted this question" }, { status: 403 });
        }

        // 3. Evaluate answer
        const correctOpt = typeof q.correct_option === 'number' ? q.correct_option : null;
        const isCorrect = correctOpt !== null && selectedOption === correctOpt;
        const questionPoints = q.points || 0;

        // 4. Update User Points
        const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (uErr || !userResp?.user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userMeta = userResp.user.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;

        let pointsChange = 0;
        if (isCorrect) {
            pointsChange = questionPoints;
        } else {
            // Flat Tiered Deduction: penalty = Math.floor(questionPoints / 5). 
            // 1-4 points = 0 penalty. 5-9 = -1 penalty, etc. This is explicit and avoids unfair harsh decimals.
            if (currentPoints > 0) {
                const calculatedPenalty = Math.floor(questionPoints / 5);
                pointsChange = -calculatedPenalty;
            }
        }

        const newTotal = Math.max(0, currentPoints + pointsChange);

        // Update totalPoints and increment attempts counter maybe
        const battlesAttempted = (Number(userMeta.battlesAttempted) || 0) + 1;
        const battlesWon = (Number(userMeta.battlesWon) || 0) + (isCorrect ? 1 : 0);

        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...userMeta,
                totalPoints: newTotal,
                battlesAttempted,
                battlesWon,
            }
        });
        leaderboardCache.invalidate(); // reflect new MCQ points in TopBrains immediately

        // 5. Save attempt
        await supabaseAdmin.from("question_attempts").insert({
            user_id: userId,
            question_id: questionId,
            selected_option: selectedOption,
            is_correct: isCorrect,
            time_taken: timeTaken || 0,
            started_at: startedAt || new Date().toISOString(),
            submitted_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            isCorrect,
            correctOption: correctOpt,
            pointsChange,
            newTotal
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Failed to submit answer" }, { status: 500 });
    }
}
