const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env.local
try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        if (!line) return;
        const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
} catch {
    console.error('❌ Could not read .env.local — make sure it exists in the manthan/ folder.');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function wipeSchools() {
    console.log('🗑️  Wiping all school-related data...');

    // 1. Delete war_submissions (depends on wars)
    const { error: e0 } = await supabase.from('war_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e0) { console.error('❌ war_submissions:', e0.message); process.exit(1); }
    console.log('✅ Deleted war_submissions');

    // 2. Delete wars (depends on squads, schools)
    const { error: e1 } = await supabase.from('wars').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e1) { console.error('❌ wars:', e1.message); process.exit(1); }
    console.log('✅ Deleted wars');

    // 3. Delete squad_members (depends on squads)
    const { error: e2 } = await supabase.from('squad_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e2) { console.error('❌ squad_members:', e2.message); process.exit(1); }
    console.log('✅ Deleted squad_members');

    // 4. Delete squads (depends on schools)
    const { error: e3 } = await supabase.from('squads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) { console.error('❌ squads:', e3.message); process.exit(1); }
    console.log('✅ Deleted squads');

    // 5. Delete school_join_requests (depends on schools)
    const { error: e4 } = await supabase.from('school_join_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e4) { console.error('❌ school_join_requests:', e4.message); process.exit(1); }
    console.log('✅ Deleted school_join_requests');

    // 6. Delete school_members (depends on schools)
    const { error: e5 } = await supabase.from('school_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e5) { console.error('❌ school_members:', e5.message); process.exit(1); }
    console.log('✅ Deleted school_members');

    // 7. Delete schools
    const { error: e6 } = await supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e6) { console.error('❌ schools:', e6.message); process.exit(1); }
    console.log('✅ Deleted schools');

    // 8. Reset school metadata on all users
    console.log('\n🔄 Resetting user metadata (school info)...');
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) { console.error('❌ listUsers:', listErr.message); process.exit(1); }

    const usersWithSchool = usersData.users.filter(u =>
        u.user_metadata?.school || u.user_metadata?.school_id || u.user_metadata?.is_general
    );

    console.log(`   Found ${usersWithSchool.length} users with school data to clear...`);

    for (const u of usersWithSchool) {
        const cleaned = { ...u.user_metadata };
        delete cleaned.school;
        delete cleaned.school_id;
        delete cleaned.is_general;

        const { error: metaErr } = await supabase.auth.admin.updateUserById(u.id, {
            user_metadata: cleaned,
        });
        if (metaErr) {
            console.warn(`   ⚠️  Could not update ${u.email}: ${metaErr.message}`);
        }
    }

    console.log(`✅ User metadata cleared for ${usersWithSchool.length} users`);
    console.log('\n🎉 All school data wiped. Fresh start ready!');
}

wipeSchools().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
