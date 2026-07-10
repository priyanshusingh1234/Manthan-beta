const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function run() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, total_points, full_name')
    .ilike('username', '%aniket%');

  console.log('Profiles found:', profiles);

  for (const profile of (profiles || [])) {
      console.log(`\n--- Checking ${profile.username} ---`);

      const { data: testResults } = await supabase
        .from('test_results')
        .select('test_id, score, max_score')
        .eq('user_id', profile.id);
      
      console.log(`Found ${testResults?.length || 0} test_results`);

      let earnedPoints = 0;
      if (testResults && testResults.length > 0) {
          const { data: gauntlets } = await supabase.from('gauntlets').select('slug, reward_points, reward_threshold_percent');
          const gauntletMap = {};
          (gauntlets || []).forEach(g => { gauntletMap[g.slug] = g; });

          testResults.forEach(r => {
              const g = gauntletMap[r.test_id];
              if (g) {
                  const thresholdScore = Math.round((g.reward_threshold_percent / 100) * r.max_score);
                  if (r.score >= thresholdScore) {
                      earnedPoints += (g.reward_points || 0);
                  }
              }
          });
      }
      console.log(`Calculated points from test_results: ${earnedPoints}`);

      const { data: submissions } = await supabase
        .from('test_submissions')
        .select('total_score')
        .eq('user_id', profile.id);
      console.log(`Found ${submissions?.length || 0} test_submissions`);
      
      const { data: duels } = await supabase
        .from('duels')
        .select('id, winner_id, loser_id')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);
      console.log(`Found ${duels?.length || 0} duels`);

      const { data: solved } = await supabase
        .from('solved_questions')
        .select('id')
        .eq('user_id', profile.id);
      console.log(`Found ${solved?.length || 0} solved_questions`);

      const { data: challenges } = await supabase
        .from('challenges')
        .select('id')
        .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`);
      console.log(`Found ${challenges?.length || 0} challenges`);
  }
}

run();
