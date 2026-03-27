import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { questionId, partnerId, message } = await request.json();

        if (!questionId || !partnerId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (user.id === partnerId) {
            return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
        }

        // Prevent tagging teachers
        const { data: partnerData } = await supabaseAdmin.auth.admin.getUserById(partnerId);
        if (partnerData?.user?.user_metadata?.isTeacher) {
            return NextResponse.json({ error: 'You cannot challenge a teacher' }, { status: 400 });
        }

        // 1. Check if an active challenge already exists for this question by this user
        const { data: existingChallenge, error: existingErr } = await supabaseAdmin
            .from('coop_challenges')
            .select('*')
            .eq('question_id', questionId)
            .eq('initiator_id', user.id)
            .not('status', 'in', '("won","lost","rejected")')
            .single();

        if (existingChallenge) {
            return NextResponse.json({ error: 'You already have an active challenge for this question.' }, { status: 400 });
        }

        // 2. Insert the help request
        const { data: newChallenge, error: insertError } = await supabaseAdmin
            .from('coop_challenges')
            .insert({
                question_id: questionId,
                initiator_id: user.id,
                partner_id: partnerId,
                status: 'pending',
                message: message?.trim() || null
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting help request:', insertError);
            return NextResponse.json({ error: 'Failed to create help request' }, { status: 500 });
        }

        // 3. Send Notification to Partner
        const challengerName = user.user_metadata?.fullName || user.user_metadata?.username || 'Someone';
        const challengerUsername = user.user_metadata?.username || null;

        await createNotification({
            userId: partnerId,
            type: 'coop_challenge',
            title: `Help Request from @${challengerUsername || challengerName}`,
            body: message?.trim()
                ? `@${challengerUsername || challengerName}: "${message.trim()}"`
                : `@${challengerUsername || challengerName} has requested your help on a question.`,
            href: `/questions/${questionId}?challenge=${newChallenge.id}`,
            actorId: user.id,
            actorName: challengerName,
            actorAvatar: user.user_metadata?.avatar_url || null,
        });

        return NextResponse.json({ success: true, challenge: newChallenge });
    } catch (e: any) {
        console.error("Coop Create Error:", e);
        return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
    }
}
