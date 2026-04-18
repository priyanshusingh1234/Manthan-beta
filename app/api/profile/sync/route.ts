import { NextResponse, NextRequest } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';
import { leaderboardCache } from '@/lib/leaderboardCache';

const isGoogleUrl = (u?: string | null) => !!u && u.includes('googleusercontent.com');

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        
        if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Fetch fresh from the DB to avoid stale JWT metadata
        const { data: freshUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const meta = freshUser?.user?.user_metadata || user.user_metadata || {};

        // Check if there are manual edits in the profiles table that are higher
        const { data: dbProfile } = await supabaseAdmin
            .from('profiles')
            .select('total_points, avatar_url')
            .eq('id', user.id)
            .maybeSingle();
        const dbPoints = Number(dbProfile?.total_points) || 0;
        const metaPoints = Number(meta.totalPoints) || 0;

        let finalMeta = { ...meta };
        if (dbPoints > metaPoints) {
            finalMeta.totalPoints = dbPoints;
            await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: finalMeta });
        }

        // ── Avatar self-heal ──────────────────────────────────────────────────────
        // If auth metadata has a valid custom (non-Google) avatar but profiles.avatar_url
        // was previously wiped to null or a Google URL by a point-sync call, restore it.
        // This self-heals all existing users who were affected by the upsertProfile bug.
        const metaCustomAvatar = meta.custom_avatar_url && !isGoogleUrl(meta.custom_avatar_url)
            ? meta.custom_avatar_url : null;
        const dbAvatarIsStale = !dbProfile?.avatar_url || isGoogleUrl(dbProfile?.avatar_url);

        if (metaCustomAvatar && dbAvatarIsStale) {
            await supabaseAdmin
                .from('profiles')
                .update({ avatar_url: metaCustomAvatar })
                .eq('id', user.id);
            // Carry it into finalMeta so upsertProfile below also has it
            finalMeta.custom_avatar_url = metaCustomAvatar;
        }

        // Force a sync of the current user's freshest metadata to the profiles table
        await upsertProfile(user.id, finalMeta);

        // Bust the leaderboard cache so the next request reflects the latest
        // avatar_url, name, etc. without waiting for the TTL to expire.
        leaderboardCache.invalidate();
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
