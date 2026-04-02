// user-audit.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("🕵️ Auditor Launching...");

    // Fetch the target scholar (the user)
    // Note: Since I don't have the user ID handy, I'll search for the most recently updated profile.
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (error || !users || users.length === 0) {
        console.error("❌ No scholars found to audit.");
        return;
    }

    const u = users[0];
    console.log(`Scholar: ${u.full_name} (@${u.username})`);
    console.log(`🔥 Streak Count:  ${u.streak_count}`);
    console.log(`📅 Last Streak:   ${u.last_streak_at}`);
    console.log(`📝 Daily Solved:  ${u.daily_solved}`);
    console.log(`✨ Total Points:  ${u.total_points}`);
    console.log(`⏰ Updated At:    ${u.updated_at}`);
}

run();
