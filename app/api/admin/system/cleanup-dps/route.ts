import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        console.log('Searching for any variation of "Dony Polo" or "DPS"...');
        const { data: schools, error: schoolErr } = await supabaseAdmin
            .from('schools')
            .select('*')
            .or('name.ilike.%dony%,name.ilike.%polo%,name.ilike.%dps%');

        if (schoolErr) throw schoolErr;
        if (!schools || schools.length === 0) {
            return NextResponse.json({ message: 'No matching schools found.' });
        }

        const reports: any[] = [];

        for (const school of schools) {
            const report: any = { name: school.name, steps: [] };
            
            // Find all members
            const { data: members } = await supabaseAdmin
                .from('school_members')
                .select('user_id')
                .eq('school_id', school.id);
            const memberIds = (members || []).map(m => m.user_id);
            report.members_found = memberIds.length;

            const { data: squad } = await supabaseAdmin.from('squads').select('id').eq('school_id', school.id).maybeSingle();

            // --- DEEP CLEAN WARS ---
            // Find all wars involving this school
            const { data: relatedWars } = await supabaseAdmin
                .from('wars')
                .select('id')
                .or(`challenger_school_id.eq.${school.id},defender_school_id.eq.${school.id}`);
            
            const warIds = (relatedWars || []).map(w => w.id);
            if (warIds.length > 0) {
                // Delete submissions for these wars
                const { error: ew1 } = await supabaseAdmin.from('war_submissions').delete().in('war_id', warIds);
                report.steps.push({ step: 'war_submissions', error: ew1?.message || null });
                
                // Delete rosters for these wars
                const { error: ew2 } = await supabaseAdmin.from('war_rosters').delete().in('war_id', warIds);
                report.steps.push({ step: 'war_rosters', error: ew2?.message || null });
                
                // Delete wars
                const { error: ew3 } = await supabaseAdmin.from('wars').delete().in('id', warIds);
                report.steps.push({ step: 'wars', error: ew3?.message || null });
            }
            
            // 1. Delete requests
            const { error: e1 } = await supabaseAdmin.from('school_join_requests').delete().eq('school_id', school.id);
            report.steps.push({ step: 'join_requests', error: e1?.message || null });

            // 2. Delete squad members
            if (squad) {
                const { error: e2 } = await supabaseAdmin.from('squad_members').delete().eq('squad_id', squad.id);
                report.steps.push({ step: 'squad_members', error: e2?.message || null });
                
                const { error: e3 } = await supabaseAdmin.from('squads').delete().eq('id', squad.id);
                report.steps.push({ step: 'squad', error: e3?.message || null });
            }

            // 3. Delete school members
            const { error: e4 } = await supabaseAdmin.from('school_members').delete().eq('school_id', school.id);
            report.steps.push({ step: 'school_members', error: e4?.message || null });

            // 4. Update metadata and profiles
            if (memberIds.length > 0) {
                for (const mId of memberIds) {
                    try {
                        const { data: mUser } = await supabaseAdmin.auth.admin.getUserById(mId);
                        if (mUser?.user?.user_metadata) {
                            const newMeta = { ...mUser.user.user_metadata };
                            delete newMeta.school;
                            delete newMeta.school_id;
                            delete newMeta.schoolName;
                            await supabaseAdmin.auth.admin.updateUserById(mId, { user_metadata: newMeta });
                        }
                        await supabaseAdmin.from('profiles').update({ school: null, school_id: null }).eq('id', mId);
                    } catch (e: any) {
                        console.error(`Metadata fail for ${mId}`, e.message);
                    }
                }
            }

            // 5. FINALLY delete the school
            const { error: e5 } = await supabaseAdmin.from('schools').delete().eq('id', school.id);
            report.steps.push({ step: 'school_delete', error: e5?.message || null });

            reports.push(report);
        }

        return NextResponse.json({ success: true, reports });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
