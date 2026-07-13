const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivkrupsksxibaibmiibk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function fixTitles() {
  console.log('Fetching puzzle attempts for "The Village Census"...');
  
  // 1. Get all correct attempts for the daily puzzle
  const { data: attempts, error: err1 } = await supabaseAdmin
    .from('puzzle_attempts')
    .select('user_id, is_correct, puzzle_id')
    .eq('puzzle_id', 'village-census-v1') // The ID used in the route is PUZZLE.id which is 'village-census-v1'
    .eq('is_correct', true);

  if (err1) {
    console.error('Error fetching puzzle attempts:', err1);
    return;
  }

  console.log(`Found ${attempts.length} correct attempts for puzzle_1`);

  const uniqueUsers = [...new Set(attempts.map(a => a.user_id))];
  console.log(`Unique users who got it right: ${uniqueUsers.length}`);

  let updatedCount = 0;
  let alreadyHadCount = 0;

  for (const userId of uniqueUsers) {
    // 2. Fetch their profile to get cosmetics
    const { data: profile, error: err2 } = await supabaseAdmin
      .from('profiles')
      .select('cosmetics')
      .eq('id', userId)
      .single();

    if (err2 || !profile) {
      console.error(`Error fetching profile for ${userId}:`, err2);
      continue;
    }

    const currentCosmetics = Array.isArray(profile.cosmetics) ? profile.cosmetics : [];
    const crusherTitle = 'puzzle_title:The Crusher';

    // 3. Add title if missing
    if (!currentCosmetics.includes(crusherTitle)) {
      currentCosmetics.push(crusherTitle);
      
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ cosmetics: currentCosmetics })
        .eq('id', userId);

      if (updateErr) {
        console.error(`Error updating cosmetics for ${userId}:`, updateErr);
      } else {
        console.log(`✅ Awarded "The Crusher" to ${userId}`);
        updatedCount++;
      }
    } else {
      alreadyHadCount++;
    }
  }

  console.log(`\nDone! Awarded to ${updatedCount} users. ${alreadyHadCount} users already had it.`);
}

fixTitles();
