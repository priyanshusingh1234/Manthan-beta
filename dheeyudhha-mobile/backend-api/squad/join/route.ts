import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
const SQUAD_MEMBER_CAP = 30;

// GET /api/squad/join?squad=<squadId>
// Returns public info about the squad so the invite page can render it
export async function GET(req: NextRequest) {
    try {
        const squadId = req.nextUrl.searchParams.get('squad');
        if (!squadId) return NextResponse.json({ error: 'Missing squad ID' }, { status: 400 });

        const { data: squad, error } = await supabaseAdmin
            .from('squads')
            .select('id, general_id, school_id')
            .eq('id', squadId)
            .single();

        if (error || !squad) {
            return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
        }

        const { data: school } = await supabaseAdmin
            .from('schools')
            .select('id, name, total_war_points')
            .eq('id', squad.school_id)
            .single();

        // Get member count
        const { count: memberCount } = await supabaseAdmin
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', squadId);

        // Get General's name
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const general = usersData.users.find(u => u.id === squad.general_id);

        return NextResponse.json({
            squad: {
                id: squad.id,
                generalName: general?.user_metadata?.fullName || general?.email?.split('@')[0] || 'The General',
                memberCount: memberCount || 0,
            },
            school: {
                name: school?.name || 'Unknown School',
                points: school?.total_war_points || 0,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/squad/join
// Body: { squadId }
// Authenticated user joins the squad, their school is changed to match
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { squadId } = body;
        if (!squadId) return NextResponse.json({ error: 'Missing squadId' }, { status: 400 });

        // 1. Get squad details
        const { data: squad, error: squadError } = await supabaseAdmin
            .from('squads')
            .select('id, general_id, school_id')
            .eq('id', squadId)
            .single();

        if (squadError || !squad) {
            return NextResponse.json({ error: 'Squad not found or disbanded.' }, { status: 404 });
        }

        // 2. Get school name
        const { data: school } = await supabaseAdmin
            .from('schools')
            .select('id, name')
            .eq('id', squad.school_id)
            .single();

        if (!school) {
            return NextResponse.json({ error: 'School linked to this squad no longer exists.' }, { status: 404 });
        }

        // 3. Check if the user is already in THIS squad
        const { data: existingMembership } = await supabaseAdmin
            .from('squad_members')
            .select('id, squad_id')
            .eq('user_id', user.id)
            .single();

        if (existingMembership) {
            if (existingMembership.squad_id === squadId) {
                return NextResponse.json({ error: 'You are already in this squad!' }, { status: 400 });
            }
            // If they're in a different squad, remove them first (poaching!)
            await supabaseAdmin
                .from('squad_members')
                .delete()
                .eq('user_id', user.id);
        }

        // 4. Add user to squad_members
        const { count: currentCount } = await supabaseAdmin
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', squadId);

        if ((currentCount || 0) >= SQUAD_MEMBER_CAP) {
            return NextResponse.json({ error: `This squad is full (${SQUAD_MEMBER_CAP}/${SQUAD_MEMBER_CAP}). Cannot join.` }, { status: 400 });
        }

        const { error: joinError } = await supabaseAdmin
            .from('squad_members')
            .insert({ squad_id: squadId, user_id: user.id });

        if (joinError) {
            if (joinError.message.includes('Squad already has 50 members') || joinError.message.includes('Squad already has 30 members')) {
                return NextResponse.json({ error: `This squad is full (${SQUAD_MEMBER_CAP}/${SQUAD_MEMBER_CAP}). Cannot join.` }, { status: 400 });
            }
            throw joinError;
        }

        // 5. Update user's school in auth.users metadata (The Poaching!)
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                school: school.name,
                school_id: school.id,
            }
        });

        return NextResponse.json({
            success: true,
            message: `You have joined ${school.name}'s squad!`,
            schoolName: school.name
        });
    } catch (err: any) {
        console.error('[squad/join] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
