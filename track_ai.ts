import supabaseAdmin from './lib/supabaseAdmin';

async function run() {
    console.log('Fetching recent AI-reviewed submissions...');
    const { data: submissions, error } = await supabaseAdmin
        .from('written_submissions')
        .select('id, question_id, student_id, status, points_awarded, created_at')
        .or('status.eq.auto_approved,status.eq.ai_confirmed_wrong')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching submissions:', error);
        return;
    }

    if (!submissions?.length) {
        console.log('No recent AI-reviewed submissions found.');
        return;
    }

    for (const sub of submissions) {
        console.log(`\n--- Submission ${sub.id} ---`);
        console.log(`Status: ${sub.status}`);
        console.log(`Date: ${sub.created_at}`);

        const { data: reviewData } = await supabaseAdmin.storage
            .from('written-answers')
            .download(`ai-reviews/${sub.id}.json`);

        if (reviewData) {
            const text = await reviewData.text();
            const review = JSON.parse(text);
            console.log(`AI Verdict: ${review.verdict}`);
            console.log(`AI Breakdown: ${review.breakdown}`);
        } else {
            console.log('AI Review details not found in storage.');
        }
    }
}
run();
