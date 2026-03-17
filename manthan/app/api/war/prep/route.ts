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

        // Note: we can restrict access if they aren't the General 
        // if (!isGeneral) {
        //      return NextResponse.json({ error: "Only the General can pick questions" }, { status: 403 });
        // }

        // Get questions
        const { data: questions, error: qErr } = await supabaseAdmin
            .from("questions")
            .select("id, title, subject, difficulty, points")
            .order("created_at", { ascending: false })
            .limit(100);

        if (qErr) throw qErr;

        return NextResponse.json({
            war,
            questions: questions || [],
            isChallenger,
            isDefender,
            isGeneral,
            hasLockedPicks: isChallenger ? (war.challenger_questions?.length > 0) : (war.defender_questions?.length > 0)
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
        const { war_id, question_ids } = body;

        if (!war_id || !question_ids || !Array.isArray(question_ids)) {
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

        if (question_ids.length !== war.war_format) {
            return NextResponse.json({ error: `You must pick exactly ${war.war_format} questions.` }, { status: 400 });
        }

        const { data: member, error: memberErr } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).single();
        if (memberErr || !member || !member.squad_id) {
            console.error(memberErr);
            return NextResponse.json({ error: "Not in a squad" }, { status: 403 });
        }

        let isChallenger = false;
        if (member.squad_id === war.challenger_squad_id) isChallenger = true;

        // Save picks
        const updateData: any = {};
        if (isChallenger) {
             updateData.challenger_questions = question_ids;
        } else {
             updateData.defender_questions = question_ids;
        }

        const { error: updateErr } = await supabaseAdmin
            .from("wars")
            .update(updateData)
            .eq("id", war_id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
