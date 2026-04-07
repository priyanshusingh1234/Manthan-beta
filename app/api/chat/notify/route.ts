import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/createNotification';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { receiverId, senderId, content, roomId } = await req.json();

    if (!receiverId || !roomId || !content || !senderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();

    const realSenderName = profile?.full_name || 'Scholar';

    await createNotification({
      userId: receiverId,
      type: 'chat_message',
      title: `New message from ${realSenderName}`,
      body: content,
      href: `/chat/${roomId}`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
