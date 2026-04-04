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

        // Fetch all member IDs before deleting them
        const { data: members } = await supabaseAdmin
            .from('school_members')
            .select('user_id')
            .eq('school_id', squadData.school_id);

        const memberIds = (members || []).map(m => m.user_id);

        // Delete dependencies first
        await Promise.all([
            supabaseAdmin.from('school_join_requests').delete().eq('school_id', squadData.school_id),
            supabaseAdmin.from('squad_members').delete().eq('squad_id', squadData.id),
            supabaseAdmin.from('school_members').delete().eq('school_id', squadData.school_id)
        ]);

        // Delete Squad & School
        await supabaseAdmin.from('squads').delete().eq('id', squadData.id);
        await supabaseAdmin.from('schools').delete().eq('id', squadData.school_id);

        // Update metadata for ALL members to release them from the faction
        if (memberIds.length > 0) {
            await Promise.all(memberIds.map(async (mId) => {
                try {
                    const { data: mUser } = await supabaseAdmin.auth.admin.getUserById(mId);
                    if (mUser?.user?.user_metadata) {
                        const newMeta = { ...mUser.user.user_metadata };
                        delete newMeta.school;
                        delete newMeta.school_id;
                        delete newMeta.schoolName; // Clearing potential legacy keys
                        
                        await supabaseAdmin.auth.admin.updateUserById(mId, {
                            user_metadata: newMeta
                        });
                    }
                } catch (e) {
                    console.error(`Failed to clear metadata for user ${mId}:`, e);
                }
            }));
        }

        // Final sync: clear profiles table for all members
        await supabaseAdmin.from('profiles').update({
            school: null,
            school_id: null
        }).in('id', memberIds);

        return NextResponse.json({ success: true, message: 'Faction permanently disbanded. All members released.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
