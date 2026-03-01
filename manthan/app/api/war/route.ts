import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────
// WEIGHT FORMULA
// Weight = (Avg Class × 100) + (Avg Points × 0.1) – (Distinct Classes × 5)
// ──────────────────────────────────────────────
function computeSquadWeight(members: Array<{ classGrade: number; points: number }>) {
    if (!members.length) return 0;

    const avgClass = members.reduce((sum, m) => sum + (m.classGrade || 0), 0) / members.length;
    const avgPoints = members.reduce((sum, m) => sum + (m.points || 0), 0) / members.length;
    const distinctClasses = new Set(members.map(m => m.classGrade)).size;

    const weight = (avgClass * 100) + (avgPoints * 0.1) - (distinctClasses * 5);
    return Math.round(weight * 100) / 100; // 2 decimal places
}

// GET /api/war?school_id=<id>  — fetch active wars for a school
export async function GET(req: NextRequest) {
    try {
        const schoolId = req.nextUrl.searchParams.get('school_id');
        if (!schoolId) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 });

        const { data: wars, error } = await supabaseAdmin
            .from('wars')
            .select('*')
            .or(`challenger_school_id.eq.${schoolId},defender_school_id.eq.${schoolId}`)
            .neq('status', 'completed')
            .order('declared_at', { ascending: false });

        if (error) throw error;

        // Enrich with school names
        const allSchoolIds = [
            ...new Set(wars?.flatMap(w => [w.challenger_school_id, w.defender_school_id]) || [])
        ];

        const { data: schoolNames } = await supabaseAdmin
            .from('schools')
            .select('id, name')
            .in('id', allSchoolIds);

        const schoolMap = Object.fromEntries((schoolNames || []).map(s => [s.id, s.name]));

        const enriched = (wars || []).map(w => ({
            ...w,
            challenger_name: schoolMap[w.challenger_school_id] || 'Unknown',
            defender_name: schoolMap[w.defender_school_id] || 'Unknown',
            // From perspective of the requesting school
            opponent: w.challenger_school_id === schoolId
                ? schoolMap[w.defender_school_id]
                : schoolMap[w.challenger_school_id],
            isChallenger: w.challenger_school_id === schoolId,
            myScore: w.challenger_school_id === schoolId ? w.challenger_score : w.defender_score,
            opponentScore: w.challenger_school_id === schoolId ? w.defender_score : w.challenger_score,
            timeLeft: getTimeLeft(w.ends_at),
        }));

        return NextResponse.json({ wars: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/war — Declare war! Find best matching opponent using weight formula
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get user's school
        const userSchoolName = user.user_metadata?.school;
        if (!userSchoolName) return NextResponse.json({ error: 'No school assigned' }, { status: 400 });

        const { data: mySchool } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('name', userSchoolName)
            .single();
        if (!mySchool) return NextResponse.json({ error: 'School not found' }, { status: 404 });

        // 2. Get my squad & verify the user is the General
        const { data: mySquad } = await supabaseAdmin
            .from('squads')
            .select('*')
            .eq('school_id', mySchool.id)
            .single();

        if (!mySquad) return NextResponse.json({ error: 'Your school has no squad. Create one first.' }, { status: 400 });
        if (mySquad.general_id !== user.id) return NextResponse.json({ error: 'Only the General can declare war.' }, { status: 403 });

        // 3. Check if already in an active war
        const { data: existingWar } = await supabaseAdmin
            .from('wars')
            .select('id')
            .or(`challenger_school_id.eq.${mySchool.id},defender_school_id.eq.${mySchool.id}`)
            .eq('status', 'active')
            .single();
        if (existingWar) return NextResponse.json({ error: 'You are already fighting an active war!' }, { status: 400 });

        // 4. Compute MY squad weight
        const myWeight = await computeSchoolWeight(mySchool.id, mySquad.id);

        // 5. Find all other schools that have squads (potential enemies)
        const { data: allSquads } = await supabaseAdmin
            .from('squads')
            .select('id, school_id')
            .neq('school_id', mySchool.id);

        if (!allSquads || allSquads.length === 0) {
            return NextResponse.json({ error: 'No other schools have squads yet. Invite rivals!' }, { status: 400 });
        }

        // 6. Compute weight for each rival school and find the closest match
        const rivalWeights: Array<{ schoolId: string; squadId: string; weight: number; diff: number }> = [];

        for (const rival of allSquads) {
            // Skip schools already in an active war
            const { data: rivalWar } = await supabaseAdmin
                .from('wars')
                .select('id')
                .or(`challenger_school_id.eq.${rival.school_id},defender_school_id.eq.${rival.school_id}`)
                .eq('status', 'active')
                .maybeSingle();
            if (rivalWar) continue;

            const rivalWeight = await computeSchoolWeight(rival.school_id, rival.id);
            rivalWeights.push({
                schoolId: rival.school_id,
                squadId: rival.id,
                weight: rivalWeight,
                diff: Math.abs(rivalWeight - myWeight),
            });
        }

        if (rivalWeights.length === 0) {
            return NextResponse.json({ error: 'All rival schools are currently in wars. Try again later.' }, { status: 400 });
        }

        // Sort by closest weight match
        rivalWeights.sort((a, b) => a.diff - b.diff);
        const bestMatch = rivalWeights[0];

        // 7. Create the war record
        const { data: war, error: warError } = await supabaseAdmin
            .from('wars')
            .insert({
                challenger_school_id: mySchool.id,
                defender_school_id: bestMatch.schoolId,
                challenger_squad_id: mySquad.id,
                defender_squad_id: bestMatch.squadId,
                challenger_weight: myWeight,
                defender_weight: bestMatch.weight,
                status: 'active',
                ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            })
            .select()
            .single();

        if (warError) throw warError;

        // 8. Get the defender school name for the response
        const { data: defenderSchool } = await supabaseAdmin
            .from('schools')
            .select('name')
            .eq('id', bestMatch.schoolId)
            .single();

        return NextResponse.json({
            success: true,
            war: {
                id: war.id,
                opponent: defenderSchool?.name || 'Unknown Rival',
                myWeight,
                opponentWeight: bestMatch.weight,
                endsAt: war.ends_at,
            }
        });

    } catch (err: any) {
        console.error('[war/declare] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ──────────────────────────────────────────────
// Helper: Compute weight for a school's squad
// ──────────────────────────────────────────────
async function computeSchoolWeight(schoolId: string, squadId: string): Promise<number> {
    // Get squad members
    const { data: members } = await supabaseAdmin
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId);

    if (!members || members.length === 0) return 0;

    // Fetch user metadata for each member
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const memberIds = members.map(m => m.user_id);

    const memberProfiles = usersData.users
        .filter(u => memberIds.includes(u.id))
        .map(u => ({
            classGrade: parseInt(u.user_metadata?.classGrade || '0', 10),
            points: Number(u.user_metadata?.totalPoints || 0),
        }));

    return computeSquadWeight(memberProfiles);
}

// ──────────────────────────────────────────────
// Helper: Human-readable time remaining
// ──────────────────────────────────────────────
function getTimeLeft(endsAt: string): string {
    const ms = new Date(endsAt).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
