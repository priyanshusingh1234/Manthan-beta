const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

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

async function checkTokens() {
  console.log('🔍 Checking database for registered Android tokens...');
  
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint')
    .eq('p256dh_key', 'native');

  if (error) {
    console.error('❌ Failed to fetch tokens:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('⚠️ There are literally ZERO native tokens in the database.');
    console.log('This means your app is NOT sending the token to the server at login.');
    return;
  }

  console.log(`✅ Found ${data.length} registered Android device(s)!`);
  data.forEach((device, index) => {
    console.log(`📱 Device ${index + 1}:`);
    console.log(`   User ID: ${device.user_id}`);
    console.log(`   Token Length: ${device.endpoint.length}`);
    console.log(`   Token Starts With: ${device.endpoint.substring(0, 20)}...`);
  });
}

checkTokens();
