import supabaseAdmin from "@/lib/supabaseAdmin";
import { getProfile, upsertProfile } from "@/lib/profiles";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Schools feature is enabled.
const PAUSED = false;
const pausedResponse = () => NextResponse.json(
    { error: 'Schools feature is temporarily unavailable. Check back soon!', paused: true },
    { status: 503, headers: { 'Retry-After': '3600' } }
);

const BANNED_WORDS = ['sex', 'porn', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'slut'];


const normalizeSchoolName = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, ' ');

// GET /api/schools — list all schools with member count, general info, war stats
export async function GET(req: NextRequest) {
    if (PAUSED) return pausedResponse();
    try {
        const search = req.nextUrl.searchParams.get('search') || '';

        let query = supabaseAdmin
            .from('schools')
            .select('id, name, total_war_points, created_at, is_private')
            .neq('name', 'Ghost School')
            .order('total_war_points', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: schools, error } = await query.limit(50);
        if (error) throw error;

        // For each school: count members, get general name, count active wars
        const enriched = await Promise.all((schools || []).map(async (school, index) => {
            // General info and Squad info
            const { data: squadData } = await supabaseAdmin
                .from('squads')
                .select('id, general_id')
                .eq('school_id', school.id)
                .maybeSingle();

            // Member count
            let memberCount = 0;
            if (squadData) {
                const { count } = await supabaseAdmin
                    .from('squad_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('squad_id', squadData.id);
                memberCount = count || 0;
            }

            let generalName = null;
            if (squadData?.general_id) {
                const profile = await getProfile(squadData.general_id);
                generalName = profile?.full_name || null;
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
                memberCount: memberCount,
                generalName,
                hasSquad: !!squadData,
                activeWars: warCount || 0,
                createdAt: school.created_at,
                isPrivate: school.is_private || false,
            };
        }));

        return NextResponse.json({ schools: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/schools — create a new school (and become its General)
export async function POST(req: NextRequest) {
    if (PAUSED) return pausedResponse();
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, isPrivate = false } = body;
        if (!name?.trim()) return NextResponse.json({ error: 'School name is required' }, { status: 400 });

        const cleanedName = name.trim().replace(/\s+/g, ' ');
        const normalizedName = normalizeSchoolName(cleanedName);

        if (cleanedName.length < 3) {
            return NextResponse.json({ error: 'School name must be at least 3 characters.' }, { status: 400 });
        }

        if (cleanedName.length > 90) {
            return NextResponse.json({ error: 'School name must be under 90 characters.' }, { status: 400 });
        }

        // Profanity Check
        const hasProfanity = BANNED_WORDS.some(word => cleanedName.toLowerCase().includes(word));
        if (hasProfanity) {
            return NextResponse.json({ error: 'Inappropriate school name. Please choose another name.' }, { status: 400 });
        }

        // Check exact case-insensitive duplicate first (fast path)
        const { data: existing } = await supabaseAdmin
            .from('schools')
            .select('id, name')
            .ilike('name', cleanedName)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'A school with this name already exists. Search and request to join instead.' }, { status: 400 });
        }

        // Check normalized duplicate to avoid spacing/casing bypass
        const { data: samePrefixSchools, error: samePrefixError } = await supabaseAdmin
            .from('schools')
            .select('id, name')
            .ilike('name', `${cleanedName.split(' ')[0]}%`)
            .limit(200);

        if (samePrefixError) throw samePrefixError;

        const normalizedDuplicate = (samePrefixSchools || []).find(
            (school) => normalizeSchoolName(school.name || '') === normalizedName
        );

        if (normalizedDuplicate) {
            return NextResponse.json({ error: 'A school with this name already exists. If this is the same school, add Branch in the name.' }, { status: 400 });
        }

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
            .insert({ name: cleanedName, is_private: isPrivate })
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
        const updatedMeta = {
            ...user.user_metadata,
            school: school.name,
            school_id: school.id,
            is_general: true,
        };

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: updatedMeta
        });

        // CRITICAL FIX: Keep profiles table in sync for live lookups
        await upsertProfile(user.id, updatedMeta, true);

        return NextResponse.json({ success: true, school, squad });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
