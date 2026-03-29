const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWars() {
  try {
    const { data: schools, error: sErr } = await supabase.from('schools').select('id, name');
    if (sErr) throw sErr;
    console.log('Schools:', schools);

    const { data: wars, error } = await supabase
      .from('wars')
      .select('*, challenger_school:schools!challenger_school_id(name), defender_school:schools!defender_school_id(name)')
      .order('declared_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Recent Wars:');
    if (wars.length > 0) {
      console.log('Keys:', Object.keys(wars[0]));
    }
    wars.forEach(w => {
      console.log(`ID: ${w.id}, Status: ${w.status}, Challenger: ${w.challenger_school?.name}, Defender: ${w.defender_school?.name}, Winner: ${w.winner_school_id}`);
    });
  } catch (e) {
    console.error('FATAL ERROR:', e);
  }
}

checkWars();
