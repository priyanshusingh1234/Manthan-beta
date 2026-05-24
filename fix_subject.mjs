import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function run() {
  console.log('🔄 Updating database records...');
  const { data, error } = await adminClient
    .from('questions')
    .update({ subject: 'GK', chapter: 'Cricket Trivia' })
    .eq('subject', 'Cricket Trivia');

  if (error) {
    console.error('❌ Error updating:', error.message);
  } else {
    console.log('✅ Successfully updated questions to subject: GK, chapter: Cricket Trivia');
  }
}

run();
