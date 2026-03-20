import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { avatarUrl, description } = await req.json();

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

        const updates: any = {};
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length > 0) {
            await supabaseAdmin
                .from('schools')
                .update(updates)
                .eq('id', squadData.school_id);
        }

        return NextResponse.json({ success: true, message: 'Faction updated successfully.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
