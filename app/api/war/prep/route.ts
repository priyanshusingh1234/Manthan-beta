import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getSelectedWarMemberIds } from "@/lib/warRoster";

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
        let userId = null;
        let userClassGrade = "10"; // fallback

        if (auth) {
            const token = auth.replace(/^Bearer\s+/i, "");
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                userId = user.id;
                if (user.user_metadata?.classGrade) {
                    userClassGrade = user.user_metadata.classGrade;
                }
            }
        }

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

        // Ensure user is General of challenger or defender
        // Get user's squad
        const { data: member, error: memberErr } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).single();
        if (memberErr || !member || !member.squad_id) {
             console.error("squad_members query error:", memberErr);
             return NextResponse.json({ error: "Not part of a squad" }, { status: 403 });
        }

        let isChallenger = false;
        let isDefender = false;

        if (member.squad_id === war.challenger_squad_id) isChallenger = true;
        if (member.squad_id === war.defender_squad_id) isDefender = true;

        if (!isChallenger && !isDefender) {
             return NextResponse.json({ error: "Your school is not in this war" }, { status: 403 });
        }

        // Determine if user is the General
        const { data: squad } = await supabaseAdmin.from("squads").select("general_id").eq("id", member.squad_id).single();
        const isGeneral = squad && squad.general_id === userId;

        const mySideQuestions: string[] = isChallenger ? (war.challenger_questions || []) : (war.defender_questions || []);
        const oppSideQuestions: string[] = isChallenger ? (war.defender_questions || []) : (war.challenger_questions || []);
        const requiredPicks = Number(war.war_format) || 5;
        const mySchoolId = isChallenger ? war.challenger_school_id : war.defender_school_id;
        const selectedMemberIds = await getSelectedWarMemberIds(warId, mySchoolId);
        const isSelectedForWar = !selectedMemberIds || selectedMemberIds.includes(userId);

        // Get questions matching the user's class grade OR 'All' grade questions
        const { data: questions, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("id, title, subject, difficulty, points, class_grade")
            .or(`class_grade.eq.${userClassGrade},class_grade.eq.All`)
            .order("created_at", { ascending: false })
            .limit(100);

        if (qErr) throw qErr;

        return NextResponse.json({
            war,
            questions: questions || [],
            isChallenger,
            isDefender,
            isGeneral,
            isSelectedForWar,
            selectedRosterCount: selectedMemberIds?.length || null,
            hasLockedPicks: mySideQuestions.length >= requiredPicks,
            myPickedCount: mySideQuestions.length,
            opponentPickedCount: oppSideQuestions.length,
            requiredPicks,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await req.json();
        const { war_id, question_id } = body;

        if (!war_id || !question_id) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Fetch War
        const { data: war, error: warErr } = await supabaseAdmin
            .from("wars")
            .select("*")
            .eq("id", war_id)
            .single();

        if (warErr || !war) return NextResponse.json({ error: "War not found" }, { status: 404 });
        if (war.status !== 'preparation') return NextResponse.json({ error: "War is not in preparation phase" }, { status: 400 });

        const requiredPicks = Number(war.war_format) || 5;

        const { data: member, error: memberErr } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).single();
        if (memberErr || !member || !member.squad_id) {
            console.error(memberErr);
            return NextResponse.json({ error: "Not in a squad" }, { status: 403 });
        }

        let isChallenger = false;
        if (member.squad_id === war.challenger_squad_id) isChallenger = true;
        const mySchoolId = isChallenger ? war.challenger_school_id : war.defender_school_id;
        const selectedMemberIds = await getSelectedWarMemberIds(war_id, mySchoolId);

        if (selectedMemberIds && !selectedMemberIds.includes(userId)) {
            return NextResponse.json({ error: "Only selected war members can submit prep picks." }, { status: 403 });
        }

        const mySideQuestions: string[] = isChallenger ? (war.challenger_questions || []) : (war.defender_questions || []);
        const opponentSideQuestions: string[] = isChallenger ? (war.defender_questions || []) : (war.challenger_questions || []);

        if (mySideQuestions.length >= requiredPicks) {
            return NextResponse.json({ error: `Your side already finalized all ${requiredPicks} picks.` }, { status: 400 });
        }

        if (mySideQuestions.includes(question_id)) {
            return NextResponse.json({ error: "This question is already selected by your side." }, { status: 400 });
        }

        if (opponentSideQuestions.includes(question_id)) {
            return NextResponse.json({ error: "This question is already selected by the opponent." }, { status: 400 });
        }

        const { data: qExists } = await supabaseAdmin
            .from("questions")
            .select("id")
            .eq("id", question_id)
            .maybeSingle();

        if (!qExists) {
            return NextResponse.json({ error: "Question not found." }, { status: 404 });
        }

        const nextQuestions = [...mySideQuestions, question_id];

        // Save pick
        const updateData: any = {};
        if (isChallenger) {
             updateData.challenger_questions = nextQuestions;
        } else {
             updateData.defender_questions = nextQuestions;
        }

        const { error: updateErr } = await supabaseAdmin
            .from("wars")
            .update(updateData)
            .eq("id", war_id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true, myPickedCount: nextQuestions.length, requiredPicks });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
