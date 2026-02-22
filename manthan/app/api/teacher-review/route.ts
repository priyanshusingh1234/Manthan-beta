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

const CHECKER_REWARD_POINTS = 2;
const STUDENT_EXTRA_PENALTY = 3;

// GET: Fetch flagged submissions for teacher review
export async function GET(req: Request) {
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

        const { data: flagged, error } = await supabaseAdmin
            .from("written_submissions")
            .select(`
        id,
        question_id,
        student_id,
        submission_url,
        submission_path,
        points_awarded,
        created_at,
        questions (
          id,
          title,
          body,
          points,
          subject,
          class_grade,
          created_by
        )
      `)
            .eq("status", "flagged")
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: "Failed to fetch flagged submissions" }, { status: 500 });
        }

        // Enrich with student info and teacher model answer
        const enriched = await Promise.all(
            (flagged || []).map(async (sub: any) => {
                // Only show submissions for questions this teacher created
                if ((sub.questions as any)?.created_by !== teacherId) return null;

                const { data: studentData } = await supabaseAdmin.auth.admin.getUserById(sub.student_id);
                const studentMeta = studentData?.user?.user_metadata || {};

                const { data: teacherSol } = await supabaseAdmin
                    .from("teacher_solutions")
                    .select("solution_url, solution_path")
                    .eq("question_id", sub.question_id)
                    .maybeSingle();

                const { data: votes } = await supabaseAdmin
                    .from("checker_votes")
                    .select("checker_id, vote")
                    .eq("submission_id", sub.id);

                return {
                    ...sub,
                    studentName: studentMeta.fullName || studentMeta.name || "Student",
                    studentUsername: studentMeta.username || null,
                    teacherSolutionUrl: teacherSol?.solution_url || null,
                    checkerVotes: votes || [],
                };
            })
        );

        return NextResponse.json(enriched.filter(Boolean));
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// POST: Teacher submits final verdict on flagged submission
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

        const { submissionId, verdict } = await req.json(); // verdict: 'correct' | 'wrong'
        if (!submissionId || !["correct", "wrong"].includes(verdict)) {
            return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
        }

        // Fetch submission
        const { data: sub, error: subErr } = await supabaseAdmin
            .from("written_submissions")
            .select("*, questions(points, created_by)")
            .eq("id", submissionId)
            .single();

        if (subErr || !sub) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Only the question creator can review
        if ((sub.questions as any)?.created_by !== teacherId) {
            return NextResponse.json({ error: "You can only review submissions for your own questions" }, { status: 403 });
        }

        if (sub.status !== "flagged") {
            return NextResponse.json({ error: "Submission is not in flagged state" }, { status: 400 });
        }

        const questionPoints = (sub.questions as any)?.points || 0;

        if (verdict === "wrong") {
            const { data: studentData } = await supabaseAdmin.auth.admin.getUserById(sub.student_id);
            const studentMeta = studentData?.user?.user_metadata || {};
            const currentPoints = Number(studentMeta.totalPoints) || 0;

            let totalDeduction = sub.points_awarded;
            if (currentPoints > 0) {
                const standardPenalty = Math.floor(questionPoints / 5);
                totalDeduction += standardPenalty + STUDENT_EXTRA_PENALTY;
            }
            const newStudentTotal = Math.max(0, currentPoints - totalDeduction);

            const battlesAttempted = (Number(studentMeta.battlesAttempted) || 0) + 1;
            const battlesWon = Number(studentMeta.battlesWon) || 0;

            await supabaseAdmin.auth.admin.updateUserById(sub.student_id, {
                user_metadata: {
                    ...studentMeta,
                    totalPoints: newStudentTotal,
                    battlesAttempted,
                    battlesWon,
                },
            });

            // Reward checkers who voted "wrong" with +2 points each
            const { data: wrongVoters } = await supabaseAdmin
                .from("checker_votes")
                .select("checker_id")
                .eq("submission_id", submissionId)
                .eq("vote", "wrong");

            for (const voter of wrongVoters || []) {
                const { data: voterData } = await supabaseAdmin.auth.admin.getUserById(voter.checker_id);
                const voterMeta = voterData?.user?.user_metadata || {};
                const voterPoints = Number(voterMeta.totalPoints) || 0;
                await supabaseAdmin.auth.admin.updateUserById(voter.checker_id, {
                    user_metadata: { ...voterMeta, totalPoints: voterPoints + CHECKER_REWARD_POINTS },
                });
            }

            // Bust leaderboard cache so TopBrains updates immediately
            leaderboardCache.invalidate();

            await supabaseAdmin
                .from("written_submissions")
                .update({ status: "teacher_confirmed_wrong", updated_at: new Date().toISOString() })
                .eq("id", submissionId);

            return NextResponse.json({
                success: true,
                verdict: "wrong",
                studentPointsDeducted: totalDeduction,
                newStudentTotal,
                checkersRewarded: (wrongVoters || []).length,
            });
        } else {
            // verdict === "correct"
            await supabaseAdmin
                .from("written_submissions")
                .update({ status: "teacher_confirmed_correct", updated_at: new Date().toISOString() })
                .eq("id", submissionId);

            return NextResponse.json({ success: true, verdict: "correct" });
        }
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
