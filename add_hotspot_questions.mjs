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
    const newEmail = 'kpk22128@gmail.com';
    
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

    const user = allAuthUsers.find(u => u.email === newEmail);
    if (!user) {
        console.error(`❌ User ${newEmail} not found`);
        return;
    }

    console.log(`Teacher found with ID: ${user.id}`);
    
    // Local Map of India image
    const indiaMapUrl = '/images/map_india.png';

    const questions = [
        {
            title: 'Locate Maharashtra on the Map',
            body: 'Click on the state of Maharashtra on the map of India.',
            subject: 'SST',
            class_grade: '10',
            points: 4,
            time_limit: 2,
            difficulty: 'moderate',
            question_type: 'hotspot',
            image_url: indiaMapUrl,
            match_pairs: [
                { id: '1', x: 0.28, y: 0.58, radius: 0.05, label: 'Maharashtra' }
            ],
            created_by: user.id
        },
        {
            title: 'Identify Gujarat',
            body: 'Click on the state of Gujarat on the map of India.',
            subject: 'SST',
            class_grade: '10',
            points: 4,
            time_limit: 2,
            difficulty: 'easy',
            question_type: 'hotspot',
            image_url: indiaMapUrl,
            match_pairs: [
                { id: '1', x: 0.15, y: 0.45, radius: 0.04, label: 'Gujarat' }
            ],
            created_by: user.id
        },
        {
            title: 'Locate Kerala',
            body: 'Find and tap the state of Kerala on the given map.',
            subject: 'SST',
            class_grade: '10',
            points: 4,
            time_limit: 2,
            difficulty: 'moderate',
            question_type: 'hotspot',
            image_url: indiaMapUrl,
            match_pairs: [
                { id: '1', x: 0.35, y: 0.88, radius: 0.04, label: 'Kerala' }
            ],
            created_by: user.id
        },
        {
            title: 'Identify Uttar Pradesh',
            body: 'Select the state of Uttar Pradesh on this political map.',
            subject: 'SST',
            class_grade: '10',
            points: 4,
            time_limit: 2,
            difficulty: 'easy',
            question_type: 'hotspot',
            image_url: indiaMapUrl,
            match_pairs: [
                { id: '1', x: 0.45, y: 0.30, radius: 0.05, label: 'Uttar Pradesh' }
            ],
            created_by: user.id
        },
        {
            title: 'Locate Assam',
            body: 'Click on the state of Assam in the north-eastern region.',
            subject: 'SST',
            class_grade: '10',
            points: 4,
            time_limit: 2,
            difficulty: 'hard',
            question_type: 'hotspot',
            image_url: indiaMapUrl,
            match_pairs: [
                { id: '1', x: 0.80, y: 0.35, radius: 0.04, label: 'Assam' }
            ],
            created_by: user.id
        }
    ];

    const { data, error } = await supabase.from('questions').insert(questions).select();

    if (error) {
        console.error('❌ Error inserting questions:', error);
    } else {
        console.log(`✅ Successfully inserted ${data.length} hotspot questions for ${newEmail}!`);
    }
}

main().catch(console.error);
