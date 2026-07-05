import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = auth.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { titles } = await req.json();
        
        if (!Array.isArray(titles) || titles.length > 2) {
            return NextResponse.json({ error: 'Invalid titles array. Maximum 2 allowed.' }, { status: 400 });
        }

        // Fetch current profile to modify cosmetics
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('cosmetics')
            .eq('id', user.id)
            .single();

        if (profileErr) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        let currentCosmetics: string[] = Array.isArray(profile.cosmetics) ? profile.cosmetics : [];

        // Remove old equipped titles
        currentCosmetics = currentCosmetics.filter(c => typeof c !== 'string' || !c.startsWith('equipped_title_'));

        // Add new ones
        titles.forEach((title, index) => {
            currentCosmetics.push(`equipped_title_${index + 1}:${title}`);
        });

        // Update profiles table
        const { error: updateErr } = await supabaseAdmin
            .from('profiles')
            .update({ cosmetics: currentCosmetics })
            .eq('id', user.id);

        if (updateErr) throw updateErr;

        // Also update auth user metadata (just in case it's used there)
        const userMeta = user.user_metadata || {};
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...userMeta,
                cosmetics: currentCosmetics
            }
        });

        return NextResponse.json({ success: true, cosmetics: currentCosmetics });
    } catch (err: any) {
        console.error('[TITLES UPDATE ERROR]', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
