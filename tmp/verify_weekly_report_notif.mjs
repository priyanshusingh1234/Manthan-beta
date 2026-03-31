import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, '');
  }
  return out;
}

const env = parseEnv('.env.local');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.auth.signInWithPassword({ email: 'kpk22128@gmail.com', password: '12345678' });
if (error || !data?.session?.access_token) {
  console.error(JSON.stringify({ ok: false, error: error?.message || 'login failed' }));
  process.exit(1);
}

const res = await fetch('http://127.0.0.1:3000/api/notifications', {
  headers: { Authorization: `Bearer ${data.session.access_token}` }
});
const body = await res.json();
const weekly = (body.notifications || []).filter((n) => n.type === 'weekly_report').slice(0, 3);
console.log(JSON.stringify({ status: res.status, weeklyCount: weekly.length, latest: weekly[0] || null }, null, 2));
