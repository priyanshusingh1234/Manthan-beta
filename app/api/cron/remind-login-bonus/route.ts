import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        // Secure it with a cron secret
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
            return new Response('Unauthorized', { status: 401 });
        }

        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const todayStr = nowIST.toISOString().slice(0, 10);

        // Fetch users who have NOT completed the 7-day bonus
        // AND have not claimed it today
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, login_bonus_day, last_login_claim_date, login_bonus_completed')
            .eq('login_bonus_completed', false)
            // .neq('last_login_claim_date', todayStr) // This doesn't handle null well in all cases, so we filter in JS to be safe, or use is.null or neq
            .limit(1000); // Batch limit for safety

        if (error || !profiles) {
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
        }

        const pendingUsers = profiles.filter(p => p.last_login_claim_date !== todayStr);

        let sentCount = 0;
        const promises = pendingUsers.map(async (p) => {
            const nextDay = (p.login_bonus_day || 0) + 1;
            const reward = nextDay === 7 ? 'the Pioneer Badge 🏆' : `${nextDay * 5} points 🪙`;
            
            await createNotification({
                userId: p.id,
                type: 'system',
                title: '🎁 Daily Bonus Ready!',
                body: `Don't break your streak! Claim ${reward} today in your Daily Bonus window.`,
                href: '/',
            });
            sentCount++;
        });

        await Promise.allSettled(promises);

        return NextResponse.json({ success: true, notified: sentCount });

    } catch (err: any) {
        console.error('[cron/remind-login-bonus] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
