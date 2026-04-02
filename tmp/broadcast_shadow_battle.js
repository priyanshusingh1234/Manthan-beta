const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ivkrupsksxibaibmiibk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function broadcastShadowBattle() {
    try {
        console.log("Fetching all scholar profiles...");
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id');

        if (error) throw error;

        console.log(`Found ${profiles.length} scholars. Preparing notifications...`);

        const notificationData = profiles.map(p => ({
            user_id: p.id,
            type: 'coop_challenge',
            title: '⚔️ Shadow Battle Commenced!',
            body: 'A mysterious user has appeared. Find him, solve the riddle, and comment to win 50M points!',
            href: '/',
            read: false
        }));

        // Batch insert in chunks of 100 to avoid limits
        const chunkSize = 100;
        for (let i = 0; i < notificationData.length; i += chunkSize) {
            const chunk = notificationData.slice(i, i + chunkSize);
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(chunk);
            
            if (insertError) {
                console.error(`Error inserting chunk ${i/chunkSize}:`, insertError.message);
            } else {
                console.log(`Inserted chunk ${i/chunkSize + 1}/${Math.ceil(notificationData.length/chunkSize)}`);
            }
        }

        console.log("Broadcast Successful!");

    } catch (err) {
        console.error("Broadcast failed:", err.message);
    }
}

broadcastShadowBattle();
