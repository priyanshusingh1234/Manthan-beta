require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearSchools() {
  try {
    console.log('Starting fresh...');

    // 1. Remove school associations from all profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ school: null })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // match all
    if (profileError) throw profileError;
    console.log('Cleared school from profiles');

    // 2. Delete dependencies first
    const tables = ['wars', 'squad_members', 'school_members', 'squads', 'school_join_requests'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.log(`Warning clearing ${table}:`, error.message);
      else console.log(`Cleared ${table}`);
    }

    // 3. Delete all schools
    const { error: schoolsError } = await supabase
      .from('schools')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (schoolsError) throw schoolsError;
    console.log('Deleted all schools!');

    console.log('Successfully wiped all school data!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearSchools();
