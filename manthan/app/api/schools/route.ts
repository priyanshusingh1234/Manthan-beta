import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET /api/schools — list all schools with member count, general info, war stats
export async function GET(req: NextRequest) {
    try {
        const search = req.nextUrl.searchParams.get('search') || '';

        let query = supabaseAdmin
            .from('schools')
            .select('id, name, total_war_points, created_at')
            .order('total_war_points', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: schools, error } = await query.limit(50);
        if (error) throw error;

        // For each school: count members, get general name, count active wars
        const enriched = await Promise.all((schools || []).map(async (school, index) => {
            // Member count
            const { count: memberCount } = await supabaseAdmin
                .from('school_members')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', school.id);

            // General info
            const { data: squadData } = await supabaseAdmin
                .from('squads')
                .select('general_id')
                .eq('school_id', school.id)
                .maybeSingle();

            let generalName = null;
            if (squadData?.general_id) {
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
                const general = usersData.users.find(u => u.id === squadData.general_id);
                generalName = general?.user_metadata?.fullName || general?.email?.split('@')[0] || null;
            }

            // Active wars count
            const { count: warCount } = await supabaseAdmin
                .from('wars')
                .select('*', { count: 'exact', head: true })
                .or(`challenger_school_id.eq.${school.id},defender_school_id.eq.${school.id}`)
                .eq('status', 'active');

            return {
                id: school.id,
                name: school.name,
                points: school.total_war_points || 0,
                rank: index + 1,
                memberCount: memberCount || 0,
                generalName,
                hasSquad: !!squadData,
                activeWars: warCount || 0,
                createdAt: school.created_at,
            };
        }));

        return NextResponse.json({ schools: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/schools — create a new school (and become its General)
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name } = body;
        if (!name?.trim()) return NextResponse.json({ error: 'School name is required' }, { status: 400 });

        // Check already exists
        const { data: existing } = await supabaseAdmin
            .from('schools')
            .select('id')
            .ilike('name', name.trim())
            .maybeSingle();
        if (existing) return NextResponse.json({ error: 'A school with this name already exists. Search and request to join instead.' }, { status: 400 });

        // Check user isn't already in a school
        const { data: existingMember } = await supabaseAdmin
            .from('school_members')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        if (existingMember) return NextResponse.json({ error: 'You are already a member of a school.' }, { status: 400 });

        // Create school
        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .insert({ name: name.trim() })
            .select()
            .single();
        if (schoolError) throw schoolError;

        // Become member (as General)
        await supabaseAdmin
            .from('school_members')
            .insert({ school_id: school.id, user_id: user.id, is_general: true });

        // Create the squad
        const { data: squad } = await supabaseAdmin
            .from('squads')
            .insert({ school_id: school.id, general_id: user.id })
            .select()
            .single();

        if (squad) {
            await supabaseAdmin
                .from('squad_members')
                .insert({ squad_id: squad.id, user_id: user.id });
        }

        // Update user metadata with school info
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                school: school.name,
                school_id: school.id,
                is_general: true,
            }
        });

        return NextResponse.json({ success: true, school, squad });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
