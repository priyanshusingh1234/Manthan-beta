import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Verify the caller's JWT
        const auth = req.headers.get('authorization') || '';
        const token = auth.replace(/^Bearer\s+/i, '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

        const { roomId, content, messageType = 'text' } = await req.json();
        if (!roomId || !content?.trim()) {
            return NextResponse.json({ error: 'Missing roomId or content' }, { status: 400 });
        }

        // Verify the user is a participant in this room
        const { data: participant } = await supabaseAdmin
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!participant) {
            return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
        }

        // Insert via admin — bypasses RLS, always works
        const { data: message, error: insertErr } = await supabaseAdmin
            .from('chat_messages')
            .insert({
                room_id: roomId,
                sender_id: user.id,
                content: content.trim(),
                message_type: messageType,
                is_read: false,
            })
            .select('*')
            .single();

        if (insertErr) {
            console.error('[chat/send] insert error:', insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        return NextResponse.json({ message });
    } catch (e: any) {
        console.error('[chat/send] error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
