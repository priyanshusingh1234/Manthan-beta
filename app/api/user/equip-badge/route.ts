import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

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

        const { badgeId } = await req.json();

        // 1. Get current metadata
        const meta = user.user_metadata || {};
        const cosmetics = Array.isArray(meta.cosmetics) ? meta.cosmetics : [];

        // 2. Remove any previously equipped badge
        const newCosmetics = cosmetics.filter(c => !c.startsWith('equipped_badge_'));
        
        // 3. Add the new badge if it's not 'none'
        if (badgeId && badgeId !== 'none') {
            newCosmetics.push(`equipped_badge_${badgeId}`);
        }

        // 4. Update auth metadata
        const metaUpdate = { ...meta, cosmetics: newCosmetics };
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: metaUpdate
        });

        // 5. Update profiles table
        await supabaseAdmin
            .from('profiles')
            .update({ cosmetics: newCosmetics })
            .eq('id', user.id);

        return NextResponse.json({ success: true, cosmetics: newCosmetics });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
