import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/broadcast
 * Body: { title, body, href, pinCode }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, text, href, pinCode } = body;

        // Security Check (Simple PIN since we are in dev/rapid phase, or we can check admin email)
        // You can change this '1234' to any secret key.
        if (pinCode !== '8899') {
            return NextResponse.json({ error: 'Unauthorized: Invalid broadcast PIN' }, { status: 401 });
        }

        if (!title || !text) {
            return NextResponse.json({ error: 'Missing title or text' }, { status: 400 });
        }

        // 1. Fetch all user IDs from profiles
        // Note: For huge userbases, this should be paginated or queued.
        // For current scale, a batch fetch is fine.
        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1000); // Guardrails

        if (error) throw error;
        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users found to notify.' });
        }

        console.log(`[Broadcast] Sending to ${users.length} users...`);

        // 2. Fire notifications in parallel (with batching to avoid API rate limits)
        const batchSize = 50;
        let sentCount = 0;

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.all(batch.map(user => 
                createNotification({
                    userId: user.id,
                    type: 'points_earned', // Using an existing type that is harmless, or we can add 'global_announcement'
                    title: title,
                    body: text,
                    href: href || '/',
                })
            ));
            sentCount += batch.length;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully broadcasted to ${sentCount} scholars.`,
            meta: { title, text, href }
        });

    } catch (err: any) {
        console.error('[Broadcast Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
