const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
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

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error('❌ VAPID keys missing in .env.local');
    process.exit(1);
}

webpush.setVapidDetails(
    'mailto:support@dheeyudha.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE
);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebPush() {
  console.log('🔍 Checking database for Web Push subscriptions (non-native)...');
  
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .neq('p256dh_key', 'native')
    .limit(1);

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No Web Push subscriptions found in the DB. Have you enabled notifications in your desktop browser?');
    process.exit(0);
  }

  const sub = data[0];
  console.log('🌐 Found a Web Browser subscription!');
  
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh_key,
      auth: sub.auth_key,
    }
  };

  const payload = JSON.stringify({
    title: 'Desktop Test 🖥️',
    body: 'If you see this on your computer, webpush is working perfectly!',
    url: '/',
  });

  console.log('🚀 Sending Test Web Push...');
  try {
    const res = await webpush.sendNotification(pushSubscription, payload);
    console.log('✅ Web Push Sent successfully! Status:', res.statusCode);
  } catch (err) {
    console.error('❌ Web Push Failed:', err.statusCode, err.body || err.message);
  }
  process.exit(0);
}

checkWebPush();
