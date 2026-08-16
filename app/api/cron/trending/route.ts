import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/createNotification";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        // Security: Cron job must pass Bearer CRON_SECRET (can test locally with CRON_SECRET from .env)
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch posts from the last 24h that are not trending yet and have > 5 likes
        const { data: posts, error: postsErr } = await supabaseAdmin
            .from('posts')
            .select('id, author_id, likes_count, content')
            .gte('created_at', yesterday)
            .eq('is_trending', false)
            .gt('likes_count', 5);

        if (postsErr) throw postsErr;
        if (!posts || posts.length === 0) {
            return NextResponse.json({ success: true, message: 'No new trending posts' });
        }

        const authorIds = [...new Set(posts.map(p => p.author_id))];

        // 2. Fetch author profiles to get their class_grade
        const { data: profiles, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, class_grade, username')
            .in('id', authorIds);
        
        if (profErr) throw profErr;

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        let notificationsSent = 0;

        for (const post of posts) {
            const author = profileMap.get(post.author_id);
            if (!author || !author.class_grade) continue;

            // 3. Mark post as trending immediately to prevent double notifications
            await supabaseAdmin.from('posts').update({ is_trending: true }).eq('id', post.id);

            // 4. Find all users in the same class_grade (excluding the author)
            const { data: peers, error: peerErr } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('class_grade', author.class_grade)
                .neq('id', author.id)
                .limit(200); // Limit to 200 users for this simple demo system to avoid massive fanout timeouts

            if (peerErr || !peers) continue;

            // 5. Send push notification to peers
            for (const peer of peers) {
                await createNotification({
                    userId: peer.id,
                    type: 'trending_post',
                    title: '🔥 Trending in your Class!',
                    body: `${author.full_name || `@${author.username}`} posted something that's blowing up!`,
                    href: `/posts/${post.id}`,
                    actorId: author.id,
                    actorName: author.full_name || author.username || undefined,
                });
                notificationsSent++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${posts.length} viral posts. Sent ${notificationsSent} notifications.` 
        });

    } catch (error: any) {
        console.error('[Cron Trending] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
