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

        // Check if user is general
        const { data: squadData } = await supabaseAdmin
            .from('squads')
            .select('general_id')
            .eq('general_id', user.id)
            .maybeSingle();

        if (squadData) {
            return NextResponse.json({ error: 'Generals cannot leave. You must disband the school instead.' }, { status: 403 });
        }

        // Delete from school_members and squad_members
        await Promise.all([
            supabaseAdmin.from('school_members').delete().eq('user_id', user.id),
            supabaseAdmin.from('squad_members').delete().eq('user_id', user.id)
        ]);

        // Update metadata
        const { data: reqUserData } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (reqUserData?.user?.user_metadata) {
            const newMeta = { ...reqUserData.user.user_metadata };
            delete newMeta.school;
            delete newMeta.school_id;
            
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: newMeta
            });
        }

        // --- THE FIX: Also clear the profiles table to prevent ghosting ---
        await supabaseAdmin.from('profiles').update({
            school: null,
            school_id: null
        }).eq('id', user.id);

        return NextResponse.json({ success: true, message: 'You have left the faction.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
