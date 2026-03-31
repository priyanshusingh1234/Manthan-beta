import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, '');
    out[k] = v;
  }
  return out;
}

const env = parseEnv('.env.local');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'kpk22128@gmail.com',
  password: '12345678',
});

if (error || !data?.session?.access_token) {
  console.error(JSON.stringify({ success: false, step: 'login', error: error?.message || 'No token' }));
  process.exit(1);
}

const token = data.session.access_token;

const res = await fetch('http://127.0.0.1:3000/api/report/generate-notification', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ force: true }),
});

const body = await res.json().catch(async () => ({ raw: await res.text() }));
console.log(JSON.stringify({ status: res.status, body }, null, 2));
