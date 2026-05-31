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

export async function GET(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const url = new URL(req.url);
        const chapter = url.searchParams.get('chapter') || 'nationalism';

        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        
        return NextResponse.json({ 
            success: true, 
            unlockedLevel: Number(userMeta[`gauntletLevel_${chapter}`]) || 1 
        });
    } catch (err: any) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { unlockedLevel, chapter = 'nationalism' } = await req.json();

        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};

        const updatedMeta = { ...userMeta, [`gauntletLevel_${chapter}`]: unlockedLevel };
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updatedMeta });

        // Backup to profiles
        await supabaseAdmin.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', userId);

        return NextResponse.json({ success: true, unlockedLevel });
    } catch (err: any) {
        return NextResponse.json({ error: 'Failed to apply progress' }, { status: 500 });
    }
}
