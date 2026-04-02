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

        // Verify user is the General
        const { data: squadData } = await supabaseAdmin
            .from('squads')
            .select('id, school_id')
            .eq('general_id', user.id)
            .maybeSingle();

        if (!squadData) {
            return NextResponse.json({ error: 'Only the General can disband the faction.' }, { status: 403 });
        }

        // Delete dependencies first (cascade should normally handle this if foreign keys are setup, but we do it manually to be safe)
        await Promise.all([
            // deletes requests
            supabaseAdmin.from('school_join_requests').delete().eq('school_id', squadData.school_id),
            // deletes squad members
            supabaseAdmin.from('squad_members').delete().eq('squad_id', squadData.id),
            // deletes school members
            supabaseAdmin.from('school_members').delete().eq('school_id', squadData.school_id)
        ]);

        // Delete Squad
        await supabaseAdmin.from('squads').delete().eq('id', squadData.id);
        
        // Delete School
        await supabaseAdmin.from('schools').delete().eq('id', squadData.school_id);

        // Update general's metadata
        const { data: reqUserData } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (reqUserData?.user?.user_metadata) {
            const newMeta = { ...reqUserData.user.user_metadata };
            delete newMeta.school;
            delete newMeta.school_id;
            
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: newMeta
            });
        }

        // --- THE FIX: Clear profiles for ALL members of this school ---
        await supabaseAdmin.from('profiles').update({
            school: null,
            school_id: null
        }).eq('school_id', squadData.school_id);

        return NextResponse.json({ success: true, message: 'Faction permanently disbanded.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
