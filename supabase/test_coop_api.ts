import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function runApiTests() {
    console.log("🚀 Running Co-op API Tests against localhost:3000...");

    // 1. Create mock users
    const [user1Response, user2Response] = await Promise.all([
        supabaseAdmin.auth.admin.createUser({
            email: `coop_u1_${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { fullName: 'Coop Player 1', totalPoints: 100 }
        }),
        supabaseAdmin.auth.admin.createUser({
            email: `coop_u2_${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { fullName: 'Coop Player 2', totalPoints: 200 }
        })
    ]);

    const user1 = user1Response.data.user;
    const user2 = user2Response.data.user;
    if (!user1 || !user2) throw new Error("Failed to create mock users");
    console.log(`✅ Users created. User1 ID: ${user1.id}, User2 ID: ${user2.id}`);

    try {
        // 2. Insert mock question
        const { data: q, error: qErr } = await supabaseAdmin.from('questions').insert({
            title: 'Test 1-Point Co-op Question',
            points: 1,
            options: ['A', 'B', 'C', 'D'],
            correct_option: 0,
            created_by: user1.id,
            subject: 'Math',
            class_grade: '10',
            difficulty: 'easy',
            time_limit: 60
        }).select().single();
        if (qErr) throw qErr;
        console.log(`✅ Question created: ID ${q.id}, Points: 100, Answer: 0`);

        const { data: signIn1 } = await supabaseAdmin.auth.signInWithPassword({
            email: user1.email!, password: 'password123'
        });
        const token1 = signIn1.session?.access_token;
        if (!token1) throw new Error("Could not authenticate User 1");

        const { data: signIn2 } = await supabaseAdmin.auth.signInWithPassword({
            email: user2.email!, password: 'password123'
        });
        const token2 = signIn2.session?.access_token;
        if (!token2) throw new Error("Could not authenticate User 2");
        
        console.log("✅ Authenticated users and got JWT tokens.");

        // 3. Create Co-op challenge via HTTP
        console.log("\n🧪 API 1: Creating Co-op challenge...");
        const createRes = await fetch('http://localhost:3000/api/coop/create', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token1}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questionId: q.id, partnerId: user2.id, message: "Help!" })
        });
        const createData = await createRes.json();
        
        if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(createData)}`);
        const challengeId = createData.challenge.id;
        console.log(`✅ Challenge successfully created (ID: ${challengeId}) via API.`);

        // 4. Partner solves the challenge correctly via HTTP
        console.log("\n🧪 API 2: Partner solves the challenge correctly...");
        const solveRes = await fetch('http://localhost:3000/api/solve', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token2}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId: q.id,
                selectedOption: 0,
                challengeId: challengeId
            })
        });

        const solveData = await solveRes.json();
        if (!solveRes.ok) throw new Error(`Solve failed: ${JSON.stringify(solveData)}`);
        
        console.log(`✅ Partner submitted correct answer. Received: ${JSON.stringify(solveData)}`);

        // Check if points were distributed (+50 to both)
        const [u1Post, u2Post] = await Promise.all([
            supabaseAdmin.auth.admin.getUserById(user1.id),
            supabaseAdmin.auth.admin.getUserById(user2.id)
        ]);

        const u1FinalPoints = u1Post.data.user?.user_metadata.totalPoints;
        const u2FinalPoints = u2Post.data.user?.user_metadata.totalPoints;

        console.log(`\n📊 Final Points Verification:`);
        console.log(`User 1 (Initiator) Old: 100 -> New: ${u1FinalPoints} (Expected 101)`);
        console.log(`User 2 (Partner) Old: 200 -> New: ${u2FinalPoints} (Expected 201)`);

        if (u1FinalPoints === 101 && u2FinalPoints === 201) {
            console.log(`🎉 Co-op points logic for 1-point question is working perfectly! Both got 1 point.`);
        } else {
            console.error(`❌ Points anomaly detected! Points were not split correctly.`);
        }

        // --- Cleanup ---
        console.log("\n🧹 Cleaning up test data...");
        await supabaseAdmin.from('questions').delete().eq('id', q.id);
        await supabaseAdmin.auth.admin.deleteUser(user1.id);
        await supabaseAdmin.auth.admin.deleteUser(user2.id);
        console.log("✅ Cleanup complete.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        // Cleanup on fail
        await supabaseAdmin.auth.admin.deleteUser(user1.id);
        await supabaseAdmin.auth.admin.deleteUser(user2.id);
    }
}

runApiTests();
