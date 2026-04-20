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

export async function DELETE(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const userId = parseJwtSub(auth);
        if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { bucket, path } = await req.json();

        if (!bucket || !path) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Ensure the bucket is one of the allowed ones
        if (bucket !== 'avatars' && bucket !== 'banners') {
            return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
        }

        // Ensure the path belongs to the user (e.g. USER_ID/...)
        // We handle both "USER_ID/..." and "avatars/USER_ID/..." (just in case)
        const pathIsSafe = path.startsWith(`${userId}/`) || path.startsWith(`${bucket}/${userId}/`);
        if (!pathIsSafe) {
            return NextResponse.json({ error: 'Unauthorized to delete this path' }, { status: 403 });
        }

        // Supabase remove() expects the full path relative to the bucket.
        // We no longer strip the bucket name from the path because our app 
        // explicitly uses paths like "avatars/USER_ID/..." inside the 'avatars' bucket.
        const cleanPath = path;

        const { error } = await supabaseAdmin.storage.from(bucket).remove([cleanPath]);

        if (error) {
            console.error('Profile Storage delete error:', error);
            return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
