import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

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
            // Who follows the user: following_id = userId, we want to know follower_id
            queryColumn = 'following_id';
            selectColumn = 'follower_id';
        } else if (type === 'following') {
            // Who the user follows: follower_id = userId, we want to know following_id
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
            return NextResponse.json({ users: [] }); // table might not exist yet
        }

        if (!followsData || followsData.length === 0) {
            return NextResponse.json({ users: [] });
        }

        const targetUserIds = followsData.map((f: any) => f[selectColumn as string]);

        // Get actual users
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError || !authData?.users) {
            return NextResponse.json({ users: [] });
        }

        const matchedUsers = authData.users
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
