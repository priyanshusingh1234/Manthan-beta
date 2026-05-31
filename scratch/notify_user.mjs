import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const userId = '1472c2b5-f085-4790-9694-2321d4b07b45';
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'answer_flagged',
      title: 'Points Deducted for Unfair Means',
      body: 'Your recent written answers were found to be screenshots. 340 points have been deducted from your account and the submissions have been removed.',
      read: false
    });
    
  if (error) {
    console.error('Error inserting notification:', error);
  } else {
    console.log('Notification sent successfully.');
  }
}

run();
