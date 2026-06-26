import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const userId = '60ac847a-7bb1-484d-896c-941319c7c105';
    console.log("Checking various tables for userId:", userId);

    // Let's try some common table names
    const tablesToCheck = ['user_responses', 'user_answers', 'user_progress', 'battles', 'user_stats', 'question_attempts'];
    
    for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', userId).limit(5);
        if (error) {
            // Table might not exist or wrong column name, let's ignore or print error code
            // console.log(`Table ${table} check failed: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`Found ${data.length} records in table '${table}'`);
        }
    }
    
    // Check if there are tables with player1 or player2
    const { data: b1, error: e1 } = await supabase.from('battles').select('*').eq('player1_id', userId);
    if (b1 && b1.length > 0) console.log(`Found ${b1.length} battles as player1`);
    
    const { data: b2, error: e2 } = await supabase.from('battles').select('*').eq('player2_id', userId);
    if (b2 && b2.length > 0) console.log(`Found ${b2.length} battles as player2`);
    
    // Also let's check auth metadata if stats are there
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.user_metadata) {
       console.log("Auth User Metadata:", authUser.user.user_metadata);
    }
}
run();
