import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const BANNED_WORDS = ['sex', 'porn', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'slut'];

const normalizeSchoolName = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, ' ');

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { avatarUrl, description, name } = await req.json();

        if (description && description.split(' ').length > 200) {
            return NextResponse.json({ error: 'Description must be under 200 words.' }, { status: 400 });
        }

        // Verify user is the General
        const { data: squadData } = await supabaseAdmin
            .from('squads')
            .select('school_id')
            .eq('general_id', user.id)
            .maybeSingle();

        if (!squadData) {
            return NextResponse.json({ error: 'Only the General can update school details.' }, { status: 403 });
        }

        // Fetch current school details
        const { data: currentSchool } = await supabaseAdmin
            .from('schools')
            .select('name')
            .eq('id', squadData.school_id)
            .single();

        const updates: any = {};
        let nameChanged = false;

        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
        if (description !== undefined) updates.description = description;

        // Process name update if provided and different
        if (name && typeof name === 'string') {
            const cleanedName = name.trim().replace(/\s+/g, ' ');
            if (cleanedName !== currentSchool?.name) {
                if (cleanedName.length < 3) {
                    return NextResponse.json({ error: 'School name must be at least 3 characters.' }, { status: 400 });
                }
                if (cleanedName.length > 90) {
                    return NextResponse.json({ error: 'School name must be under 90 characters.' }, { status: 400 });
                }

                const hasProfanity = BANNED_WORDS.some(word => cleanedName.toLowerCase().includes(word));
                if (hasProfanity) {
                    return NextResponse.json({ error: 'Inappropriate school name. Please choose another name.' }, { status: 400 });
                }

                // Check for duplicates
                const normalizedName = normalizeSchoolName(cleanedName);
                
                const { data: existingExact } = await supabaseAdmin
                    .from('schools')
                    .select('id, name')
                    .ilike('name', cleanedName)
                    .neq('id', squadData.school_id)
                    .maybeSingle();
                
                if (existingExact) {
                    return NextResponse.json({ error: 'A school with this exact name already exists. Add a branch name.' }, { status: 400 });
                }

                const { data: samePrefixSchools } = await supabaseAdmin
                    .from('schools')
                    .select('id, name')
                    .ilike('name', `${cleanedName.split(' ')[0]}%`)
                    .neq('id', squadData.school_id)
                    .limit(200);

                const normalizedDuplicate = (samePrefixSchools || []).find(
                    (s) => normalizeSchoolName(s.name || '') === normalizedName
                );

                if (normalizedDuplicate) {
                    return NextResponse.json({ error: 'A very similar school name exists. Add a distinct Branch name.' }, { status: 400 });
                }

                updates.name = cleanedName;
                nameChanged = true;
            }
        }

        if (Object.keys(updates).length > 0) {
            await supabaseAdmin
                .from('schools')
                .update(updates)
                .eq('id', squadData.school_id);
            
            // If the name changed, we must sync the `school` string in profiles for all members
            if (nameChanged && currentSchool?.name) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ school: updates.name })
                    .eq('school', currentSchool.name);
            }
        }

        return NextResponse.json({ success: true, message: 'Faction updated successfully.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
