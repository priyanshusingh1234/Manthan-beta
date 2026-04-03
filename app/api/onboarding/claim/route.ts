import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { upsertProfile } from '@/lib/profiles';
import { createNotification } from '@/lib/createNotification';

/**
 * POST /api/onboarding/claim
 * Verifies all onboarding items and awards 10 points.
 */
export async function POST(req: NextRequest) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.user.id;

        // 1. Fetch live profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const ob = profile.onboarding || {};
        
        // 2. Verification check
        if (ob.claimed_bonus) {
            return NextResponse.json({ error: "Bonus already claimed." }, { status: 400 });
        }

        const isComplete = ob.seen_tour && ob.visited_streaks && (profile.daily_solved > 0 || ob.first_solve_checked);
        
        if (!isComplete) {
            return NextResponse.json({ error: "Complete all quests to claim your bonus!" }, { status: 400 });
        }

        // 3. Award 10 Points
        const bonusAmount = 10;
        const newTotal = (Number(profile.total_points) || 0) + bonusAmount;
        ob.claimed_bonus = true;

        // SYNC Auth 
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const meta = user?.user_metadata || {};

        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...meta,
                totalPoints: newTotal,
                onboarding: ob
            }
        });

        // SYNC Profile
        await upsertProfile(userId, {
            ...meta,
            totalPoints: newTotal,
            onboarding: ob
        });

        // 4. Send Celebration Notification
        await createNotification({
            userId: userId,
            type: 'points_earned',
            title: '🎁 Induction Bounty Claimed!',
            body: `Excellent! You've received +10 Bonus points for completing your scholar initiation. Welcome to the elite!`,
            href: '/leaderboard'
        });

        return NextResponse.json({ 
            success: true, 
            pointsAwarded: bonusAmount, 
            newTotal,
            onboarding: ob
        });

    } catch (err: any) {
        console.error('[Onboarding Claim Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
