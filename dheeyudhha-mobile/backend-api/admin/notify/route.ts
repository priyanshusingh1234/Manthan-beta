import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
        const adminEmails = ['kpk22128@gmail.com', 's61038955@gmail.com', ...envAdmins];
        const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '');

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { title, message, redirectUrl } = await req.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { data: subs, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('user_id');

        if (error) throw error;

        const uniqueUsers = [...new Set((subs || []).map(s => s.user_id))];
        let sentCount = 0;
        
        const batchSize = 50;
        for (let i = 0; i < uniqueUsers.length; i += batchSize) {
            const batch = uniqueUsers.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(userId => 
                createNotification({
                    userId,
                    type: 'points_earned', // High priority alert style
                    title: title?.trim() || 'Admin Announcement',
                    body: message.trim(),
                    href: redirectUrl?.trim() || '/',
                    actorName: 'Admin'
                })
            ));
            sentCount += batch.length;
        }

        return NextResponse.json({ success: true, sent: sentCount });
    } catch (err: any) {
        console.error('Admin notify error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
