import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

async function getVerifiedUser(authHeader?: string | null) {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

async function getSquadMembers(squadId: string) {
    const { data: members } = await supabaseAdmin.from("squad_members").select("user_id").eq("squad_id", squadId);
    if (!members || !members.length) return [];
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const ids = members.map(m => m.user_id);
    return usersData.users
        .filter(u => ids.includes(u.id))
        .map(u => ({
            id: u.id,
            name: (u.user_metadata?.fullName as string) || u.email?.split("@")[0] || "Soldier",
            points: Number(u.user_metadata?.totalPoints || 0),
            avatar: u.user_metadata?.avatar_url || null,
            classGrade: u.user_metadata?.classGrade || "?",
        }));
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const warId = url.searchParams.get("war_id");
        if (!warId) return NextResponse.json({ error: "Missing war_id" }, { status: 400 });

        const auth = req.headers.get("authorization");
        const user = await getVerifiedUser(auth);
        if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        const userId = user.id;

        // Fetch War
        const { data: war, error: warErr } = await supabaseAdmin.from("wars").select("*").eq("id", warId).single();
        if (warErr || !war) return NextResponse.json({ error: "War not found" }, { status: 404 });

        // Identify user's squad
        const { data: member, error: memberErr } = await supabaseAdmin.from("squad_members").select("squad_id").eq("user_id", userId).single();
        if (memberErr || !member?.squad_id) {
            console.error("squad lookup:", memberErr);
            return NextResponse.json({ error: "Not part of a squad" }, { status: 403 });
        }

        const isChallenger = member.squad_id === war.challenger_squad_id;
        const isDefender = member.squad_id === war.defender_squad_id;

        if (!isChallenger && !isDefender) {
            return NextResponse.json({ error: "Your school is not in this war" }, { status: 403 });
        }

        // Fetch school names
        const schoolIds = [war.challenger_school_id, war.defender_school_id].filter(Boolean);
        const { data: schools } = await supabaseAdmin.from("schools").select("id, name").in("id", schoolIds);
        const schoolMap: Record<string, string> = {};
        (schools || []).forEach(s => { schoolMap[s.id] = s.name; });

        // Fetch members of both squads
        const [challengerMembers, defenderMembers] = await Promise.all([
            war.challenger_squad_id ? getSquadMembers(war.challenger_squad_id) : Promise.resolve([]),
            war.defender_squad_id ? getSquadMembers(war.defender_squad_id) : Promise.resolve([]),
        ]);

        // Which questions does my squad have to solve
        const myQuestionIds: string[] = isChallenger ? (war.defender_questions || []) : (war.challenger_questions || []);
        const opponentQuestionIds: string[] = isChallenger ? (war.challenger_questions || []) : (war.defender_questions || []);

        if (!myQuestionIds.length) {
            return NextResponse.json({
                war,
                myQuestions: [],
                opponentQuestions: [],
                submissions: [],
                mySchoolId: isChallenger ? war.challenger_school_id : war.defender_school_id,
                opponentSchoolId: isChallenger ? war.defender_school_id : war.challenger_school_id,
                mySchoolName: isChallenger ? schoolMap[war.challenger_school_id] : schoolMap[war.defender_school_id],
                opponentSchoolName: isChallenger ? schoolMap[war.defender_school_id] : schoolMap[war.challenger_school_id],
                challengerMembers,
                defenderMembers,
                waitingOnOpponent: true,
            });
        }

        // Fetch questions for both sides
        const allQuestionIds = [...new Set([...myQuestionIds, ...opponentQuestionIds])].filter(Boolean);
        const { data: allQuestions } = await supabaseAdmin
            .from("questions")
            .select("id, title, subject, difficulty, points, class_grade")
            .in("id", allQuestionIds);

        const qMap: Record<string, any> = {};
        (allQuestions || []).forEach(q => { qMap[q.id] = q; });

        const myQuestions = myQuestionIds.map(id => qMap[id]).filter(Boolean);
        const opponentQuestions = opponentQuestionIds.map(id => qMap[id]).filter(Boolean);

        // Fetch all submissions for this war
        const { data: submissions } = await supabaseAdmin
            .from("war_submissions")
            .select("*")
            .eq("war_id", warId);

        const mySchoolId = isChallenger ? war.challenger_school_id : war.defender_school_id;
        const opponentSchoolId = isChallenger ? war.defender_school_id : war.challenger_school_id;

        // Calculate live scores from submissions (correct answers only)
        const myScore = (submissions || [])
            .filter(s => s.school_id === mySchoolId && s.status === "correct")
            .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
        const opponentScore = (submissions || [])
            .filter(s => s.school_id === opponentSchoolId && s.status === "correct")
            .reduce((sum, s) => sum + (s.points_awarded || 0), 0);

        return NextResponse.json({
            war: { ...war, live_challenger_score: myScore, live_defender_score: opponentScore },
            myQuestions,
            opponentQuestions,
            submissions: submissions || [],
            mySchoolId,
            opponentSchoolId,
            mySchoolName: schoolMap[mySchoolId] || "Your School",
            opponentSchoolName: schoolMap[opponentSchoolId] || "Opponent",
            challengerMembers: isChallenger ? challengerMembers : defenderMembers,
            defenderMembers: isChallenger ? defenderMembers : challengerMembers,
            waitingOnOpponent: false,
        });

    } catch (err: any) {
        if (err.message?.includes("relation \"public.war_submissions\" does not exist")) {
            return NextResponse.json({ error: "MISSING_TABLE" }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
