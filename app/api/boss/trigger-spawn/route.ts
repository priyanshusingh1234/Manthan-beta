import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

// Let the function run longer just in case, but multicast is extremely fast
export const maxDuration = 60; 

export async function POST(req: Request) {
    // Check for Vercel's secret or our own custom secret
    const EXPECTED_SECRET = process.env.CRON_SECRET || process.env.SUPABASE_CRON_SECRET;
    
    if (!EXPECTED_SECRET) {
        return NextResponse.json({ error: 'Server missing SUPABASE_CRON_SECRET configuration' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || authHeader;
    
    if (token !== EXPECTED_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all native FCM tokens from the database. 
        // We know they are Android/iOS tokens because p256dh_key is set to 'native'.
        const { data: subs, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint')
            .eq('p256dh_key', 'native')
            .not('endpoint', 'is', null);

        if (error || !subs) {
            console.error('[Boss Trigger] Error fetching tokens:', error);
            return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
        }

        const tokens = subs.map(sub => sub.endpoint).filter(Boolean);

        if (tokens.length === 0) {
            return NextResponse.json({ success: true, message: 'No devices to notify.' });
        }

        // Firebase Admin multicast allows up to 500 tokens per batch. 
        // We will chunk the array into sizes of 500 to be perfectly safe.
        const BATCH_SIZE = 500;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const batchTokens = tokens.slice(i, i + BATCH_SIZE);
            
            const message = {
                tokens: batchTokens,
                notification: {
                    title: '💀 The Boss Has Arrived!',
                    body: 'Enter the lair and fight the daily boss! You only have one attempt.'
                },
                data: {
                    // For Android to know what happens when they click the notification
                    url: '/boss'
                },
                android: {
                    priority: 'high' as const,
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        }
                    }
                }
            };

            const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
            successCount += response.successCount;
            failureCount += response.failureCount;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Boss notifications blasted! Success: ${successCount}, Failed: ${failureCount}` 
        });

    } catch (err: any) {
        console.error('[Boss Trigger] Critical error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
