import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';
// Allow Vercel function to run longer
export const maxDuration = 120; // 2 minutes

export async function GET(req: Request) {
    // Secure the cron job using Vercel's Cron Secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = {
            cleanup: { deletedCount: 0, message: '' },
            reminders: { notified: 0, message: '' }
        };

        // ==========================================
        // TASK 1: CLEANUP WRONG SUBMISSIONS
        // ==========================================
        try {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            const { data: wrongSubs, error: fetchErr } = await supabaseAdmin
                .from('written_submissions')
                .select('id, submission_path')
                .in('status', ['rejected', 'ai_confirmed_wrong'])
                .lt('created_at', twoDaysAgo);

            if (!fetchErr && wrongSubs && wrongSubs.length > 0) {
                const idsToDelete: string[] = [];
                const storagePathsToDelete: string[] = [];
                const aiReviewPathsToDelete: string[] = [];

                for (const sub of wrongSubs) {
                    idsToDelete.push(sub.id);
                    if (sub.submission_path) storagePathsToDelete.push(sub.submission_path);
                    aiReviewPathsToDelete.push(`ai-reviews/${sub.id}.json`);
                }

                if (storagePathsToDelete.length > 0) {
                    await supabaseAdmin.storage.from('written-answers').remove(storagePathsToDelete);
                }
                if (aiReviewPathsToDelete.length > 0) {
                    await supabaseAdmin.storage.from('written-answers').remove(aiReviewPathsToDelete);
                }
                const { error: dbDelErr } = await supabaseAdmin
                    .from('written_submissions')
                    .delete()
                    .in('id', idsToDelete);

                if (!dbDelErr) {
                    results.cleanup.deletedCount = idsToDelete.length;
                    results.cleanup.message = `Successfully cleaned up ${idsToDelete.length} wrong submissions.`;
                } else {
                    results.cleanup.message = `Failed to delete from DB: ${dbDelErr.message}`;
                }
            } else {
                results.cleanup.message = 'No old wrong submissions found. DB is clean.';
            }
        } catch (e: any) {
            results.cleanup.message = `Error: ${e.message}`;
        }

        // ==========================================
        // TASK 2: SEND 7-DAY LOGIN BONUS REMINDERS
        // ==========================================
        try {
            const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
            const todayStr = nowIST.toISOString().slice(0, 10);

            const { data: profiles, error } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, login_bonus_day, last_login_claim_date, login_bonus_completed')
                .eq('login_bonus_completed', false)
                .limit(1000);

            if (!error && profiles) {
                const pendingUsers = profiles.filter(p => p.last_login_claim_date !== todayStr);
                let sentCount = 0;
                
                const promises = pendingUsers.map(async (p) => {
                    const nextDay = (p.login_bonus_day || 0) + 1;
                    const reward = nextDay === 7 ? 'the Pioneer Badge 🏆' : `${nextDay * 5} points 🪙`;
                    
                    await createNotification({
                        userId: p.id,
                        type: 'points_earned',
                        title: '🎁 Daily Bonus Ready!',
                        body: `Don't break your streak! Claim ${reward} today in your Daily Bonus window.`,
                        href: '/',
                    });
                    sentCount++;
                });

                await Promise.allSettled(promises);
                results.reminders.notified = sentCount;
                results.reminders.message = `Sent reminders to ${sentCount} users.`;
            } else {
                results.reminders.message = `Error fetching profiles: ${error?.message}`;
            }
        } catch (e: any) {
            results.reminders.message = `Error: ${e.message}`;
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error('[Cron/Daily] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
