import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin Initialized');
  } else {
    throw new Error('Service account file not found!');
  }
} catch (err) {
  console.error('❌ Firebase Init Error:', err);
  process.exit(1);
}

// Read ENV for Supabase
import 'dotenv/config'; // We will use node -r dotenv/config check.mjs but we can try basic read if .env.local exists
import { parse } from 'dotenv';
const envConfig = parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotification() {
  console.log('🔍 Finding a native push subscription...');
  
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('p256dh_key', 'native')
    .limit(1);

  if (error) {
    console.error('❌ Database error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No native app devices registered yet. Open the app on your phone so it connects to the database.');
    return;
  }

  const token = data[0].endpoint;
  console.log('📱 Found a phone! Token ending in:', token.slice(-5));
  
  console.log('🚀 Sending Test FCM Push...');
  try {
    const messageId = await admin.messaging().send({
      token: token,
      notification: {
        title: 'Background Test',
        body: 'If you see this while closed, it works perfectly!',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          color: '#4f46e5',
        }
      }
    });

    console.log('✅ Sent successfully! Message ID:', messageId);
    console.log('---> Now, check your phone. It should have just arrived!');

  } catch (pushErr) {
    console.error('❌ FCM Push Failed:', pushErr);
  }
}

checkNotification();
