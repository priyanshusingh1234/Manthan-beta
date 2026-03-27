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

async function clearOldTokens() {
  console.log('🧹 Clearing out old, invalid Android tokens from the database...');
  
  const { data, error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('p256dh_key', 'native');

  if (error) {
    console.error('❌ Failed to delete old tokens:', error.message);
  } else {
    console.log('✅ All old Android ghost tokens erased!');
    console.log('📱 Now, open the new Android app and log into your accounts again. This will register fresh, valid tokens tied directly to Firebase.');
  }
}

clearOldTokens();
