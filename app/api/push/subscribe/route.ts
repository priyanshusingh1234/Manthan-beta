import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subscription, userId } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Upsert the subscription using the endpoint as the unique identifier
        // so a browser doesn't duplicate its entry if it re-subscribes
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                auth_key: subscription.keys.auth,
                p256dh_key: subscription.keys.p256dh,
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('[WebPush Subscribe] Database error:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    } catch (e: any) {
        console.error('[WebPush Subscribe] Exception:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
