import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL } from '@/lib/uploadLimits';

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
        const roomId = form.get('roomId') as string | null;

        if (!file || !roomId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (typeof file === "string") {
            return NextResponse.json({ error: "Invalid upload format: received string" }, { status: 400 });
        }

        let arrayBuffer: ArrayBuffer;
        try {
            if (typeof (file as any).arrayBuffer === "function") {
                arrayBuffer = await (file as any).arrayBuffer();
            } else {
                arrayBuffer = await new Response(file).arrayBuffer();
            }
        } catch (e: any) {
             console.error("Failed to read file:", e.message);
             return NextResponse.json({ error: "Failed to read file contents" }, { status: 400 });
        }

        const buffer = Buffer.from(arrayBuffer);
        if (buffer.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `Image is too large. Please select an image under ${MAX_IMAGE_UPLOAD_LABEL}.` },
                { status: 413 }
            );
        }
        const fileExtension = file.name ? file.name.split('.').pop() : 'webp';
        // Put in public bucket "chat_images". If that doesn't exist, we will use "avatars".
        // Often projects use a generic 'public' bucket or similar. "avatars" is guaranteed.
        // Let's use `avatars/chat_${roomId}_${Date.now()}.${fileExtension}`
        const path = `avatars/chat_${roomId}_${userId}_${Date.now()}.${fileExtension}`;

        const { data, error } = await supabaseAdmin.storage.from('avatars').upload(path, buffer, {
            upsert: true,
            contentType: (file as any).type || 'image/webp'
        });

        if (error) {
            console.error('Chat Storage upload error:', error);
            return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
        }

        const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(data.path);

        return NextResponse.json({ success: true, path: data.path, publicUrl: publicData.publicUrl });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
