const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o'
);

async function run() {
  const { data, error } = await supabase
    .from('test_results')
    .select(`
      score,
      accuracy,
      time_taken,
      profiles (
        username,
        full_name
      )
    `)
    .limit(2);
  
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

run();
