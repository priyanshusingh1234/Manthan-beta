import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import supabaseAdmin from '@/lib/supabaseAdmin';

const DATA_PATH = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_PATH, 'teacherApplications.json');

async function ensureStorage() {
  try {
    await fs.mkdir(DATA_PATH, { recursive: true });
    try {
      await fs.access(FILE);
    } catch {
      await fs.writeFile(FILE, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Error ensuring storage:', err);
  }
}

async function readApplications() {
  await ensureStorage();
  const raw = await fs.readFile(FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeApplications(apps: any[]) {
  await ensureStorage();
  await fs.writeFile(FILE, JSON.stringify(apps, null, 2));
}

function getEmailFromBearer(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return (obj.email || obj?.user_email || null)?.toString().toLowerCase();
  } catch (err) {
    return null;
  }
}

function getUserIdFromBearer(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return (obj.sub || obj?.user_id || null)?.toString() || null;
  } catch (err) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // Only admin may list applications — verify email from bearer token
    const adminList = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const auth = req.headers.get('authorization');
    const email = getEmailFromBearer(auth);
    if (!email || !adminList.includes(email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    // Prefer DB when service role is configured
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // fetch from DB (apply status filter in the query when provided)
      let builder: any = supabaseAdmin.from('teacher_applications').select('*').order('created_at', { ascending: false });
      if (status) builder = builder.eq('status', status);
      const { data, error } = await builder;
      if (error) {
        const msg = (error && (error.message || JSON.stringify(error))) || String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      const apps = (data || []).map((r: any) => ({
        id: String(r.id),
        userId: r.user_id ? String(r.user_id) : null,
        fullName: r.name || r.full_name,
        email: r.email,
        school: r.school,
        schoolEmail: r.school_email,
        subjects: r.main_subject || r.subjects,
        experience: r.experience,
        bio: r.bio,
        status: r.status,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at || null,
        reviewer: r.reviewer || null,
        notifiedAt: r.notified_at || null,
      }));

      return NextResponse.json(apps);
    }

    let apps = await readApplications();
    if (status) apps = apps.filter((a: any) => a.status === status);
    return NextResponse.json(apps);
  } catch (err) {
    return NextResponse.json({ error: 'Could not read applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, school, subjects } = body || {};

    if (!fullName || !school || !subjects) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    const newApp = {
      id: (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: body.fullName || body.name || '',
      email: body.email || null,
      school: body.school || '',
      school_email: body.schoolEmail || body.school_email || null,
      main_subject: body.subjects || body.main_subject || '',
      experience: body.experience ?? null,
      bio: body.bio || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Persist to Supabase when service role is configured
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit client-supplied `id` so inserts work whether DB uses bigint or uuid for PK
      const dbPayload: any = { ...newApp };
      delete dbPayload.id;

      // attach user_id when the request includes an Authorization token
      const authHeader = (req.headers as any)?.get ? req.headers.get('authorization') : null;
      const userId = getUserIdFromBearer(authHeader);

      // If DB persistence is enabled, require an authenticated user (DB in your setup has user_id NOT NULL)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && !userId) {
        return NextResponse.json({ error: 'Authentication required to persist application to database. Please sign in.' }, { status: 401 });
      }

      if (userId) dbPayload.user_id = userId;

      const { data, error } = await supabaseAdmin.from('teacher_applications').insert(dbPayload).select().single();
      if (error) {
        console.error('DB insert failed:', error);
        const errMsg = (error && (error.message || JSON.stringify(error))) || String(error);
        return NextResponse.json({ error: `Database insert failed: ${errMsg}` }, { status: 500 });
      }

      const clientData = {
        id: String(data.id),
        userId: data.user_id ? String(data.user_id) : null,
        fullName: data.name || data.full_name,
        email: data.email,
        school: data.school,
        schoolEmail: data.school_email,
        subjects: data.main_subject || data.subjects,
        experience: data.experience,
        bio: data.bio,
        status: data.status,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at || null,
        reviewer: data.reviewer || null,
      };
      return NextResponse.json({ success: true, data: clientData }, { status: 201 });
    }

    // Fallback: write to local file
    const apps = await readApplications();
    const authHeader = (req.headers as any)?.get ? req.headers.get('authorization') : null;
    const userId = getUserIdFromBearer(authHeader);

    const clientApp = {
      id: newApp.id,
      userId: userId || null,
      fullName: newApp.name,
      email: newApp.email,
      school: newApp.school,
      schoolEmail: newApp.school_email,
      subjects: newApp.main_subject,
      experience: newApp.experience,
      bio: newApp.bio,
      status: newApp.status,
      createdAt: newApp.created_at,
    };
    apps.unshift(clientApp);
    await writeApplications(apps);

    return NextResponse.json({ success: true, data: clientApp }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}