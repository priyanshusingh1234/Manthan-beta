import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { messageId, action, newText, emoji } = body;

        if (!messageId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        const { data: msg } = await supabaseAdmin.from('chat_messages').select('*').eq('id', messageId).single();
        if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let rawContent = msg.content;
        let meta: any = {};
        if (rawContent.includes('|||META|||')) {
            const parts = rawContent.split('|||META|||');
            rawContent = parts[0];
            try { meta = JSON.parse(parts[1]); } catch {}
        }

        if (action === 'edit') {
            if (msg.sender_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            if (!newText) return NextResponse.json({ error: 'Missing newText' }, { status: 400 });
            rawContent = newText;
            meta.edited = true;
        } else if (action === 'react') {
            if (!emoji) return NextResponse.json({ error: 'Missing emoji' }, { status: 400 });
            if (!meta.reactions) meta.reactions = {};
            if (!meta.reactions[emoji]) meta.reactions[emoji] = [];
            
            const users = meta.reactions[emoji];
            if (users.includes(user.id)) {
                meta.reactions[emoji] = users.filter((id: string) => id !== user.id);
                if (meta.reactions[emoji].length === 0) delete meta.reactions[emoji];
            } else {
                meta.reactions[emoji].push(user.id);
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newContent = `${rawContent}|||META|||${JSON.stringify(meta)}`;
        
        const { data: updated, error: updErr } = await supabaseAdmin
            .from('chat_messages')
            .update({ content: newContent })
            .eq('id', messageId)
            .select('*')
            .single();

        if (updErr) throw updErr;

        return NextResponse.json({ success: true, message: updated });

    } catch (err: any) {
        console.error('[Chat Action Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
