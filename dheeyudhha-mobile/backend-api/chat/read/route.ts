import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const { messageIds } = await req.json();

        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid messageIds' }, { status: 400 });
        }

        // Use supabaseAdmin to bypass RLS and mark these messages as read
        const { error } = await supabaseAdmin
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', messageIds);

        if (error) {
            console.error('[API /chat/read] DB Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[API /chat/read] Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
