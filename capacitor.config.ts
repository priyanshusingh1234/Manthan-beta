import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const config: CapacitorConfig = {
  appId: 'com.dheeyudha.app',
  appName: 'Dheeyudha',
  webDir: 'out',
  server: {
    url: 'https://manthan-beta-c975.vercel.app',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
