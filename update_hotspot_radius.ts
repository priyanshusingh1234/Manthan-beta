import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

try {
    const env = readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    });
} catch { /* ignore */ }
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, match_pairs')
        .eq('question_type', 'hotspot');

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    let updatedCount = 0;
    for (const q of questions) {
        if (!q.match_pairs || !Array.isArray(q.match_pairs)) continue;
        
        let changed = false;
        const newPairs = q.match_pairs.map((h: any) => {
            if (h.radius < 0.12) {
                h.radius = 0.12;
                changed = true;
            }
            return h;
        });

        if (changed) {
            await supabase.from('questions').update({ match_pairs: newPairs }).eq('id', q.id);
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} hotspot questions to have larger radius.`);
}

main().catch(console.error);
