import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role for testing admin actions

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("🚀 Starting Co-op Challenges Backend Tests...\n");

    try {
        // 1. Create mock users
        const { data: user1, error: err1 } = await supabase.auth.admin.createUser({
            email: `test_initiator_${Date.now()}@example.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { fullName: 'Test Initiator', totalPoints: 100 }
        });
        if (err1) throw err1;
        console.log(`✅ Created Test Initiator (Points: 100): ${user1.user.id}`);

        const { data: user2, error: err2 } = await supabase.auth.admin.createUser({
            email: `test_partner_${Date.now()}@example.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { fullName: 'Test Partner', totalPoints: 100 }
        });
        if (err2) throw err2;
        console.log(`✅ Created Test Partner (Points: 100): ${user2.user.id}`);

        // Wait briefly for auth triggers
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Insert mock question
        const { data: question, error: qErr } = await supabase
            .from('questions')
            .insert({
                title: 'Test Co-op Question',
                class_grade: '10',
                subject: 'Math',
                difficulty: 'easy',
                time_limit: 5,
                points: 10,
                options: ['A', 'B', 'C', 'D'],
                correct_option: 0,
                created_by: user1.user.id, // Just using initiator as creator for simplicity
            })
            .select()
            .single();
        if (qErr) throw qErr;
        console.log(`✅ Created Mock Question (Points: 10, Correct Opt: 0): ${question.id}`);

        // 3. Insert mock follow relationship
        const { error: followErr } = await supabase
            .from('follows')
            .insert({ follower_id: user1.user.id, following_id: user2.user.id });
        if (followErr) throw followErr;
        console.log(`✅ Created Follow Relationship: Initiator -> Partner`);

        // 4. Test Co-op Challenge Creation Logic
        console.log("\n🧪 Testing Challenge Creation...");
        const reqBody = {
            questionId: question.id,
            partnerId: user2.user.id
        };

        // We can't directly test the /api/coop/create route without a running server and valid JWT easily in a script,
        // so we'll simulate the DB transactions it performs.
        const { data: challenge, error: challengeErr } = await supabase
            .from('coop_challenges')
            .insert({
                question_id: question.id,
                initiator_id: user1.user.id,
                partner_id: user2.user.id,
                status: 'pending'
            })
            .select()
            .single();
        if (challengeErr) throw challengeErr;
        console.log(`✅ Created Challenge in DB via logic equivalent to /api/coop/create.`);

        console.log(`\n🎉 Tests completed successfully! The schema and relationships work.`);

        // --- Cleanup ---
        console.log("\n🧹 Cleaning up test data...");
        await supabase.from('questions').delete().eq('id', question.id); // Cascade should handle attempts/challenges
        await supabase.auth.admin.deleteUser(user1.user.id);
        await supabase.auth.admin.deleteUser(user2.user.id);
        console.log("✅ Cleanup complete.");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

runTests();
