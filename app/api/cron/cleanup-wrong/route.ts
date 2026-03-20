import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

// Allow Vercel function to run longer
export const maxDuration = 120; // 2 minutes

export async function GET(req: Request) {
    // Secure the cron job using Vercel's Cron Secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Calculate the timestamp for exactly 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch wrong submissions older than 2 days
        const { data: wrongSubs, error: fetchErr } = await supabaseAdmin
            .from('written_submissions')
            .select('id, submission_path')
            .in('status', ['rejected', 'ai_confirmed_wrong'])
            .lt('created_at', twoDaysAgo);

        if (fetchErr) throw fetchErr;

        if (!wrongSubs || wrongSubs.length === 0) {
            return NextResponse.json({ message: 'No old wrong submissions found. DB is clean.' });
        }

        const idsToDelete: string[] = [];
        const storagePathsToDelete: string[] = [];
        const aiReviewPathsToDelete: string[] = [];

        for (const sub of wrongSubs) {
            idsToDelete.push(sub.id);
            if (sub.submission_path) {
                storagePathsToDelete.push(sub.submission_path); // Original uploaded image
            }
            aiReviewPathsToDelete.push(`ai-reviews/${sub.id}.json`); // Associated AI review JSON
        }

        // 2. Delete Images from Supabase Storage
        if (storagePathsToDelete.length > 0) {
            const { error: imgDelErr } = await supabaseAdmin.storage
                .from('written-answers')
                .remove(storagePathsToDelete);

            if (imgDelErr) console.error('[CleanupCron] Failed to delete images:', imgDelErr);
        }

        // 3. Delete AI Reviews from Supabase Storage
        if (aiReviewPathsToDelete.length > 0) {
            const { error: aiDelErr } = await supabaseAdmin.storage
                .from('written-answers')
                .remove(aiReviewPathsToDelete);

            if (aiDelErr) console.error('[CleanupCron] Failed to delete AI reviews:', aiDelErr);
        }

        // 4. Delete Database Rows
        // (This completely removes the history from the user's solved page to keep it clean)
        const { error: dbDelErr } = await supabaseAdmin
            .from('written_submissions')
            .delete()
            .in('id', idsToDelete);

        if (dbDelErr) throw dbDelErr;

        return NextResponse.json({
            success: true,
            deletedCount: idsToDelete.length,
            message: `Successfully cleaned up ${idsToDelete.length} wrong submissions to save space.`
        });

    } catch (err: any) {
        console.error('[CleanupCron] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
