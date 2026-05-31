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
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const userId = parseJwtSub(auth);
        if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const form = await req.formData();
        const file = form.get('file');

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        if (typeof file === 'string') {
            return NextResponse.json({ error: 'Invalid upload: received string instead of file' }, { status: 400 });
        }

        const bucket = 'public-images';
        const rawName = (file as any).name || 'post-image.jpg';
        const ext = rawName.split('.').pop() || 'jpg';
        const fileName = `post-${Date.now()}.${ext}`;
        const filePath = `posts/${userId}/${fileName}`;

        // Robust buffer reading that works in all Node.js environments
        let arrayBuffer: ArrayBuffer;
        try {
            if (typeof (file as any).arrayBuffer === 'function') {
                arrayBuffer = await (file as any).arrayBuffer();
            } else {
                arrayBuffer = await new Response(file).arrayBuffer();
            }
        } catch (e: any) {
            console.error('[PostUpload] Failed to read file:', e.message);
            return NextResponse.json({ error: 'Failed to read uploaded file' }, { status: 400 });
        }

        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
            upsert: false,
            contentType: (file as any).type || 'image/webp',
        });

        if (uploadErr) {
            console.error('[PostUpload] Storage error:', uploadErr);
            return NextResponse.json({ error: uploadErr.message || 'Upload failed' }, { status: 500 });
        }

        const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: publicData.publicUrl, path: filePath });
    } catch (err: any) {
        console.error('[PostUpload] Error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
