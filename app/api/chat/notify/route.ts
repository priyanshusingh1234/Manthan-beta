import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/createNotification';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { receiverId, senderId, content, roomId } = await req.json();

    if (!receiverId || !roomId || !senderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();

    const realSenderName = profile?.full_name || 'Scholar';
    const isCall = content?.startsWith('📞 Incoming');

    await createNotification({
      userId: receiverId,
      type: isCall ? 'incoming_call' as any : 'chat_message',
      title: isCall ? `${realSenderName} is calling you...` : `New message from ${realSenderName}`,
      body: isCall ? 'Live Call' : (content?.substring(0, 50) || 'New message'),
      href: `/chat/${roomId}`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
