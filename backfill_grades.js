const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Fetching all users to backfill class_grade...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error || !users) {
    console.log('Failed to fetch users:', error);
    return;
  }

  console.log(`Found ${users.length} total users.`);
  let updatedCount = 0;

  for (const user of users) {
    const grade = user.user_metadata?.classGrade || user.user_metadata?.grade;
    if (grade) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ class_grade: grade.toString() })
        .eq('id', user.id);
      
      if (!updateErr) updatedCount++;
    }
  }

  console.log(`Successfully backfilled class_grade for ${updatedCount} users!`);
}

run();
