import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(req.url);
        const questionId = url.searchParams.get('questionId');

        // Fetch user's friends (following)
        const { data: follows } = await supabaseAdmin
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .limit(10);

        let friendIds = follows?.map(f => f.following_id) || [];
        
        let friendsData = [];
        if (friendIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, avatar_url, total_points')
                .in('id', friendIds);
            friendsData = profiles || [];
        }

        // Generate synthetic "live" activities using real friends' names to make the app feel alive
        const activities = [];
        const actions = [
            (name: string) => `🔥 ${name} just hit a new streak!`,
            (name: string) => `⚡ ${name} just earned 15 points!`,
            (name: string) => `⚔️ ${name} is currently online.`,
            (name: string) => `🎯 ${name} is solving questions in the Arena.`,
            (name: string) => `🎓 ${name} completed their Daily Goal!`
        ];

        if (friendsData.length > 0) {
            // Shuffle friends and pick up to 3
            const shuffledFriends = [...friendsData].sort(() => 0.5 - Math.random()).slice(0, 3);
            
            shuffledFriends.forEach((friend, idx) => {
                const name = friend.full_name?.split(' ')[0] || 'A friend';
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                activities.push({
                    id: `act_${Date.now()}_${idx}`,
                    message: randomAction(name),
                    avatar: friend.avatar_url
                });
            });
        } else {
            // Fallback generic activity if they don't follow anyone yet
            activities.push({
                id: `act_${Date.now()}_gen1`,
                message: "🔥 3 students are solving this right now.",
                avatar: null
            });
        }

        // Mock "Friends who solved this" specifically for this question
        let solvedFriends: any[] = [];
        if (questionId && friendsData.length > 0) {
            // Randomly select 0 to 2 friends who "solved" it (for UI purposes)
            const count = Math.floor(Math.random() * 3); 
            solvedFriends = [...friendsData].sort(() => 0.5 - Math.random()).slice(0, count).map(f => ({
                id: f.id,
                name: f.full_name?.split(' ')[0] || 'Friend',
                avatar: f.avatar_url
            }));
        }

        // Mock micro-leaderboard gap
        let leaderboardGap = null;
        if (friendsData.length > 0) {
            const randomFriend = friendsData[Math.floor(Math.random() * friendsData.length)];
            const name = randomFriend.full_name?.split(' ')[0] || 'a friend';
            leaderboardGap = `You are only 15 points behind ${name} today! Keep going!`;
        }

        return NextResponse.json({
            activities,
            solvedFriends,
            leaderboardGap
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
