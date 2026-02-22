import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

function parseJwtSub(bearer?: string | null) {
  try {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, '');
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj.sub || obj.user_id || null;
  } catch (err) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const userId = parseJwtSub(auth);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // parse multipart form-data
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bucket = 'question-images';
    const filename = `${Date.now()}_${String(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `questions/${userId}/${filename}`;

    // read file bytes
    const buffer = Buffer.from(await file.arrayBuffer());

    // attempt upload using service role client
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { upsert: true });
    if (error) {
      // helpful error message
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    // create signed URL for private bucket
    const ttl = 60 * 60; // 1 hour
    const { data: signed, error: signErr } = await supabaseAdmin.storage.from(bucket).createSignedUrl(data.path, ttl);
    if (signErr) {
      console.warn('Signed URL creation failed:', signErr);
      // still return path so client can request signed url later
      return NextResponse.json({ success: true, path: data.path, url: null });
    }

    return NextResponse.json({ success: true, path: data.path, url: signed.signedUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const userId = parseJwtSub(auth);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { path } = await req.json();
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    // ensure file belongs to user (basic check)
    if (!String(path).startsWith(`questions/${userId}/`)) {
      return NextResponse.json({ error: `Not authorized to remove this file` }, { status: 403 });
    }

    const bucket = 'question-images';
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Failed to remove file:', error);
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
