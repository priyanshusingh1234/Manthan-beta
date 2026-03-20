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

        const form = await req.formData();
        const file = form.get('file') as File | null;
        const bucket = form.get('bucket') as string | null;
        const path = form.get('path') as string | null;

        if (!file || !bucket || !path) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (!path.startsWith(`avatars/${userId}/`) && !path.startsWith(`banners/${userId}/`)) {
            return NextResponse.json({ error: 'Unauthorized to upload to this path' }, { status: 403 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
            upsert: true,
            contentType: file.type || 'image/webp'
        });

        if (error) {
            console.error('Profile Storage upload error:', error);
            return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
        }

        const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

        return NextResponse.json({ success: true, path: data.path, publicUrl: publicData.publicUrl });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
