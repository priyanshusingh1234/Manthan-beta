import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const userId = '1472c2b5-f085-4790-9694-2321d4b07b45';
  
  // 1. Fetch all submissions for Payal
  const { data: subs, error: subsError } = await supabase
    .from('written_submissions')
    .select('id, points_awarded')
    .eq('student_id', userId);
    
  if (subsError) {
    console.error('Error fetching submissions:', subsError);
    return;
  }
  
  if (!subs || subs.length === 0) {
    console.log('No submissions found to delete.');
    return;
  }
  
  const totalPointsToDeduct = subs.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
  console.log(`Found ${subs.length} submissions. Total points to deduct: ${totalPointsToDeduct}`);
  
  // 2. Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('total_points, monthly_points')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }
  
  const newTotal = Math.max(0, profile.total_points - totalPointsToDeduct);
  const newMonthly = Math.max(0, profile.monthly_points - totalPointsToDeduct);
  
  console.log(`Updating profile. Old total: ${profile.total_points}, New total: ${newTotal}`);
  
  // 3. Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      total_points: newTotal,
      monthly_points: newMonthly 
    })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Error updating profile:', updateError);
    return;
  }
  
  // 4. Delete submissions
  const subIds = subs.map(s => s.id);
  const { error: deleteError } = await supabase
    .from('written_submissions')
    .delete()
    .in('id', subIds);
    
  if (deleteError) {
    console.error('Error deleting submissions:', deleteError);
    return;
  }
  
  console.log('Successfully deleted submissions and deducted points.');
}

run();
