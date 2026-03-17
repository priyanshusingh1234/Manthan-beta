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

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const warId = url.searchParams.get("war_id");
        if (!warId) return NextResponse.json({ error: "Missing war_id" }, { status: 400 });

        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Fetch War
        const { data: war, error: warErr } = await supabaseAdmin
            .from("wars")
            .select("*")
            .eq("id", warId)
            .single();

        if (warErr || !war) return NextResponse.json({ error: "War not found" }, { status: 404 });

        // Get user's squad
        const { data: member, error: memberErr } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).single();
        if (memberErr || !member || !member.squad_id) {
             console.error("squad query error:", memberErr);
             return NextResponse.json({ error: "Not part of a squad" }, { status: 403 });
        }

        let isChallenger = false;
        let isDefender = false;

        if (member.squad_id === war.challenger_squad_id) isChallenger = true;
        if (member.squad_id === war.defender_squad_id) isDefender = true;

        if (!isChallenger && !isDefender) {
             return NextResponse.json({ error: "Your school is not in this war" }, { status: 403 });
        }

        // Determine which questions this user's squad has to solve.
        // Challenger solves the Defender's picks. Defender solves Challenger's picks.
        let questionIdsToSolve = [];
        if (isChallenger) {
             questionIdsToSolve = war.defender_questions || [];
        } else {
             questionIdsToSolve = war.challenger_questions || [];
        }

        if (!questionIdsToSolve || questionIdsToSolve.length === 0) {
             // If opponent hasn't picked yet
             return NextResponse.json({ 
                 war, 
                 questions: [], 
                 submissions: [], 
                 mySchoolId: isChallenger ? war.challenger_school_id : war.defender_school_id,
                 opponentSchoolId: isChallenger ? war.defender_school_id : war.challenger_school_id,
                 waitingOnOpponent: true
             });
        }

        // Fetch the active questions
        const { data: questions, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("id, title, class, subject, topic, difficulty, points")
            .in("id", questionIdsToSolve);

        if (qErr) throw qErr;

        // Fetch all submissions for this war
        // (So the dashboard can show who solved what and live feed)
        const { data: submissions, error: subErr } = await supabaseAdmin
            .from("war_submissions")
            .select("*, profiles:student_id(name)")
            .eq("war_id", warId);
            
        // Note: War Submissions table will need to be created by the user via SQL script provided.
        // If the table doesn't exist, this will gracefully fail. We should handle it without crashing.

        return NextResponse.json({
            war,
            questions: questions || [],
            submissions: submissions || [],
            mySchoolId: isChallenger ? war.challenger_school_id : war.defender_school_id,
            opponentSchoolId: isChallenger ? war.defender_school_id : war.challenger_school_id,
            waitingOnOpponent: false
        });
    } catch (err: any) {
        // If war_submissions table not found, just return empty submissions
        if (err.message && err.message.includes("relation \"public.war_submissions\" does not exist")) {
             return NextResponse.json({ error: "MISSING_TABLE" }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
