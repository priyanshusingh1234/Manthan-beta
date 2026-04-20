import { NextResponse, NextRequest } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';
import { leaderboardCache } from '@/lib/leaderboardCache';

const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        
        if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        let callerAvatarUrl: string | null = null;
        try {
            const body = await req.json().catch(() => ({}));
            if (body?.avatarUrl && typeof body.avatarUrl === 'string' && !isGoogleUrl(body.avatarUrl)) {
                callerAvatarUrl = body.avatarUrl;
            }
        } catch { /* no body is fine */ }

        // Fetch fresh from the DB to avoid stale JWT metadata
        const { data: freshUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const meta = freshUser?.user?.user_metadata || user.user_metadata || {};

        let finalMeta = { ...meta };
        let metaNeedsUpdate = false;

        // If caller gave us the new URL, force it immediately into finalMeta BEFORE we process DB
        if (callerAvatarUrl) {
            finalMeta.avatar_url = callerAvatarUrl;
            metaNeedsUpdate = true;
            
            // Immediately overwrite the DB
            const { error: dbUpdateErr } = await supabaseAdmin
                .from('profiles')
                .update({ avatar_url: callerAvatarUrl })
                .eq('id', user.id);
                
            if (dbUpdateErr) console.error("Force caller DB update failed:", dbUpdateErr);
            leaderboardCache.invalidate();
        }

        const { data: dbProfile } = await supabaseAdmin
            .from('profiles')
            .select('total_points, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

        const dbPoints = Number(dbProfile?.total_points) || 0;
        const metaPoints = Number(finalMeta.totalPoints) || 0;

        // ── 🛟 AVATAR RESCUE OPERATION ──
        if (finalMeta.custom_avatar_url && !isGoogleUrl(finalMeta.custom_avatar_url)) {
            finalMeta.avatar_url = finalMeta.custom_avatar_url;
            finalMeta.custom_avatar_url = null;
            metaNeedsUpdate = true;
        }

        if (dbPoints !== metaPoints) {
            finalMeta.totalPoints = dbPoints;
            metaNeedsUpdate = true;
        }

        const dbCustomAvatar = dbProfile?.avatar_url && !isGoogleUrl(dbProfile.avatar_url) ? dbProfile.avatar_url : null;
        let metaCustomAvatar = finalMeta.avatar_url && !isGoogleUrl(finalMeta.avatar_url) ? finalMeta.avatar_url : null;

        // DB ALWAYS WINS: If DB has a custom avatar, and it doesn't match the JWT,
        // it means the JWT is stale. The DB is the sacred source of truth.
        // We sync the DB's avatar back to the JWT metadata to heal the session permanently.
        if (dbCustomAvatar && metaCustomAvatar !== dbCustomAvatar && !callerAvatarUrl) {
            finalMeta.avatar_url = dbCustomAvatar;
            metaCustomAvatar = dbCustomAvatar;
            metaNeedsUpdate = true;
        }

        if (metaNeedsUpdate) {
            if (finalMeta.custom_avatar_url === null) delete finalMeta.custom_avatar_url;
            const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: finalMeta });
            if (updErr) console.error("updateUserById Failed:", updErr);
        }

        // Final sync into the database safely
        await upsertProfile(user.id, finalMeta, false);

        leaderboardCache.invalidate();
        
        return NextResponse.json({ success: true, meta: finalMeta });
    } catch (err: any) {
        console.error("FATAL ERROR IN SYNC:", err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
