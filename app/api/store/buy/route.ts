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

        const validItems: Record<string, string> = {
            'avatar_glow': '',
            'banner_cyberpunk': '/banners/cyberpunk.png',
            'banner_library': '/banners/library.png',
            'banner_galactic': '/banners/galactic.png'
        };

        if (!(itemId in validItems)) {
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
        const metaUpdate: any = { ...meta, cosmetics: newCosmetics, totalPoints: newPoints };
        
        // Auto-equip banner
        if (itemId.startsWith('banner_')) {
            metaUpdate.banner_url = validItems[itemId];
            
            // Unequip other banners from cosmetics list to keep it clean (optional, but good)
            metaUpdate.cosmetics = newCosmetics.filter(id => !id.startsWith('banner_') || id === itemId);
        }

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: metaUpdate
        });

        // 2. Update Profile Table
        await supabaseAdmin
            .from('profiles')
            .update({ 
                total_points: newPoints,
                cosmetics: metaUpdate.cosmetics
            })
            .eq('id', user.id);

        return NextResponse.json({ success: true, newPoints, cosmetics: newCosmetics });

    } catch (err: any) {
        console.error('[Store Buy Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
