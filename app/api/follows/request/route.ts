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
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let followerId: string | undefined;
    let action: 'accept' | 'reject' | undefined;
    try {
        const body = await request.json();
        followerId = body?.followerId;
        action = body?.action;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!followerId || !action) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Delete the request
    const { error: delErr } = await supabaseAdmin
        .from('follow_requests')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', user.id);

    if (delErr) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    if (action === 'accept') {
        // Insert into follows
        const { error: insErr } = await supabaseAdmin
            .from('follows')
            .insert({ follower_id: followerId, following_id: user.id });

        if (insErr && insErr.code !== '23505') {
            return NextResponse.json({ error: 'Failed to accept follow' }, { status: 500 });
        }

        // Notify the follower that their request was accepted
        const myName = user.user_metadata?.fullName || user.user_metadata?.username || 'Someone';
        const myUsername = user.user_metadata?.username || null;
        try {
            await createNotification({
                userId: followerId,
                type: 'new_follower',
                title: `${myName} accepted your follow request`,
                body: `You can now see their private posts and clips.`,
                href: myUsername ? `/user/${myUsername}` : undefined,
                actorId: user.id,
                actorName: myName,
            });
        } catch (e) {}
    }

    return NextResponse.json({ success: true });
}
