/**
 * cleanup_test_users.mjs
 * 
 * STEP 1: Run with --list to preview who would be deleted (safe, no changes)
 * STEP 2: Run with --delete to actually delete them after confirming the list
 * 
 * Usage:
 *   node cleanup_test_users.mjs --list
 *   node cleanup_test_users.mjs --delete
 * 
 * Detects test users by:
 *  - email containing: test, demo, dummy, fake, temp, sample, abc, xyz, 123@, foo@, bar@
 *  - username containing: test, demo, dummy, user1, user2, testuser
 *  - full_name containing: Test User, Demo, Dummy, Fake User
 *  - zero total_points AND created recently (< 7 days) with no solve activity
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import readline from 'readline';

// Load .env.local
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

// ─── Patterns that indicate test accounts ──────────────────────────────────────
const EMAIL_PATTERNS = [
    /test/i, /demo/i, /dummy/i, /fake/i, /temp/i,
    /sample/i, /foo@/i, /bar@/i, /baz@/i,
    /^abc/i, /^xyz/i, /user\d+@/i, /testuser/i,
    /priyanshu.*test/i,   // ← adjust to your own patterns
];

const USERNAME_PATTERNS = [
    /^test/i, /^demo/i, /^dummy/i, /^user\d/i, /testuser/i,
];

const NAME_PATTERNS = [
    /^test user/i, /^demo/i, /^dummy/i, /^fake/i, /^temp/i,
];

function isTestEmail(email) {
    if (!email) return false;
    return EMAIL_PATTERNS.some(p => p.test(email));
}

function isTestUsername(username) {
    if (!username) return false;
    return USERNAME_PATTERNS.some(p => p.test(username));
}

function isTestName(name) {
    if (!name) return false;
    return NAME_PATTERNS.some(p => p.test(name));
}

async function getTestUsers() {
    console.log('🔍  Fetching all users from auth.users ...');

    // Auth users — paginated
    let allAuthUsers = [];
    let page = 1;
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) { console.error('listUsers error:', error); break; }
        allAuthUsers = allAuthUsers.concat(data.users || []);
        if ((data.users || []).length < 1000) break;
        page++;
    }

    console.log(`📋  Total auth users: ${allAuthUsers.length}`);

    // Profiles — for username, name, points
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, total_points, created_at');
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const suspects = [];

    for (const u of allAuthUsers) {
        const profile = profileMap.get(u.id);
        const email = u.email || '';
        const username = profile?.username || u.user_metadata?.username || '';
        const name = profile?.full_name || u.user_metadata?.fullName || u.user_metadata?.name || '';
        const points = Number(profile?.total_points) || 0;
        const createdAt = new Date(u.created_at);
        const ageHours = (Date.now() - createdAt.getTime()) / 3_600_000;

        // Determine why it's flagged
        const reasons = [];
        if (isTestEmail(email)) reasons.push(`email: ${email}`);
        if (isTestUsername(username)) reasons.push(`username: ${username}`);
        if (isTestName(name)) reasons.push(`name: ${name}`);
        // Zero points + no username + created within last 30 days + never verified
        if (points === 0 && !username && ageHours < 24 * 30 && !u.email_confirmed_at) {
            reasons.push('unverified, 0 pts, no username, < 30 days old');
        }

        if (reasons.length > 0) {
            suspects.push({ id: u.id, email, username, name, points, reasons, createdAt });
        }
    }

    return suspects;
}

async function main() {
    const mode = process.argv[2]; // --list or --delete

    if (!mode || (mode !== '--list' && mode !== '--delete')) {
        console.log(`
Usage:
  node cleanup_test_users.mjs --list     # Preview, no changes
  node cleanup_test_users.mjs --delete   # Delete after confirmation
`);
        process.exit(0);
    }

    const suspects = await getTestUsers();

    if (suspects.length === 0) {
        console.log('✅  No test users detected. Leaderboard is clean!');
        return;
    }

    console.log(`\n⚠️   Found ${suspects.length} suspected test account(s):\n`);
    console.log('─'.repeat(90));
    suspects.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email || '(no email)'}`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Username: ${u.username || '-'}  |  Name: ${u.name || '-'}  |  Points: ${u.points}`);
        console.log(`   Created: ${u.createdAt.toLocaleDateString()}`);
        console.log(`   Reason: ${u.reasons.join(', ')}`);
        console.log('─'.repeat(90));
    });

    if (mode === '--list') {
        console.log(`\n📋  DRY RUN complete — ${suspects.length} user(s) would be deleted.`);
        console.log('   Run with --delete to permanently remove them.\n');
        return;
    }

    // ── DELETE MODE ──
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise(resolve => {
        rl.question(`\n🗑️   Type "DELETE ${suspects.length}" to confirm permanent deletion: `, async (answer) => {
            rl.close();
            if (answer.trim() !== `DELETE ${suspects.length}`) {
                console.log('❌  Cancelled — answer did not match. No changes made.');
                resolve();
                return;
            }

            console.log('\n🚀  Deleting...');
            let deleted = 0, failed = 0;

            for (const u of suspects) {
                // Delete from auth (cascades to profiles via RLS/trigger if set up)
                const { error } = await supabase.auth.admin.deleteUser(u.id);
                if (error) {
                    console.error(`  ❌  Failed to delete ${u.email}: ${error.message}`);
                    failed++;
                } else {
                    // Also clean up profiles row explicitly (in case cascade isn't set)
                    await supabase.from('profiles').delete().eq('id', u.id);
                    console.log(`  ✅  Deleted: ${u.email || u.id}`);
                    deleted++;
                }
            }

            console.log(`\n✅  Done. Deleted: ${deleted}  |  Failed: ${failed}`);
            console.log('   Run the app and check the leaderboard — test users should be gone.');
            console.log('   The leaderboard cache will refresh within 20 minutes automatically.\n');
            resolve();
        });
    });
}

main().catch(console.error);
