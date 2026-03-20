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

// Helper: Ensure Ghost School exists
async function getOrCreateGhostSchool() {
    let { data: ghostSchool } = await supabaseAdmin.from('schools').select('id').eq('name', 'Ghost School').single();
    if (!ghostSchool) {
         const res1 = await supabaseAdmin.from('schools').insert({ name: 'Ghost School' }).select('id').single();
         ghostSchool = res1.data;
    }
    let { data: ghostSquad } = await supabaseAdmin.from('squads').select('id').eq('school_id', ghostSchool.id).single();
    if (!ghostSquad) {
         const res2 = await supabaseAdmin.from('squads').insert({ school_id: ghostSchool.id, general_id: null }).select('id').single();
         ghostSquad = res2.data;
    }
    return { schoolId: ghostSchool.id, squadId: ghostSquad.id };
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

        // Auto-match ghost school and update states if needed
        let updatedWars = [];
        const now = Date.now();

        for (let w of (wars || [])) {
            let updated = { ...w };

            // 1. If searching for > 10 mins, match with ghost school
            if (updated.status === 'searching' && updated.challenger_school_id === schoolId) {
                const searchTime = new Date(updated.declared_at).getTime();
                if (now - searchTime > 10 * 60 * 1000) { // 10 minutes wait
                    const ghost = await getOrCreateGhostSchool();
                    const newStatus = 'preparation';
                    const newDeclaredAt = new Date().toISOString();
                    const newEndsAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins total (10 prep + 5 active)

                    await supabaseAdmin.from('wars').update({
                        defender_school_id: ghost.schoolId,
                        defender_squad_id: ghost.squadId,
                        defender_weight: updated.challenger_weight, 
                        status: newStatus,
                        declared_at: newDeclaredAt,
                        ends_at: newEndsAt
                    }).eq('id', updated.id);

                    updated.defender_school_id = ghost.schoolId;
                    updated.defender_squad_id = ghost.squadId;
                    updated.status = newStatus;
                    updated.declared_at = newDeclaredAt;
                    updated.ends_at = newEndsAt;
                }
            }

            // 2. If preparation, check if 10 mins passed -> move to active
            if (updated.status === 'preparation') {
                const prepStartTime = new Date(updated.declared_at).getTime();
                if (now - prepStartTime > 10 * 60 * 1000) {
                    await supabaseAdmin.from('wars').update({ status: 'active' }).eq('id', updated.id);
                    updated.status = 'active';
                }
            }

            // 3. If active, check if ends_at passed -> move to calculating
            if (updated.status === 'active') {
                const endsAtTime = new Date(updated.ends_at).getTime();
                if (now > endsAtTime) {
                    const calculatingEndsAt = new Date(endsAtTime + 5 * 60 * 1000).toISOString();
                    await supabaseAdmin.from('wars').update({ status: 'calculating', ends_at: calculatingEndsAt }).eq('id', updated.id);
                    updated.status = 'calculating';
                    updated.ends_at = calculatingEndsAt;
                }
            }
            
            // 4. If calculating, check if ends_at passed -> move to completed
            if (updated.status === 'calculating') {
                const endsAtTime = new Date(updated.ends_at).getTime();
                if (now > endsAtTime) {
                    await supabaseAdmin.from('wars').update({ status: 'completed' }).eq('id', updated.id);
                    updated.status = 'completed';
                    continue; // exclude from active list maybe? Or keep so frontend can see it completed
                }
            }
            
            if (updated.status !== 'completed') {
                updatedWars.push(updated);
            }
        }

        // Enrich with school names
        const allSchoolIds = [
            ...new Set(updatedWars.flatMap(w => [w.challenger_school_id, w.defender_school_id]).filter(id => id))
        ];

        let schoolMap: Record<string, string> = {};
        if (allSchoolIds.length > 0) {
            const { data: schoolNames } = await supabaseAdmin
                .from('schools')
                .select('id, name')
                .in('id', allSchoolIds);
            schoolMap = Object.fromEntries((schoolNames || []).map(s => [s.id, s.name]));
        }

        const enriched = updatedWars.map(w => {
            const opponentId = w.challenger_school_id === schoolId ? w.defender_school_id : w.challenger_school_id;
            const opponentName = opponentId ? (schoolMap[opponentId] || 'Unknown') : 'Searching...';

            return {
                ...w,
                challenger_name: schoolMap[w.challenger_school_id] || 'Unknown',
                defender_name: w.defender_school_id ? schoolMap[w.defender_school_id] : null,
                opponent: opponentName,
                isChallenger: w.challenger_school_id === schoolId,
                myScore: w.challenger_school_id === schoolId ? w.challenger_score : w.defender_score,
                opponentScore: w.challenger_school_id === schoolId ? w.defender_score : w.challenger_score,
                timeLeft: getTimeLeft(w.ends_at, w.status, w.declared_at),
            };
        });

        return NextResponse.json({ wars: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/war — Declare war! Search or match immediately with an already searching school.
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userSchoolName = user.user_metadata?.school;
        if (!userSchoolName) return NextResponse.json({ error: 'No school assigned' }, { status: 400 });

        const { data: mySchool } = await supabaseAdmin.from('schools').select('*').eq('name', userSchoolName).single();
        if (!mySchool) return NextResponse.json({ error: 'School not found' }, { status: 404 });

        const { data: mySquad } = await supabaseAdmin.from('squads').select('*').eq('school_id', mySchool.id).single();
        if (!mySquad) return NextResponse.json({ error: 'Your school has no squad. Create one first.' }, { status: 400 });
        if (mySquad.general_id !== user.id) return NextResponse.json({ error: 'Only the General can declare war.' }, { status: 403 });

        // Check if already in active/preparation/searching war
        const { data: existingWar } = await supabaseAdmin
            .from('wars')
            .select('id, status')
            .or(`challenger_school_id.eq.${mySchool.id},defender_school_id.eq.${mySchool.id}`)
            .neq('status', 'completed')
            .single();

        if (existingWar) {
            if (existingWar.status === 'searching') {
                return NextResponse.json({ error: 'Your school is already searching for a war.' }, { status: 400 });
            }
            return NextResponse.json({ error: 'You are already in an active or preparation war!' }, { status: 400 });
        }

        const myWeight = await computeSchoolWeight(mySchool.id, mySquad.id);

        // Find another school currently searching
        const { data: searchingWars, error: searchErr } = await supabaseAdmin
            .from('wars')
            .select('*')
            .eq('status', 'searching')
            .is('defender_school_id', null)
            .neq('challenger_school_id', mySchool.id);

        if (searchErr) throw searchErr;

        if (searchingWars && searchingWars.length > 0) {
            // Found other schools searching -> Match with the closest weight!
            searchingWars.sort((a, b) => Math.abs(a.challenger_weight - myWeight) - Math.abs(b.challenger_weight - myWeight));
            const bestMatch = searchingWars[0];
            
            const matchedTime = Date.now();
            const { data: updatedWar, error: updateError } = await supabaseAdmin
                .from('wars')
                .update({
                    defender_school_id: mySchool.id,
                    defender_squad_id: mySquad.id,
                    defender_weight: myWeight,
                    status: 'preparation',
                    declared_at: new Date(matchedTime).toISOString(),
                    ends_at: new Date(matchedTime + 15 * 60 * 1000).toISOString() // 15 mins format (10 prep + 5 active)
                })
                .eq('id', bestMatch.id)
                .select()
                .single();

            if (updateError) throw updateError;

            const { data: oppSchool } = await supabaseAdmin.from('schools').select('name').eq('id', bestMatch.challenger_school_id).single();

            return NextResponse.json({
                success: true,
                message: 'Match found!',
                war: {
                    id: bestMatch.id,
                    opponent: oppSchool?.name || 'Unknown',
                    status: 'preparation',
                    myWeight,
                    opponentWeight: bestMatch.challenger_weight,
                    endsAt: updatedWar.ends_at,
                }
            });
        }

        // NO OTHER school searching -> Start a new search
        const { data: newWar, error: warError } = await supabaseAdmin
            .from('wars')
            .insert({
                challenger_school_id: mySchool.id,
                defender_school_id: null,
                challenger_squad_id: mySquad.id,
                defender_squad_id: null,
                challenger_weight: myWeight,
                defender_weight: null,
                status: 'searching',
                war_format: 1, // allowing 1v1 for now per instructions
                ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // timeout time just to visually show for search phase
            })
            .select()
            .single();

        if (warError) throw warError;

        return NextResponse.json({
            success: true,
            message: 'Started search for opponent. It may take up to 10 minutes.',
            war: {
                id: newWar.id,
                status: 'searching'
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
    const { data: members } = await supabaseAdmin
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId);

    if (!members || members.length === 0) return 0;

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
function getTimeLeft(endsAt: string, status: string, declaredAt?: string): string {
    const ms = new Date(endsAt).getTime() - Date.now();
    if (ms <= 0 && status !== 'searching') return 'Ended';

    if (status === 'searching' && declaredAt) {
        // Counting up since searching started, or counting down to 10 min
        const searchMs = (new Date(declaredAt).getTime() + 10 * 60 * 1000) - Date.now();
        if (searchMs <= 0) return 'Matching...';
        const m = Math.floor(searchMs / 60000);
        const s = Math.floor((searchMs % 60000) / 1000);
        return `${m}m ${s}s`;
    }

    if (status === 'preparation' && declaredAt) {
        const prepMs = (new Date(declaredAt).getTime() + 10 * 60 * 1000) - Date.now();
        if (prepMs <= 0) return 'Starting...';
        const m = Math.floor(prepMs / 60000);
        const s = Math.floor((prepMs % 60000) / 1000);
        return `${m}m ${s}s`;
    }

    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h === 0) return `${m}m ${s}s`;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
