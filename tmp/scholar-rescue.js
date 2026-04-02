// scholar-rescue.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const userId = '7cd4b901-fd07-4d13-8d16-8bcec3293f7f'; // Vikash's ID
    const todayStr = '2026-04-02';

    console.log(`🚀 Rescuing Scholar: ${userId}...`);

    // Force sync profile table
    const { error: pErr } = await supabase
        .from('profiles')
        .update({
            streak_count: 1,
            daily_solved: 3,
            last_streak_at: todayStr
        })
        .eq('id', userId);

    if (pErr) console.error("❌ Profile Rescue Failed:", pErr.message);
    else console.log("   ✅ Profiles Table Synced.");

    // Force sync auth metadata
    const { data: { user }, error: uErr } = await supabase.auth.admin.getUserById(userId);
    if (uErr) {
        console.error("❌ Auth Fetch Failed:", uErr.message);
    } else {
        const meta = user.user_metadata || {};
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...meta,
                streakCount: 1,
                dailySolved: 3,
                lastStreakAt: todayStr
            }
        });
        console.log("   ✅ Auth Metadata Rescued.");
    }

    console.log("🔥 SCHOLAR RESCUE COMPLETE! Vikash Singh is now Level 1 with 3/2 progress.");
    process.exit(0);
}

run();
