import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let serviceAccount: any = null;

// 1. Try reading from Vercel Environment Variable (base64 or JSON string)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const rawJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        serviceAccount = JSON.parse(rawJson);
    } catch {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
        }

// 2. Fall back to local file if no valid environment variable
if (!serviceAccount) {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
        try {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        } catch (e) {
             console.error('[FirebaseAdmin] Failed to parse local service account file');
        }

// 3. Initialize if we found credentials
if (!admin.apps.length) {
    try {
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('[FirebaseAdmin] Initialized successfully');
        } else {
            console.warn('[FirebaseAdmin] No service account credentials found! (Tried env var & local file)');
        } }catch (err) {
        console.error('[FirebaseAdmin] Initialization error:', err);
    }

export const firebaseAdmin = admin;
}