// hunter-audit.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const email = 'z3xvikashsingh@gmail.com';
    console.log(`🎯 Hunting for Scholar: ${email}...`);

    // 1. Get User ID from Auth
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
        console.error("❌ Auth Scan Failed:", authErr.message);
        return;
    }

    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
        console.error("❌ Target scholar not found in records.");
        return;
    }

    const userId = user.id;
    console.log(`Found ID: ${userId}`);

    // 2. Audit the Profile
    const { data: u, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileErr) {
        console.error("❌ Profile Audit Failed:", profileErr.message);
        return;
    }

    console.log("\n--- 🔥 TARGET STREAK REPORT ---");
    console.log(`Scholar Name:  ${u.full_name} (@${u.username})`);
    console.log(`Streak Count:  ${u.streak_count}`);
    console.log(`Last Streak:   ${u.last_streak_at}`);
    console.log(`Daily Solved:  ${u.daily_solved}`);
    console.log(`✨ Total Pts:  ${u.total_points}`);
    console.log(`⏰ Updated:    ${u.updated_at}`);
    console.log("-------------------------------\n");

    // 3. Inspect recent attempts
    const { data: attempts } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(3);

    console.log("Recent Attempts:");
    if (attempts && attempts.length > 0) {
        attempts.forEach(a => {
            console.log(`- Q: ${a.question_id} | Correct: ${a.is_correct} | Date: ${a.submitted_at}`);
        });
    } else {
        console.log("- No attempts found.");
    }
}

run();
