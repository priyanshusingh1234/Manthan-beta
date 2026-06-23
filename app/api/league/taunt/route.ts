import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: 'Missing target user ID' }, { status: 400 });

    // Validate that the target user is a friend (they follow each other or just we follow them)
    // Actually, we can just allow nudging anyone in your league view.
    
    // Check our points and their points
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, monthly_points, full_name, avatar_url')
      .in('id', [user.id, targetUserId]);

    if (!profiles || profiles.length !== 2) {
      return NextResponse.json({ error: 'Users not found' }, { status: 404 });
    }

    const myProfile = profiles.find(p => p.id === user.id);
    const targetProfile = profiles.find(p => p.id === targetUserId);

    if (!myProfile || !targetProfile) return NextResponse.json({ error: 'Users not found' }, { status: 404 });

    // Ensure we actually have more points than them (optional but logical for a 'taunt' from above)
    // Even if not, it's just a friendly nudge. But let's check.
    if (myProfile.monthly_points <= targetProfile.monthly_points) {
      return NextResponse.json({ error: 'You can only taunt users with fewer points than you!' }, { status: 400 });
    }

    const senderName = myProfile.full_name || 'A friend';
    
    // Send push notification
    await createNotification({
      userId: targetUserId,
      type: 'league_taunt',
      title: `💥 ${senderName} just taunted you!`,
      body: `"${senderName} is leaving you in the dust in the League! Catch up if you can. 💨"`,
      href: '/league',
      actorId: user.id,
      actorName: senderName,
      actorAvatar: myProfile.avatar_url,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
