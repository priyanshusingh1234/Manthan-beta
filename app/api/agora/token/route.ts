import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get('channel');
    const uid = searchParams.get('uid') || '0';

    if (!channelName) {
      return NextResponse.json({ error: 'Missing channel name' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 });
    }

    // Token valid for 1 hour
    const expirationInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parseInt(uid, 10),
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Agora token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
