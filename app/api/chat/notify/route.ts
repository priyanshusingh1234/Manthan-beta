import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/createNotification';

export async function POST(req: Request) {
  try {
    const { receiverId, senderName, content, roomId } = await req.json();

    if (!receiverId || !roomId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await createNotification({
      userId: receiverId,
      type: 'chat_message',
      title: `New message from ${senderName || 'Scholar'}`,
      body: content,
      href: `/chat/${roomId}`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
