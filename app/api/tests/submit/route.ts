import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "Missing authorization" }, { status: 401 });

        const token = auth.replace(/^Bearer\s+/i, "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { testId, answers } = body; 
        // answers array of { questionId, type, answerText, imageUrl }

        if (!testId || !answers || !Array.isArray(answers)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Fetch questions to grade MCQs
        const { data: questions, error: qError } = await supabaseAdmin
            .from('test_questions')
            .select('id, type, correct_answer, marks')
            .eq('test_id', testId);

        if (qError || !questions) {
            return NextResponse.json({ error: "Failed to fetch test questions" }, { status: 500 });
        }

        const questionMap = new Map(questions.map(q => [q.id, q]));

        let totalScore = 0;
        const processedAnswers = [];

        for (const ans of answers) {
            const q = questionMap.get(ans.questionId);
            if (!q) continue;

            let marksAwarded = 0;

            if (q.type === 'mcq') {
                if (ans.answerText === q.correct_answer) {
                    marksAwarded = q.marks;
                }
            }
            // For written questions, marks Awarded is 0 initially, will be graded by AI or teacher later

            totalScore += marksAwarded;
            
            processedAnswers.push({
                question_id: ans.questionId,
                answer_text: ans.answerText || null,
                image_url: ans.imageUrl || null,
                marks_awarded: marksAwarded
            });
        }

        // 1. Create or Update submission
        const { data: submission, error: subError } = await supabaseAdmin
            .from('test_submissions')
            .upsert({
                test_id: testId,
                user_id: user.id,
                status: 'grading', // Written answers still need grading
                total_score: totalScore,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'test_id,user_id'
            })
            .select('id')
            .single();

        if (subError) throw subError;

        // 2. Insert answers
        const answersToInsert = processedAnswers.map(ans => ({
            submission_id: submission.id,
            ...ans,
            created_at: new Date().toISOString()
        }));

        const { error: ansError } = await supabaseAdmin
            .from('test_answers')
            .upsert(answersToInsert, {
                onConflict: 'submission_id,question_id'
            });

        if (ansError) throw ansError;

        return NextResponse.json({ success: true, submissionId: submission.id, autoGradedScore: totalScore });

    } catch (err: any) {
        console.error("Test submit error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
