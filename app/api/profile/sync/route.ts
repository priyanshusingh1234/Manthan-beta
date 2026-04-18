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

        // Optional: caller can pass avatarUrl directly to bypass the timing race
        // where admin.getUserById might still see old metadata right after auth.updateUser.
        let callerAvatarUrl: string | null = null;
        try {
            const body = await req.json().catch(() => ({}));
            if (body?.avatarUrl && typeof body.avatarUrl === 'string' && !isGoogleUrl(body.avatarUrl)) {
                callerAvatarUrl = body.avatarUrl;
            }
        } catch { /* no body is fine */ }

        // If caller gave us the new URL, write it immediately — no need to wait for auth propagation
        if (callerAvatarUrl) {
            await supabaseAdmin
                .from('profiles')
                .update({ avatar_url: callerAvatarUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            leaderboardCache.invalidate();
        }

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

        // Avatar self-heal: if auth metadata has a newer custom avatar but profiles.avatar_url is stale, restore it.
        const metaCustomAvatar = meta.custom_avatar_url && !isGoogleUrl(meta.custom_avatar_url)
            ? meta.custom_avatar_url : null;
        const dbAvatarIsStale = !dbProfile?.avatar_url || isGoogleUrl(dbProfile?.avatar_url);

        if (metaCustomAvatar && dbAvatarIsStale) {
            await supabaseAdmin
                .from('profiles')
                .update({ avatar_url: metaCustomAvatar })
                .eq('id', user.id);
            finalMeta.custom_avatar_url = metaCustomAvatar;
        }

        // Force a sync of the current user's freshest metadata to the profiles table
        await upsertProfile(user.id, finalMeta);

        // Bust the leaderboard cache so the next request reflects the latest
        leaderboardCache.invalidate();
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
