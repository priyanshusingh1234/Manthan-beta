import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Pass ?userId=...' }, { status: 400 });
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
        token_prefix: s.endpoint.substring(0, 30) + '...',
        created_at: s.created_at,
    }));

    return NextResponse.json({
        total: data?.length || 0,
        subscriptions: summary,
    });
}
