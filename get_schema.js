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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Fetch all users using pagination to find the teacher
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const teacher = users?.find(u => u.email?.toLowerCase() === 'kpk22128@gmail.com');
  console.log('Teacher ID:', teacher?.id);

  // 2. Fetch a written question to see how it's structured
  const { data: writtenQs, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('question_type', 'written')
    .limit(1);
    
  console.log('Written Question Sample:', JSON.stringify(writtenQs?.[0], null, 2));
}
run();
