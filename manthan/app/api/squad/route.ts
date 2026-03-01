import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userSchoolName = user.user_metadata?.school;

        if (!userSchoolName) {
            return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
        }

        // 1. Get School Info
        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('name', userSchoolName)
            .single();

        if (schoolError || !school) {
            return NextResponse.json({ error: 'School not found in database' }, { status: 404 });
        }

        // 2. Get Squad Data
        let squad = null;
        let members: any[] = [];

        const { data: squadData } = await supabaseAdmin
            .from('squads')
            .select('*')
            .eq('school_id', school.id)
            .single();

        if (squadData) {
            squad = squadData;

            // Fetch Members
            const { data: squadMembers } = await supabaseAdmin
                .from('squad_members')
                .select('*')
                .eq('squad_id', squad.id)
                .order('joined_at', { ascending: true });

            if (squadMembers && squadMembers.length > 0) {
                // Fetch user profiles securely from Admin API
                // To avoid multiple calls, we will list all users and find matches
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
                const authUsers = usersData.users || [];

                members = squadMembers.map((member) => {
                    const u = authUsers.find(au => au.id === member.user_id);
                    return {
                        id: member.id,
                        user_id: member.user_id,
                        name: (u?.user_metadata?.fullName as string) || u?.email?.split('@')[0] || 'Unknown Soldier',
                        points: Number(u?.user_metadata?.totalPoints) || 0,
                        role: member.user_id === squad.general_id ? 'General' : 'Soldier',
                        isMe: member.user_id === user.id
                    };
                }).sort((a, b) => b.points - a.points); // Sort by highest points
            }
        }

        // 3. Get Fake Active Conflicts Data
        // Ideally from a wars table, but returning an empty array to match UI design for now.
        const activeWars: any[] = [];

        // 4. Get Top Schools for Global Standings
        const { data: topSchools } = await supabaseAdmin
            .from('schools')
            .select('id, name, total_war_points')
            .order('total_war_points', { ascending: false })
            .limit(10);

        // Make sure my school is included with its rank if not in top 10
        let schoolLeaderboard = (topSchools || []).map((s, index) => ({
            rank: index + 1,
            id: s.id,
            name: s.name,
            score: s.total_war_points || 0,
            isMe: s.id === school.id
        }));

        if (!schoolLeaderboard.find(s => s.id === school.id)) {
            // Find actual rank (how many schools have more points)
            const { count } = await supabaseAdmin
                .from('schools')
                .select('*', { count: 'exact', head: true })
                .gt('total_war_points', school.total_war_points || 0);

            schoolLeaderboard.push({
                rank: (count || 0) + 1,
                id: school.id,
                name: school.name,
                score: school.total_war_points || 0,
                isMe: true
            });
        }

        return NextResponse.json({
            school: {
                id: school.id,
                name: school.name,
                membersCount: members.length,
                points: school.total_war_points || 0,
            },
            squad,
            members,
            activeWars,
            globalStandings: schoolLeaderboard
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Create a new squad for the user's school
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userSchoolName = user.user_metadata?.school;

        if (!userSchoolName) {
            return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
        }

        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('name', userSchoolName)
            .single();

        if (schoolError || !school) {
            return NextResponse.json({ error: 'School not found in database' }, { status: 404 });
        }

        // Create Squad
        const { data: squadData, error: createError } = await supabaseAdmin
            .from('squads')
            .insert({ school_id: school.id, general_id: user.id })
            .select()
            .single();

        if (createError) {
            if (createError.code === '23505') {
                return NextResponse.json({ error: 'A squad for this school already exists.' }, { status: 400 });
            }
            throw createError;
        }

        // Add General as first member
        await supabaseAdmin
            .from('squad_members')
            .insert({ squad_id: squadData.id, user_id: user.id });

        return NextResponse.json({ success: true, squad: squadData });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
