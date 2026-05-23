import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function resetLeagues() {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  console.log(`Resetting all league scores to 0 for month: ${currentMonth}...`);
  
  // Fix corrupted username first so constraint doesn't block the bulk update
  const { error: fixError } = await supabaseAdmin.from('profiles').update({ username: 'pranshu_123' }).eq('id', '67e40dbe-6677-4611-8efc-b600f0bbebb3');
  if (fixError) console.error('Failed to fix username:', fixError);
  
  const { data, error } = await supabaseAdmin.from('profiles').update({
    monthly_points: 0,
    monthly_points_month: currentMonth
  }).neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all rows
  
  if (error) {
    console.error('Failed to reset:', error);
  } else {
    console.log('✅ All users successfully reset to 0 points for this month!');
  }
}
resetLeagues();
