import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { upsertProfile } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { itemId, price } = body;

        if (itemId !== 'avatar_glow') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Check if user has enough points
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('total_points')
            .eq('id', user.id)
            .single();
            
        const currentPoints = profile?.total_points || 0;
        
        if (currentPoints < price) {
            return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
        }

        const meta = user.user_metadata || {};
        const cosmetics = Array.isArray(meta.cosmetics) ? meta.cosmetics : [];
        if (cosmetics.includes(itemId)) {
            return NextResponse.json({ error: 'Already owned' }, { status: 400 });
        }

        // Deduct points & add cosmetic
        const newPoints = currentPoints - price;
        const newCosmetics = [...cosmetics, itemId];

        // 1. Update Auth Metadata
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...meta, cosmetics: newCosmetics, totalPoints: newPoints }
        });

        // 2. Update Profile Table
        await supabaseAdmin
            .from('profiles')
            .update({ total_points: newPoints })
            .eq('id', user.id);

        return NextResponse.json({ success: true, newPoints, cosmetics: newCosmetics });

    } catch (err: any) {
        console.error('[Store Buy Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
