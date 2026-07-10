const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function run() {
  try {
    const { data, error } = await supabase
      .from('gauntlets')
      .update({
        description: 'Test your mastery of chemical reactions! 15 questions on decomposition, displacement, and energy changes to boost your Class 9 ICSE prep. Score ≥80% for 20 Bonus Points!',
        reward: 'Reaction Master + 20 Bonus Points',
        reward_points: 20
      })
      .eq('slug', 'class-9-chem-ch2-reactions-battle');

    if (error) {
      console.error('Error updating arena battle:', error);
    } else {
      console.log(`Successfully updated points to 20 for Class 9 Chemistry Chapter 2!`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();
