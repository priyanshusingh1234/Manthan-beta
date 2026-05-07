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
                perPage: 1000,
                page: pageNum,
            });

            if (pageError || !pageData?.users) {
                break;
            }

            allUsers = allUsers.concat(pageData.users);
            hasMore = pageData.users.length === 1000;
            pageNum++;
        }

        const cleanAv = (u?: string | null) => u && !u.includes('googleusercontent.com') ? u : null;
        const matchedUsers = allUsers
            .filter(u => targetUserIds.includes(u.id))
            .map(u => ({
                id: u.id,
                name: u.user_metadata?.fullName || u.user_metadata?.full_name || u.user_metadata?.name || 'User',
                username: u.user_metadata?.username || u.id.slice(0, 8),
                avatar: cleanAv(u.user_metadata?.avatar_url) || cleanAv(u.user_metadata?.avatar_url) || null,
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

    let followingId: string | undefined;
    try {
        const body = await request.json();
        followingId = body?.followingId;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!followingId || followingId === user.id) {
        return NextResponse.json({ error: 'Invalid followingId' }, { status: 400 });
    }

    // Insert follow relationship
    const { error: insertErr } = await supabaseAdmin
        .from('follows')
        .insert({ follower_id: user.id, following_id: followingId });

    if (insertErr && insertErr.code !== '23505') { // 23505 is PostgreSQL for unique_violation
        console.error('[POST /api/follows] DB error:', insertErr);
        return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
    }

    // Only broadcast notification if it was a NEW insert (not a duplicate violation)
    if (!insertErr) {
        // Fire notification to the followed user (fire-and-forget)
        const followerName = user.user_metadata?.fullName || user.user_metadata?.username || 'Someone';
        const followerUsername = user.user_metadata?.username || null;
        const followerAvatar = (() => {
            const m = user.user_metadata || {};
            const u = m.avatar_url || null;
            return (u && !u.includes('googleusercontent.com') ? u : undefined);
        })();

        try {
            await createNotification({
                userId: followingId,
                type: 'new_follower',
                title: `${followerName} started following you`,
                body: `@${followerUsername || 'someone'} is now following you on Dheeyudha.`,
                href: followerUsername ? `/user/${followerUsername}` : undefined,
                actorId: user.id,
                actorName: followerName,
                actorAvatar: followerAvatar,
            });
        } catch (notifyErr) {
            // Follow should still succeed even if notification plumbing fails unexpectedly.
            console.error('[POST /api/follows] Notification error:', notifyErr);
        }
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/follows — remove a follow relationship
export async function DELETE(request: Request) {
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

    let followingId: string | undefined;
    try {
        const body = await request.json();
        followingId = body?.followingId;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!followingId || followingId === user.id) {
        return NextResponse.json({ error: 'Invalid followingId' }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

    if (deleteErr) {
        console.error('[DELETE /api/follows] DB error:', deleteErr);
        return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
