import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';

/**
 * POST /api/onboarding/update
 * Updates specific onboarding flags for the user.
 */
export async function POST(req: NextRequest) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.user.id;

        const body = await req.json();
        const { flag } = body; // e.g. 'seen_tour', 'visited_streaks', etc.

        if (!flag) return NextResponse.json({ error: "No flag provided" }, { status: 400 });

        // 1. Fetch current profile to get existing onboarding state
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const onboarding = profile.onboarding || {};
        onboarding[flag] = true;

        // 2. Perform Atomic Sync
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const meta = user?.user_metadata || {};

        // Update Auth Metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...meta,
                onboarding: onboarding
            }
        });

        // Update Profile Table
        await upsertProfile(userId, {
            ...meta,
            onboarding: onboarding
        });

        return NextResponse.json({ success: true, onboarding });

    } catch (err: any) {
        console.error('[Onboarding Update Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
