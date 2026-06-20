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
    console.log('Reading local image...');
    const fileBuffer = readFileSync('public/images/map_india.png');

    console.log('Uploading to Supabase Storage (question-images)...');
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question-images')
        .upload('map_india.png', fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return;
    }

    console.log('✅ Upload successful!', uploadData);

    console.log('Updating questions in database to use image_path instead of image_url...');
    const { data: updateData, error: updateError } = await supabase
        .from('questions')
        .update({ 
            image_path: 'map_india.png',
            image_url: null
        })
        .eq('image_url', '/images/map_india.png')
        .select();

    if (updateError) {
        console.error('❌ Update error:', updateError);
    } else {
        console.log(`✅ Updated ${updateData.length} questions successfully!`);
    }
}

main().catch(console.error);
