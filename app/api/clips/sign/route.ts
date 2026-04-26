import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';

// ── Cloudinary signed upload endpoint ─────────────────────────────────────────
// The browser uploads directly to Cloudinary (not through our server),
// so we just generate a short-lived signed upload signature here.
// This avoids streaming large video files through Vercel's 4.5MB body limit.
//
// Compression transformations applied at upload time:
//   - f_auto         → best format (webm/mp4)
//   - q_auto:low     → aggressive quality reduction
//   - vc_h264        → H.264 codec, maximum browser compat
//   - w_720          → cap at 720p width
//   - br_400k        → max bitrate 400kbps → ~1.5MB per 30s clip
//   - du_30          → hard trim to 30 seconds
// ─────────────────────────────────────────────────────────────────────────────

function parseJwtSub(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const payload = token.split('.')[1];
        const obj = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        return obj.sub || obj.user_id || null;
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    try {
        const userId = parseJwtSub(req.headers.get('authorization'));
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey    = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
        }

        const timestamp = Math.round(Date.now() / 1000);

        // Folder per user, transformation pipeline for max compression
        const folder = `dheeyudha/clips/${userId}`;
        const transformation = 'f_auto,q_auto:low,vc_h264,w_720,br_400k,du_30';

        // Params must be sorted alphabetically for Cloudinary signature
        const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}`;

        const signature = crypto
            .createHash('sha1')
            .update(paramsToSign + apiSecret)
            .digest('hex');

        return NextResponse.json({
            cloudName,
            apiKey,
            timestamp,
            signature,
            folder,
            transformation,
        });
    } catch (err: any) {
        console.error('[clips/sign] error:', err);
        return NextResponse.json({ error: 'Signing failed' }, { status: 500 });
    }
}
