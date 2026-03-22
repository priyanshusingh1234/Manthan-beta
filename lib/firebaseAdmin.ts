import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!admin.apps.length) {
    try {
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('[FirebaseAdmin] Initialized successfully');
        } else {
            console.warn('[FirebaseAdmin] Service account file not found at:', serviceAccountPath);
        }
    } catch (err) {
        console.error('[FirebaseAdmin] Initialization error:', err);
    }
}

export const firebaseAdmin = admin;
