import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Resetting all weekly points to 0...");

  // To trigger the logic to assign them 0 points correctly, we can either:
  // 1) Set monthly_points_month = null
  // 2) Or just set monthly_points = 0 directly, and monthly_points_month to the current week key
  
  // Calculate current week key to set it properly
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay()); // Roll back to Sunday
  const weekKey = `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  console.log(`Setting monthly_points = 0 and monthly_points_month = '${weekKey}' for everyone...`);

  // We can't update all without a filter in Supabase REST. 
  // We can use a trick like .neq('id', '00000000-0000-0000-0000-000000000000')
  const { data, error, count } = await supabase
    .from('profiles')
    .update({ 
      monthly_points: 0,
      monthly_points_month: weekKey 
    })
    .not('id', 'is', null);

  if (error) {
    console.error("Error updating profiles:", error);
  } else {
    console.log(`Successfully reset points for all users.`);
  }
}

run();
