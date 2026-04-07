import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { receiverId, senderId, callerName, callerAvatar, callRoom } = await req.json();

    if (!receiverId || !senderId || !callRoom) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the receiver's FCM push tokens
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh_key')
      .eq('user_id', receiverId)
      .eq('p256dh_key', 'native'); // Only native FCM tokens

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, message: 'No native push tokens found' });
    }

    const callUrl = `/call/${callRoom}?caller=${encodeURIComponent(callerName || 'Scholar')}&avatar=${encodeURIComponent(callerAvatar || '')}`;

    const sendPromises = subs.map(async (sub) => {
      if (firebaseAdmin.apps.length > 0) {
        try {
          await firebaseAdmin.messaging().send({
            token: sub.endpoint,
            notification: {
              title: `📞 Incoming Call from ${callerName || 'Scholar'}`,
              body: 'Tap to join the voice call',
            },
            data: {
              url: callUrl,
              href: callUrl,
              type: 'voice_call',
              call_room: callRoom,
              caller_name: callerName || 'Scholar',
              caller_avatar: callerAvatar || '',
              click_action: 'OPEN_APP',
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'default',
                color: '#4f46e5',
                icon: 'ic_notification',
                sound: 'default',
                tag: 'voice_call',
              },
            },
          });
        } catch (fcmErr) {
          console.error('[call-notify] FCM send failed:', fcmErr);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[call-notify] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
