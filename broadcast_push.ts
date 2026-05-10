const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// We must require after dotenv.config
const { createClient } = require('@supabase/supabase-js');
const { createNotification } = require('./lib/createNotification');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in env");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function broadcast() {
    console.log("Fetching users...");
    const { data: users, error } = await supabaseAdmin.from('profiles').select('id');
    
    if (error || !users) {
        console.error("Failed to fetch users:", error);
        return;
    }
    
    console.log(`Sending FCM PUSH notifications to ${users.length} users...`);
    
    let sent = 0;
    for (const user of users) {
        await createNotification({
            userId: user.id,
            type: 'points_earned',
            title: 'New Profile Banners Available! 🌌',
            body: 'Head to the Store to check out the new Cyberpunk, Ancient Library, and Galactic Arena banners!',
            href: '/store'
        });
        sent++;
        if (sent % 10 === 0) console.log(`Sent ${sent}/${users.length}`);
    }
    
    console.log("Push Broadcast complete!");
    process.exit(0);
}

broadcast().catch(console.error);
