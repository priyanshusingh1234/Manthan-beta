const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('\n=== ALL rows in test_results ===');
    const { data, error } = await supabase
        .from('test_results')
        .select('id, user_id, test_id, score, max_score, accuracy, completed_at')
        .order('completed_at', { ascending: false });

    if (error) { console.error('❌', error.message); return; }
    console.log(`Total rows: ${data.length}`);
    data.forEach((r, i) => {
        console.log(`\n[${i+1}] user_id: ${r.user_id}`);
        console.log(`     test_id: ${r.test_id}`);
        console.log(`     score: ${r.score}/${r.max_score} (${r.accuracy}%)`);
        console.log(`     at: ${r.completed_at}`);
    });

    console.log('\n=== ALL users in profiles ===');
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, email')
        .in('id', userIds);
    profiles?.forEach(p => {
        console.log(`  ${p.id} → ${p.full_name || p.username} (${p.email || 'no email'})`);
    });

    console.log('\n=== Unique test_ids ===');
    const uniqueTests = [...new Set(data.map(r => r.test_id))];
    console.log(uniqueTests);
}

diagnose().catch(console.error);
