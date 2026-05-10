import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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
    
    console.log(`Sending to ${users.length} users...`);
    
    let sent = 0;
    const batchSize = 100;
    
    // We insert directly into the notifications table to guarantee it shows up.
    // Web push / FCM is harder to trigger from an external script without all of Next's config.
    
    const notifications = users.map(u => ({
        user_id: u.id,
        type: 'points_earned',
        title: 'New Profile Banners Available! 🌌',
        body: 'Head to the Store to check out the new Cyberpunk, Ancient Library, and Galactic Arena banners!',
        href: '/store',
        read: false
    }));

    for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error: insErr } = await supabaseAdmin.from('notifications').insert(batch);
        if (insErr) {
             console.error("Insert error:", insErr);
        } else {
             sent += batch.length;
             console.log(`Sent ${sent}/${users.length}`);
        }
    }
    
    console.log("Broadcast complete!");
}

broadcast().catch(console.error);
