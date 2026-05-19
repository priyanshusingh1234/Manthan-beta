import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { messageId } = await req.json();
        if (!messageId) {
            return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
        }

        // Fetch the message
        const { data: msg, error: fetchErr } = await supabaseAdmin
            .from('chat_messages')
            .select('id, content, message_type')
            .eq('id', messageId)
            .single();

        if (fetchErr || !msg) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (msg.message_type !== 'image_once') {
            return NextResponse.json({ error: 'Not a view-once message' }, { status: 400 });
        }

        // Delete from DB
        const { error: delErr } = await supabaseAdmin
            .from('chat_messages')
            .delete()
            .eq('id', messageId);

        if (delErr) {
            return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
        }

        // Try to delete the file from storage
        // Content is the public URL, we need to extract the path
        // e.g. https://.../storage/v1/object/public/avatars/avatars/chat_...
        // The bucket is 'avatars'
        try {
            const urlParts = msg.content.split('/public/avatars/');
            if (urlParts.length > 1) {
                const path = urlParts[1];
                await supabaseAdmin.storage.from('avatars').remove([path]);
            }
        } catch (storageErr) {
            console.error('Failed to delete storage file:', storageErr);
            // Non-fatal
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
