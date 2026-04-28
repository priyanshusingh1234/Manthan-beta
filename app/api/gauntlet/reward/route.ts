import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { xp, points } = await req.json();

        const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (uErr || !userResp?.user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userMeta = userResp.user.user_metadata || {};
        const currentPoints = Number(userMeta.totalPoints) || 0;
        const currentXp = Number(userMeta.xp) || 0;

        const newPoints = currentPoints + (points || 0);
        const newXp = currentXp + (xp || 0);

        const updatedMeta = {
            ...userMeta,
            totalPoints: newPoints,
            xp: newXp
        };

        // Update Metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updatedMeta });

        // Update Profiles Database
        await supabaseAdmin.from('profiles').update({
            total_points: newPoints,
            xp: newXp
        }).eq('id', userId);

        return NextResponse.json({ success: true, newPoints, newXp });
    } catch (err: any) {
        console.error('[GAUNTLET REWARD ERROR]', err);
        return NextResponse.json({ error: 'Failed to apply rewards' }, { status: 500 });
    }
}
