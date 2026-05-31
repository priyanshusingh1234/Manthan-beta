import supabaseAdmin from "@/lib/supabaseAdmin";
import { upsertProfile } from "@/lib/profiles";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// POST /api/schools/join — request to join or approve/reject a request
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, schoolId, requestId, userId } = body;
        // action: 'request' | 'approve' | 'reject'

        if (action === 'request') {
            // Prevent teachers from joining schools
            if (user.user_metadata?.isTeacher) {
                return NextResponse.json({ error: 'Teachers cannot join schools.' }, { status: 403 });
            }
            // Student requests to join a school
            const { data: existingMember } = await supabaseAdmin
                .from('school_members')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            if (existingMember) return NextResponse.json({ error: 'You already belong to a school. Leave first.' }, { status: 400 });

            const { data: existingReq } = await supabaseAdmin
                .from('school_join_requests')
                .select('id, status')
                .eq('school_id', schoolId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingReq) {
                if (existingReq.status === 'pending') return NextResponse.json({ error: 'You already have a pending request for this school.' }, { status: 400 });
                if (existingReq.status === 'approved') return NextResponse.json({ error: 'You are already in this school.' }, { status: 400 });
                // If rejected, allow re-request
                await supabaseAdmin
                    .from('school_join_requests')
                    .update({ status: 'pending', requested_at: new Date().toISOString(), reviewed_at: null })
                    .eq('id', existingReq.id);
                return NextResponse.json({ success: true, message: 'Request re-sent!' });
            }

            const { error: insertError } = await supabaseAdmin
                .from('school_join_requests')
                .insert({ school_id: schoolId, user_id: user.id, status: 'pending' });

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, message: 'Join request sent! Await the General\'s approval.' });
        }

        if (action === 'approve' || action === 'reject') {
            // General approves or rejects a request
            // Verify the user is the General of this school
            const { data: squadData } = await supabaseAdmin
                .from('squads')
                .select('id, general_id, school_id')
                .eq('general_id', user.id)
                .maybeSingle();

            if (!squadData) return NextResponse.json({ error: 'Only the General can review requests.' }, { status: 403 });

            // Get the request
            const { data: joinRequest, error: reqError } = await supabaseAdmin
                .from('school_join_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (reqError || !joinRequest) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
            if (joinRequest.school_id !== squadData.school_id) return NextResponse.json({ error: 'This request is not for your school.' }, { status: 403 });

            // Update request status
            await supabaseAdmin
                .from('school_join_requests')
                .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() })
                .eq('id', requestId);

            if (action === 'approve') {
                // Remove from any other school first
                await supabaseAdmin.from('school_members').delete().eq('user_id', joinRequest.user_id);
                await supabaseAdmin.from('squad_members').delete().eq('user_id', joinRequest.user_id);

                // Add to school_members
                await supabaseAdmin
                    .from('school_members')
                    .insert({ school_id: joinRequest.school_id, user_id: joinRequest.user_id, is_general: false });

                // Add to squad_members
                await supabaseAdmin
                    .from('squad_members')
                    .insert({ squad_id: squadData.id, user_id: joinRequest.user_id });

                // Update user metadata
                const { data: schData } = await supabaseAdmin
                    .from('schools')
                    .select('id, name')
                    .eq('id', joinRequest.school_id)
                    .single();

                if (schData) {
                    const { data: reqUserData } = await supabaseAdmin.auth.admin.getUserById(joinRequest.user_id);
                    const updatedMeta = {
                        ...reqUserData?.user?.user_metadata,
                        school: schData.name,
                        school_id: schData.id,
                    };

                    await supabaseAdmin.auth.admin.updateUserById(joinRequest.user_id, {
                        user_metadata: updatedMeta,
                    });

                    // CRITICAL FIX: Keep profiles table in sync
                    await upsertProfile(joinRequest.user_id, updatedMeta, true);
                }
                return NextResponse.json({ success: true, message: 'Student approved and added to school!' });
            }

            return NextResponse.json({ success: true, message: 'Request rejected.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/schools/join?school_id=<id> — get pending requests for a school (General only)
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const schoolId = req.nextUrl.searchParams.get('school_id');

        // Verify user is the General
        const { data: squadData } = await supabaseAdmin
            .from('squads')
            .select('general_id, school_id')
            .eq('general_id', user.id)
            .maybeSingle();

        if (!squadData || (schoolId && squadData.school_id !== schoolId)) {
            return NextResponse.json({ error: 'Only the General can view requests.' }, { status: 403 });
        }

        const { data: requests } = await supabaseAdmin
            .from('school_join_requests')
            .select('*')
            .eq('school_id', squadData.school_id)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });

        // Enrich with user info
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

        const enriched = (requests || []).map(r => {
            const u = usersData.users.find(au => au.id === r.user_id);
            return {
                id: r.id,
                userId: r.user_id,
                name: u?.user_metadata?.fullName || u?.email?.split('@')[0] || 'Unknown',
                username: u?.user_metadata?.username || '',
                points: Number(u?.user_metadata?.totalPoints) || 0,
                classGrade: u?.user_metadata?.classGrade || 'N/A',
                requestedAt: r.requested_at,
            };
        });

        return NextResponse.json({ requests: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
