import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

// GET /api/challenges/[id] - Fetch challenge details
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getVerifiedUserId(req.headers.get("authorization"));
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: challenge, error } = await supabaseAdmin
            .from('dynamic_challenges')
            .select(`
                *,
                challenger:profiles!challenger_id(full_name, avatar_url)
            `)
            .eq('id', params.id)
            .single();

        if (error || !challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(challenge);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST /api/challenges/[id] - Accept or Complete
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getVerifiedUserId(req.headers.get("authorization"));
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const bodyText = await req.text();
        let action = '';
        if (bodyText) {
            const body = JSON.parse(bodyText);
            action = body.action;
        }

        if (action === 'accept') {
            const expiresAt = new Date();
            const { data: chal } = await supabaseAdmin.from('dynamic_challenges').select('time_limit_seconds').eq('id', params.id).single();
            if (chal) {
                expiresAt.setSeconds(expiresAt.getSeconds() + chal.time_limit_seconds + 30);
                
                await supabaseAdmin
                    .from('dynamic_challenges')
                    .update({ status: 'accepted', expires_at: expiresAt.toISOString() })
                    .eq('id', params.id)
                    .eq('receiver_id', userId);
            }
            return NextResponse.json({ success: true, expiresAt });
        } 
        
        if (action === 'complete') {
            const { data: chal } = await supabaseAdmin.from('dynamic_challenges').select('*').eq('id', params.id).single();
            if (!chal || chal.status !== 'accepted') return NextResponse.json({ error: "Invalid state" }, { status: 400 });

            const now = new Date();
            const expiresAt = new Date(chal.expires_at);

            if (now > expiresAt) {
                await supabaseAdmin.from('dynamic_challenges').update({ status: 'lost' }).eq('id', params.id);
                return NextResponse.json({ success: false, reason: 'time_expired' });
            }

            const { data: userProfile } = await supabaseAdmin.from('profiles').select('total_points').eq('id', userId).single();
            const currentPoints = Number(userProfile?.total_points) || 0;
            const newPoints = currentPoints + chal.reward_pool;

            await supabaseAdmin.from('profiles').update({ total_points: newPoints }).eq('id', userId);
            
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (authUser?.user) {
                const meta = authUser.user.user_metadata || {};
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: { ...meta, totalPoints: newPoints }
                });
            }

            await supabaseAdmin.from('dynamic_challenges').update({ status: 'won' }).eq('id', params.id);

            await createNotification({
                userId: chal.challenger_id,
                type: 'dynamic_challenge_result',
                title: `Record Broken! 🏆`,
                body: `Your friend beat your hot streak!`,
                href: `/`
            });

            return NextResponse.json({ success: true, reward: chal.reward_pool });
        }

        if (action === 'fail') {
            await supabaseAdmin.from('dynamic_challenges').update({ status: 'lost' }).eq('id', params.id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
