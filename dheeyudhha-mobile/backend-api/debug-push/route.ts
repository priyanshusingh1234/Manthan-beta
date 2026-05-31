import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const url = new URL(req.url);
    let userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');

    if (!userId && username) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();
        userId = profile?.id || null;
    }

    if (!userId) {
        return NextResponse.json({ error: 'Pass ?userId=... or ?username=...' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('endpoint, p256dh_key, auth_key, created_at')
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const summary = (data || []).map((s: any) => ({
        type: s.p256dh_key === 'native' ? 'NATIVE (FCM)' : 'WEB',
        token_prefix: s.endpoint.substring(0, 40) + '...',
        created_at: s.created_at,
    }));

    return NextResponse.json({
        userId,
        total: data?.length || 0,
        subscriptions: summary,
    });
}

// Manual token registration — call via POST with { userId, token }
export async function POST(req: Request) {
    try {
        const { userId, token } = await req.json();
        if (!userId || !token) {
            return NextResponse.json({ error: 'Need userId and token' }, { status: 400 });
        }

        // Delete old native tokens for this user
        await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('p256dh_key', 'native');

        // Insert new token
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: token,
                auth_key: 'native',
                p256dh_key: 'native',
            }, { onConflict: 'endpoint' });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Token registered manually' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
