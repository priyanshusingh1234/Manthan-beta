import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/createNotification';
import supabaseAdmin from '@/lib/supabaseAdmin';
export async function POST(req: Request) {
  try {
    const { receiverId, senderId, content, roomId, actorName } = await req.json();

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
    const isCallEnded = content === '__CALL_ENDED__';

    let notifType = 'chat_message';
    let title = `New message from ${realSenderName}`;

    // Strip internal metadata tokens before creating notification body
    let cleanContent = content ? content.replace(/\|\|\|META\|\|\|.*?\|\|\|/g, '').trim() : '';
    
    // Strip any markdown blockquote at the start (e.g., "Replying to", forwarded messages)
    if (cleanContent.startsWith('> ')) {
      const parts = cleanContent.split('\n\n');
      if (parts.length > 1) {
        cleanContent = parts.slice(1).join('\n\n').trim();
      }
    }

    let body = cleanContent.substring(0, 50) || 'New message';
    // Extract call type from content like "📞 Incoming video call"
    let callType: 'voice' | 'video' = 'voice';

    if (isCall) {
      notifType = 'incoming_call';
      title = `${realSenderName} is calling you...`;
      body = 'Tap to answer';
      if (content?.toLowerCase().includes('video')) {
        callType = 'video';
      }
    } else if (isCallEnded) {
      notifType = 'missed_call';
      title = `Missed call from ${realSenderName}`;
      body = 'Call ended';
    }

    await createNotification({
      userId: receiverId,
      type: notifType as any,
      title,
      body,
      href: `/chat/${roomId}`,
      actorName: actorName || realSenderName,  // used as callerName in FCM data
      actorId: senderId,                       // used as callerId in FCM data
      callType: isCall ? callType : undefined,
      callerId: isCall ? senderId : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
