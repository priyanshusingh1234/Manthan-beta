// verify-schema.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("🔍 Scouting Profiles Schema...");
    const { data: columns, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Schema Scan Failed:", error.message);
        return;
    }

    const first = columns[0];
    const fields = Object.keys(first || {});
    
    console.log("Found Fields:", fields.join(', '));
    
    const required = ['streak_count', 'daily_solved', 'last_streak_at'];
    const missing = required.filter(f => !fields.includes(f));

    if (missing.length > 0) {
        console.warn(`🚨 GHOSTS DETECTED! Missing Columns: ${missing.join(', ')}`);
    } else {
        console.log("✅ FOUNDATION IS SOLID. All streak columns present.");
    }
}

run();
