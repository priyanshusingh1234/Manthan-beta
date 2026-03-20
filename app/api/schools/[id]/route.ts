import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const schoolId = params.id;
        
        if (!schoolId) {
            return NextResponse.json({ error: 'Missing school ID' }, { status: 400 });
        }

        // 1. Get School Info
        const { data: school, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('id', schoolId)
            .single();

        if (schoolError || !school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        // 2. Calculate Rank (Schools with more points)
        const { count } = await supabaseAdmin
            .from('schools')
            .select('*', { count: 'exact', head: true })
            .gt('total_war_points', school.total_war_points || 0);

        const rank = (count || 0) + 1;

        // 3. Get Squad & Members
        let members: any[] = [];
        let generalId = null;

        const { data: squad } = await supabaseAdmin
            .from('squads')
            .select('*')
            .eq('school_id', school.id)
            .maybeSingle();

        if (squad) {
            generalId = squad.general_id;
            
            const { data: squadMembers } = await supabaseAdmin
                .from('squad_members')
                .select('*')
                .eq('squad_id', squad.id);

            if (squadMembers && squadMembers.length > 0) {
                // Fetch profiles using admin API
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
                const authUsers = usersData.users || [];

                members = squadMembers.map((member) => {
                    const u = authUsers.find(au => au.id === member.user_id);
                    return {
                        id: member.user_id,
                        name: (u?.user_metadata?.fullName as string) || u?.email?.split('@')[0] || 'Unknown Soldier',
                        points: Number(u?.user_metadata?.totalPoints) || 0,
                        role: member.user_id === squad.general_id ? 'General' : 'Soldier',
                        classGrade: u?.user_metadata?.classGrade || 'N/A'
                    };
                }).sort((a, b) => b.points - a.points); // Sort by points
            }
        }

        return NextResponse.json({
            school: {
                id: school.id,
                name: school.name,
                points: school.total_war_points || 0,
                rank,
                memberCount: members.length,
                createdAt: school.created_at,
                avatarUrl: school.avatar_url || 'shield',
                description: school.description || '',
            },
            generalId,
            members,
        });

    } catch (error: any) {
        console.error('Public School API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
