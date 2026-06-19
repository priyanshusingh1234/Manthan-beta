import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

try {
    const env = readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    });
} catch { /* try .env */ }
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'kpk22128@gmail.com';
    const newPassword = '123456789';
    
    console.log(`Searching for user with email: ${email}`);
    
    // Auth users
    let allAuthUsers = [];
    let page = 1;
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) { console.error('listUsers error:', error); break; }
        allAuthUsers = allAuthUsers.concat(data.users || []);
        if ((data.users || []).length < 1000) break;
        page++;
    }

    const user = allAuthUsers.find(u => u.email === email);
    if (!user) {
        console.error('❌ User not found');
        return;
    }

    console.log(`User found with ID: ${user.id}`);
    
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (error) {
        console.error('❌ Error updating password:', error.message);
    } else {
        console.log(`✅ Password successfully updated!`);
        console.log(`New Password: ${newPassword}`);
    }
}

main().catch(console.error);
