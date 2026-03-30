import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/createNotification";
import { getSelectedWarMemberIds } from "@/lib/warRoster";

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

async function getSquadMemberIds(squadId?: string | null) {
    if (!squadId) return [] as string[];
    const { data: members } = await supabaseAdmin
        .from("squad_members")
        .select("user_id")
        .eq("squad_id", squadId);
    return Array.from(new Set((members || []).map((m: any) => String(m.user_id)).filter(Boolean)));
}

    function clamp(n: number, min = 0, max = 1) {
        return Math.max(min, Math.min(max, n));
    }

    function hashString(input: string) {
        let h = 2166136261;
        for (let i = 0; i < input.length; i++) {
            h ^= input.charCodeAt(i);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        return h >>> 0;
    }

    function seededRandom(seed: number) {
        let s = seed >>> 0;
        return () => {
            s += 0x6D2B79F5;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function difficultyAccuracy(difficulty?: string | null) {
        if (difficulty === "easy") return 0.8;
        if (difficulty === "hard") return 0.38;
        return 0.58;
    }

    function generateGhostMembers(warId: string, side: "challenger" | "defender", count = 6) {
        const prefixes = ["Phantom", "Cipher", "Nova", "Raven", "Echo", "Zero", "Astra", "Vortex", "Glitch", "Onyx"];
        const titles = ["Cadet", "Scout", "Sniper", "Strategist", "Captain", "Commander", "Warden", "Sage"];
        const rand = seededRandom(hashString(`${warId}:${side}:members`));
        const members: Array<{ id: string; name: string; points: number; avatar: null; classGrade: string }> = [];

        for (let i = 0; i < count; i++) {
            const p = prefixes[Math.floor(rand() * prefixes.length)];
            const t = titles[Math.floor(rand() * titles.length)];
            const serial = String(Math.floor(rand() * 90) + 10);
            members.push({
                id: `ghost-${side}-${i + 1}`,
                name: `${p} ${t}-${serial}`,
                points: Math.floor(900 + rand() * 2200),
                avatar: null,
                classGrade: String(8 + Math.floor(rand() * 5)),
            });
        }

        return members;
    }

    function buildGhostSubmissions(options: {
        warId: string;
        ghostSchoolId: string;
        questionIds: string[];
        questionMap: Record<string, any>;
        ghostMembers: Array<{ id: string }>;
        existing: any[];
        status: string;
        endsAt: string;
    }) {
        const { warId, ghostSchoolId, questionIds, questionMap, ghostMembers, existing, status, endsAt } = options;
        if (!questionIds.length || !ghostMembers.length) return [] as any[];

        const existingPairs = new Set((existing || []).map(s => `${s.school_id}:${s.question_id}`));
        const now = Date.now();
        const endMs = new Date(endsAt).getTime();
        const activeStartMs = endMs - 5 * 60 * 1000;

        let progress = 1;
        if (status === "active") {
            progress = clamp((now - activeStartMs) / (5 * 60 * 1000), 0, 1);
        } else if (status === "preparation") {
            progress = 0;
        }

        const elapsedMs = Math.max(0, now - activeStartMs);
        // Ghost fires aggressively so wars feel alive even with slower polling.
        const cadenceAttempts = Math.floor(elapsedMs / 15000);
        let attemptCount = Math.floor(questionIds.length * progress);
        if (status === "active") {
            const minBurst = Math.min(questionIds.length, Math.max(2, Math.ceil(questionIds.length * 0.6)));
            attemptCount = Math.min(questionIds.length, Math.max(attemptCount, cadenceAttempts, minBurst));
        }
        if (attemptCount <= 0) return [];

        const orderedIds = [...questionIds].sort((a, b) => hashString(`${warId}:q:${a}`) - hashString(`${warId}:q:${b}`));
        const activeWindowMs = Math.max(1, (status === "active" ? now : endMs) - activeStartMs);
        const synth: any[] = [];

        for (let i = 0; i < Math.min(attemptCount, orderedIds.length); i++) {
            const qid = orderedIds[i];
            const q = questionMap[qid];
            if (!q) continue;
            if (existingPairs.has(`${ghostSchoolId}:${qid}`)) continue;

            const shotRand = seededRandom(hashString(`${warId}:${ghostSchoolId}:${qid}`));
            const isCorrect = shotRand() < difficultyAccuracy(q.difficulty);
            const shotAt = new Date(activeStartMs + Math.floor(((i + 1) / (attemptCount + 1)) * activeWindowMs)).toISOString();

            synth.push({
                id: `ghost-sub-${warId}-${qid}`,
                war_id: warId,
                school_id: ghostSchoolId,
                student_id: ghostMembers[i % ghostMembers.length].id,
                question_id: qid,
                status: isCorrect ? "correct" : "incorrect",
                points_awarded: isCorrect ? (q.points || 0) : 0,
                created_at: shotAt,
            });
        }

        return synth;
    }

    function calcSchoolScore(submissions: any[], schoolId: string) {
        return (submissions || [])
            .filter(s => s.school_id === schoolId && s.status === "correct")
            .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
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
        const warFetch = await supabaseAdmin.from("wars").select("*").eq("id", warId).single();
        if (warFetch.error || !warFetch.data) return NextResponse.json({ error: "War not found" }, { status: 404 });
        let war: any = warFetch.data;

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

        const ghostChallenger = schoolMap[war.challenger_school_id] === "Ghost School";
        const ghostDefender = schoolMap[war.defender_school_id] === "Ghost School";
        const ghostTeamSize = Math.max(5, Math.min(30, Number(war.war_format) || 5));

        // Fetch members of both squads
        let [challengerMembers, defenderMembers] = await Promise.all([
            war.challenger_squad_id ? getSquadMembers(war.challenger_squad_id) : Promise.resolve([]),
            war.defender_squad_id ? getSquadMembers(war.defender_squad_id) : Promise.resolve([]),
        ]);

        if (!ghostChallenger) {
            const selected = await getSelectedWarMemberIds(warId, war.challenger_school_id);
            if (selected?.length) {
                const selectedSet = new Set(selected);
                challengerMembers = challengerMembers.filter((m: any) => selectedSet.has(m.id));
            }
        }

        if (!ghostDefender) {
            const selected = await getSelectedWarMemberIds(warId, war.defender_school_id);
            if (selected?.length) {
                const selectedSet = new Set(selected);
                defenderMembers = defenderMembers.filter((m: any) => selectedSet.has(m.id));
            }
        }

        if (ghostChallenger && challengerMembers.length === 0) {
            challengerMembers = generateGhostMembers(warId, "challenger", ghostTeamSize);
        }
        if (ghostDefender && defenderMembers.length === 0) {
            defenderMembers = generateGhostMembers(warId, "defender", ghostTeamSize);
        }

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
            .select("id, title, body, subject, difficulty, points, class_grade, options, correct_option, image_path, image_url, time_limit")
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

        let mergedSubmissions = [...(submissions || [])];

        if ((ghostChallenger || ghostDefender) && (war.status === "active" || war.status === "calculating" || war.status === "completed")) {
            const ghostSchoolId = ghostChallenger ? war.challenger_school_id : war.defender_school_id;
            const ghostQuestionIds: string[] = ghostChallenger ? (war.defender_questions || []) : (war.challenger_questions || []);
            const ghostMembers = ghostChallenger ? challengerMembers : defenderMembers;

            const ghostSubs = buildGhostSubmissions({
                warId,
                ghostSchoolId,
                questionIds: ghostQuestionIds,
                questionMap: qMap,
                ghostMembers,
                existing: mergedSubmissions,
                status: war.status,
                endsAt: war.ends_at,
            });

            if (ghostSubs.length > 0) {
                const insertRows = ghostSubs.map(({ id, ...rest }) => rest);
                const { error: ghostInsertError } = await supabaseAdmin
                    .from("war_submissions")
                    .insert(insertRows);
                if (ghostInsertError) {
                    // Non-fatal: feed can still render from synthetic events even if a duplicate insert races.
                    console.warn("[war/battle] ghost insert warning:", ghostInsertError.message);
                }
            }

            mergedSubmissions = [...mergedSubmissions, ...ghostSubs];
        }

        // Auto-end war if timer has expired and still active (including ghost synthetic score)
        if (war.status === "active" && war.ends_at && new Date(war.ends_at).getTime() < Date.now()) {
            const cScore = calcSchoolScore(mergedSubmissions, war.challenger_school_id);
            const dScore = calcSchoolScore(mergedSubmissions, war.defender_school_id);
            const winnerSchoolId = cScore > dScore ? war.challenger_school_id : dScore > cScore ? war.defender_school_id : null;
            const winnerSquadId = winnerSchoolId === war.challenger_school_id ? war.challenger_squad_id : war.defender_squad_id;

            const { data: updatedWar } = await supabaseAdmin.from("wars").update({
                status: "completed",
                challenger_score: cScore,
                defender_score: dScore,
                winner_school_id: winnerSchoolId,
            }).eq("id", warId).eq("status", "active").select().maybeSingle();

            if (updatedWar) {
                war = updatedWar;
            }

            if (winnerSquadId) {
                const winnerSchoolIdForBonus = winnerSchoolId === war.challenger_school_id ? war.challenger_school_id : war.defender_school_id;
                const selectedWinnerIds = await getSelectedWarMemberIds(warId, winnerSchoolIdForBonus);
                const winnerMemberIds = selectedWinnerIds && selectedWinnerIds.length
                    ? selectedWinnerIds
                    : (await getSquadMemberIds(winnerSquadId));

                for (const winnerMemberId of winnerMemberIds) {
                    const { data: wmUser } = await supabaseAdmin.auth.admin.getUserById(winnerMemberId);
                    if (wmUser?.user) {
                        const meta = wmUser.user.user_metadata || {};
                        await supabaseAdmin.auth.admin.updateUserById(winnerMemberId, {
                            user_metadata: { ...meta, totalPoints: Math.max(0, (Number(meta.totalPoints) || 0) + 5) }
                        });
                    }
                }
            }

            if (updatedWar) {
                const sideAIds = await getSquadMemberIds(updatedWar.challenger_squad_id);
                const sideBIds = await getSquadMemberIds(updatedWar.defender_squad_id);

                const { data: schools } = await supabaseAdmin
                    .from("schools")
                    .select("id, name")
                    .in("id", [updatedWar.challenger_school_id, updatedWar.defender_school_id]);
                const schoolMap: Record<string, string> = Object.fromEntries((schools || []).map((s: any) => [s.id, s.name]));

                const leftName = schoolMap[updatedWar.challenger_school_id] || "School A";
                const rightName = schoolMap[updatedWar.defender_school_id] || "School B";
                const scoreLine = `${leftName} ${cScore} - ${dScore} ${rightName}`;

                const notifyGroup = async (ids: string[], title: string, href: string) => {
                    await Promise.allSettled(ids.map((uid) => createNotification({
                        userId: uid,
                        type: "war_result",
                        title,
                        body: scoreLine,
                        href,
                    })));
                };

                const challengerWon = winnerSchoolId === updatedWar.challenger_school_id;
                const defenderWon = winnerSchoolId === updatedWar.defender_school_id;
                const challengerSelectedIds = await getSelectedWarMemberIds(warId, updatedWar.challenger_school_id);
                const defenderSelectedIds = await getSelectedWarMemberIds(warId, updatedWar.defender_school_id);

                const notifySideAIds = challengerSelectedIds && challengerSelectedIds.length ? challengerSelectedIds : sideAIds;
                const notifySideBIds = defenderSelectedIds && defenderSelectedIds.length ? defenderSelectedIds : sideBIds;

                await notifyGroup(
                    notifySideAIds,
                    challengerWon ? "Victory! War won" : defenderWon ? "War finished: Defeat" : "War finished: Draw",
                    `/war-history?schoolId=${updatedWar.challenger_school_id}`
                );
                await notifyGroup(
                    notifySideBIds,
                    defenderWon ? "Victory! War won" : challengerWon ? "War finished: Defeat" : "War finished: Draw",
                    `/war-history?schoolId=${updatedWar.defender_school_id}`
                );
            }
        }

        const mySchoolId = isChallenger ? war.challenger_school_id : war.defender_school_id;
        const opponentSchoolId = isChallenger ? war.defender_school_id : war.challenger_school_id;

        // Calculate live scores from submissions (correct answers only)
                const myScore = mergedSubmissions
            .filter(s => s.school_id === mySchoolId && s.status === "correct")
            .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
                const opponentScore = mergedSubmissions
            .filter(s => s.school_id === opponentSchoolId && s.status === "correct")
            .reduce((sum, s) => sum + (s.points_awarded || 0), 0);

        return NextResponse.json({
            war: { ...war, live_challenger_score: myScore, live_defender_score: opponentScore },
            myQuestions,
            opponentQuestions,
            submissions: mergedSubmissions,
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
