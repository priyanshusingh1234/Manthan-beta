import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

// GET /api/notifications — fetch notifications for the authenticated user
export async function GET(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- DYNAMIC CHALLENGES QUEUE DISPATCHER ---
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        // Count how many were activated today
        const { count: activeCount } = await supabaseAdmin
            .from('dynamic_challenges')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .gte('activated_at', todayStart.toISOString());
            
        const maxChallengesPerDay = 5;
        const currentActive = activeCount || 0;
        
        if (currentActive < maxChallengesPerDay) {
            const needed = maxChallengesPerDay - currentActive;
            
            // Get queued challenges
            const { data: queuedChallenges } = await supabaseAdmin
                .from('dynamic_challenges')
                .select('id, challenger_id, challenge_type, target_score, time_limit_seconds')
                .eq('receiver_id', user.id)
                .eq('status', 'queued')
                .order('created_at', { ascending: true })
                .limit(needed);
                
            if (queuedChallenges && queuedChallenges.length > 0) {
                const now = new Date().toISOString();
                
                for (const chal of queuedChallenges) {
                    // Mark as active
                    await supabaseAdmin
                        .from('dynamic_challenges')
                        .update({ status: 'active', activated_at: now })
                        .eq('id', chal.id);
                        
                    // Get challenger name
                    const { data: challenger } = await supabaseAdmin
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', chal.challenger_id)
                        .single();
                        
                    const challengerName = challenger?.full_name || 'A friend';
                    
                    // Insert notification and send push
                    await createNotification({
                        userId: user.id,
                        type: 'dynamic_challenge',
                        title: `🔥 New Challenge from ${challengerName}!`,
                        body: `They solved ${chal.target_score} questions in ${Math.floor(chal.time_limit_seconds / 60)}m ${chal.time_limit_seconds % 60}s. Can you beat their time?`,
                        href: `/challenge/${chal.id}`,
                        actorId: chal.challenger_id,
                        actorName: challengerName,
                        actorAvatar: challenger?.avatar_url
                    });
                }
            }
        }
    } catch (e) {
        console.error('[notifications GET] Dispatcher error:', e);
    }
    // ------------------------------------------

    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('[notifications GET]', error);
        return NextResponse.json({ notifications: [] });
    }

    const unreadCount = (data || []).filter(n => !n.read).length;
    return NextResponse.json({ notifications: data || [], unreadCount });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    if (body.notificationId) {
        // Mark single notification as read
        await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('id', body.notificationId)
            .eq('user_id', user.id);
    } else {
        // Mark all as read
        await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/notifications — clear all notifications for the user
export async function DELETE(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

    return NextResponse.json({ success: true });
}
