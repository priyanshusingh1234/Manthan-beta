import { NextResponse, NextRequest } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';
import { leaderboardCache } from '@/lib/leaderboardCache';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        
        if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Force a sync of the current user's metadata to the profiles table
        await upsertProfile(user.id, user.user_metadata || {});

        // Bust the leaderboard cache so the next request reflects the latest
        // avatar_url, name, etc. without waiting for the TTL to expire.
        leaderboardCache.invalidate();
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
