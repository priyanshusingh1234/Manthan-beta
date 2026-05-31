import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Fetch all scholars
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id');

        if (profileError) throw profileError;

        console.log(`[Admin Broadcast] Sending push to ${profiles.length} scholars...`);

        // Send notifications using the official engine (which triggers FCM)
        // We use Promise.allSettled to not block on individual failures
        await Promise.allSettled(
            profiles.map(p => 
                createNotification({
                    userId: p.id,
                    type: 'coop_challenge',
                    title: '⚔️ Shadow Battle Commenced!',
                    body: 'A mysterious user has appeared. Find him, solve the riddle, and comment for 500 pts!',
                    href: '/',
                })
            )
        );

        return NextResponse.json({ success: true, message: `Push sent to ${profiles.length} scholars.` });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
