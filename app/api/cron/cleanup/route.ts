import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This route can be called periodically by Vercel Cron or any scheduler
// Define it as a GET request so it can be pinged easily
export async function GET(req: Request) {
    try {
        // Optional: Check for a secret bearer token to prevent abuse
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const now = new Date();
        
        // Calculate the timestamp for 48 hours ago
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
        
        // Calculate the timestamp for 7 days ago (for notifications)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Delete Expired or Rejected Co-op Challenges older than 48 hours
        // We delete them if they were created > 48 hours ago (since they naturally expire after 24h, this gives a 24h grace period to view them)
        const { error: coopError, count: coopDeleted } = await supabaseAdmin
            .from('coop_challenges')
            .delete({ count: 'exact' })
            .in('status', ['expired', 'rejected'])
            .lt('created_at', fortyEightHoursAgo);

        if (coopError) {
            console.error('Failed to clean up coop challenges:', coopError);
            throw coopError;
        }

        // 2. Delete old notifications that are littering the DB (older than 7 days)
        const { error: notifError, count: notifDeleted } = await supabaseAdmin
            .from('notifications')
            .delete({ count: 'exact' })
            .lt('created_at', sevenDaysAgo);

        if (notifError) {
            console.error('Failed to clean up notifications:', notifError);
            throw notifError;
        }

        // 3. Mark 'pending' challenges that passed their expires_at time as 'expired'
        // This is a maintenance step to ensure the database state matches reality
        const { error: expireError, count: expiredCount } = await supabaseAdmin
            .from('coop_challenges')
            .update({ status: 'expired' }, { count: 'exact' })
            .eq('status', 'pending')
            .lt('expires_at', now.toISOString());

        if (expireError) {
            console.error('Failed to update expired challenges:', expireError);
            throw expireError;
        }

        return NextResponse.json({
            success: true,
            summary: {
                deletedCoopChallenges: coopDeleted || 0,
                deletedNotifications: notifDeleted || 0,
                markedAsExpired: expiredCount || 0,
            },
            message: "Database hygiene complete. Trash has been taken out! 🧹"
        });

    } catch (error: any) {
        console.error('Cron Cleanup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
