import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' or 'following'

    if (!userId || !type) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        let queryColumn;
        let selectColumn;

        if (type === 'followers') {
            queryColumn = 'following_id';
            selectColumn = 'follower_id';
        } else if (type === 'following') {
            queryColumn = 'follower_id';
            selectColumn = 'following_id';
        } else {
            return NextResponse.json({ error: 'Invalid type mode' }, { status: 400 });
        }

        const { data: followsData, error: dbError } = await supabaseAdmin
            .from('follows')
            .select(selectColumn)
            .eq(queryColumn, userId);

        if (dbError) {
            console.error(dbError);
            return NextResponse.json({ users: [] });
        }

        if (!followsData || followsData.length === 0) {
            return NextResponse.json({ users: [] });
        }

        const targetUserIds = followsData.map((f: any) => f[selectColumn as string]);

        // Fetch all users with pagination to find matches
        let allUsers: any[] = [];
        let pageNum = 1;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
                pageSize: 1000,
                page: pageNum,
            });

            if (pageError || !pageData?.users) {
                break;
            }

            allUsers = allUsers.concat(pageData.users);
            hasMore = pageData.users.length === 1000;
            pageNum++;
        }

        const matchedUsers = allUsers
            .filter(u => targetUserIds.includes(u.id))
            .map(u => ({
                id: u.id,
                name: u.user_metadata?.fullName || u.user_metadata?.full_name || u.user_metadata?.name || 'User',
                username: u.user_metadata?.username || u.id.slice(0, 8),
                avatar: u.user_metadata?.avatar_url || u.user_metadata?.avatar || null,
                isTeacher: !!u.user_metadata?.isTeacher
            }));

        return NextResponse.json({ users: matchedUsers });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/follows — create a follow + send notification
export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { followingId } = await request.json();
    if (!followingId || followingId === user.id) {
        return NextResponse.json({ error: 'Invalid followingId' }, { status: 400 });
    }

    // Insert follow relationship
    const { error: insertErr } = await supabaseAdmin
        .from('follows')
        .upsert({ follower_id: user.id, following_id: followingId }, { onConflict: 'follower_id,following_id' });

    if (insertErr) {
        console.error('[POST /api/follows]', insertErr);
        return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
    }

    // Fire notification to the followed user (fire-and-forget)
    const followerName = user.user_metadata?.fullName || user.user_metadata?.username || 'Someone';
    const followerUsername = user.user_metadata?.username || null;
    const followerAvatar = user.user_metadata?.avatar_url || null;

    await createNotification({
        userId: followingId,
        type: 'new_follower',
        title: `${followerName} started following you`,
        body: `@${followerUsername || 'someone'} is now following you on Dheeyudha.`,
        href: followerUsername ? `/user/${followerUsername}` : null,
        actorId: user.id,
        actorName: followerName,
        actorAvatar: followerAvatar,
    });

    return NextResponse.json({ success: true });
}
