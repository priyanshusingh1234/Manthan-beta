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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Find a recent post
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, author_id')
    .gte('created_at', yesterday)
    .limit(1);

  if (error || !posts || posts.length === 0) {
    console.log('No recent posts found to test with.', error);
    return;
  }

  const testPost = posts[0];
  console.log('Found post to test:', testPost.id);

  // Update it to have 15 likes and not trending
  const { error: updateErr } = await supabase
    .from('posts')
    .update({ likes_count: 15, is_trending: false })
    .eq('id', testPost.id);

  if (updateErr) {
    console.log('Error updating post:', updateErr);
    return;
  }

  console.log('Post successfully manipulated for testing. Now hitting the Vercel API...');

  // Hit the live vercel endpoint
  try {
    const res = await fetch('https://manthan-beta-c975.vercel.app/api/cron/trending');
    const json = await res.json();
    console.log('Vercel API Response:', json);
  } catch (err) {
    console.log('Error calling API:', err.message);
  }
}

run();
