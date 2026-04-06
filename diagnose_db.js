const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    const testId = 'english-voice-hard';

    // Simulate exactly what the leaderboard API does
    const { data: topData, error: topError } = await supabase
        .from('test_results')
        .select('user_id, score, max_score, time_taken, accuracy, completed_at')
        .eq('test_id', testId)
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true })
        .limit(50);

    if (topError) {
        console.error('❌ Leaderboard query error:', topError.message, topError.code);
        return;
    }

    console.log('✅ Rows returned:', topData?.length);

    // Dedupe best per user
    const seenUsers = new Set();
    const bestAttempts = (topData || []).filter(e => {
        if (seenUsers.has(e.user_id)) return false;
        seenUsers.add(e.user_id);
        return true;
    }).slice(0, 10);

    // Fetch profiles
    const userIds = bestAttempts.map(e => e.user_id);
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, school')
        .in('id', userIds);

    const profileMap = {};
    (profilesData || []).forEach(p => { profileMap[p.id] = p; });

    const leaderboard = bestAttempts.map((entry, i) => {
        const profile = profileMap[entry.user_id] || {};
        return {
            rank: i + 1,
            name: profile.full_name || profile.username || 'Scholar',
            score: entry.score,
            maxScore: entry.max_score,
            accuracy: entry.accuracy,
        };
    });

    console.log('Leaderboard:', JSON.stringify(leaderboard, null, 2));
}

test().catch(console.error);
