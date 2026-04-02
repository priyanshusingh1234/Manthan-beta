const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const webpush = require('web-push');

const supabaseUrl = "https://ivkrupsksxibaibmiibk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE";
const supabase = createClient(supabaseUrl, supabaseKey);

// VAPID Keys from .env.local
webpush.setVapidDetails(
    'mailto:support@dheeyudha.com',
    'BN7ao-F9m3tEUgvEXXS0NAj7BE4sn3v_lhnysizjl-8GpYwPTjKwun2EH3KGJ-SQuVj1ju4MyrVg7RQCROruoJY',
    'DrVLb9SIcaAPFBkGnzZWfCQTDPdcUJDwfTJz88SPmQQ'
);

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function sendRealPush() {
    try {
        console.log("Fetching scholars...");
        const { data: profiles } = await supabase.from('profiles').select('id');
        
        console.log(`Targeting ${profiles.length} scholars...`);

        const title = '⚔️ Shadow Battle Commenced!';
        const body = 'A mysterious user has appeared. Solve the riddle for 500 pts!';

        for (const p of profiles) {
            const userId = p.id;
            
            // 1. Insert into DB (Notification Center)
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'coop_challenge',
                title,
                body,
                href: '/',
                read: false
            });

            // 2. Fetch Push Subs
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId);

            if (subs && subs.length > 0) {
                console.log(`Sending push to User ${userId.slice(0,5)}...`);
                for (const sub of subs) {
                    try {
                        if (sub.p256dh_key === 'native') {
                            // FIREBASE PUSH
                            await admin.messaging().send({
                                token: sub.endpoint,
                                notification: { title, body },
                                android: { priority: 'high', notification: { channelId: 'default', color: '#4f46e5' } }
                            });
                        } else {
                            // WEB PUSH
                            await webpush.sendNotification({
                                endpoint: sub.endpoint,
                                keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
                            }, JSON.stringify({ title, body, url: '/' }));
                        }
                    } catch (e) {
                         console.error("Push sub failed:", e.message);
                    }
                }
            }
        }

        console.log("Push Broadcast Done!");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

sendRealPush();
