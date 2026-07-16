import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AMBASSADOR_UUIDS = [
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
];

export async function GET(req: NextRequest) {
    try {
        if (!apiKey) {
            console.error('[Ambassador] No Gemini API key found.');
            return NextResponse.json({ error: 'No API Key configured' }, { status: 500 });
        }

        const client = new GoogleGenAI({ apiKey });
        const debugErrors: any[] = [];
        const results = [];

        // Randomly pick an active ambassador for this run
        const ambassadorId = AMBASSADOR_UUIDS[Math.floor(Math.random() * AMBASSADOR_UUIDS.length)];
        const { data: ambassadorProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, avatar_url, username')
            .eq('id', ambassadorId)
            .single();

        const ambassadorName = ambassadorProfile?.full_name || 'A student';

        const actionRoll = Math.random();
        
        // --- PHASE 1: Proactive Posting (30% chance) ---
        if (actionRoll < 0.3) {
            const prompt = `You are a friendly, highly engaging 15-year-old student from India on a social learning app.
Create a highly engaging, relatable short text post for the community feed.

CRITICAL RULE: You MUST write in conversational "Hinglish" (a mix of Hindi and English written in the English alphabet).
Make it highly engaging so other students want to comment on it.

Pick ONE of these 3 formats randomly:
1. A relatable student joke/meme text (e.g., "Maths exam ne rula diya bhai 😭 kya karu?")
2. An engaging question to the community (e.g., "Sab log raat me padhte ho ya subah jaldi? Need tips! 📚")
3. A quick piece of student/tech news or hype (e.g., "Suna hai JEE ki dates aane wali hain? 😱")

Do NOT use hashtags. Keep it under 2 sentences. Do NOT reveal you are an AI.`;

            let postContent = "";
            try {
                const response = await client.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                });
                postContent = (response.text || "").trim().replace(/^"|"$/g, '');
            } catch (e: any) {
                debugErrors.push({ step: 'post_generation', error: e.message });
            }

            if (postContent) {
                const { error: postError } = await supabaseAdmin
                    .from('posts')
                    .insert({
                        author_id: ambassadorId,
                        content: postContent,
                        comments_count: 0
                    });
                
                if (postError) debugErrors.push({ step: 'post_insert', error: postError.message });
                else results.push({ type: 'created_post', content: postContent });
                
                return NextResponse.json({ message: 'Ambassador created a post', results, debugErrors });
            }
        }

        // --- PHASE 2: Reply to Users (40% chance) ---
        if (actionRoll >= 0.3 && actionRoll < 0.7) {
            // Find recent posts by ANY ambassador that have comments
            const { data: ambassadorPosts } = await supabaseAdmin
                .from('posts')
                .select('id, content')
                .in('author_id', AMBASSADOR_UUIDS)
                .gt('comments_count', 0)
                .order('created_at', { ascending: false })
                .limit(5);

            if (ambassadorPosts && ambassadorPosts.length > 0) {
                for (const post of ambassadorPosts) {
                    // Fetch comments on this post
                    const { data: comments } = await supabaseAdmin
                        .from('post_comments')
                        .select('id, content, author_id, created_at')
                        .eq('post_id', post.id)
                        .order('created_at', { ascending: true });

                    if (!comments) continue;

                    // Find commenters who are real users (not ambassadors)
                    const realUserComments = comments.filter(c => !AMBASSADOR_UUIDS.includes(c.author_id));
                    const ambassadorComments = comments.filter(c => AMBASSADOR_UUIDS.includes(c.author_id));

                    // Group by user, get up to 5 unique users we haven't replied to
                    const usersToReply = new Map();
                    for (const comment of realUserComments) {
                        // Check if an ambassador already tagged this user in a reply
                        const { data: profile } = await supabaseAdmin.from('profiles').select('username').eq('id', comment.author_id).single();
                        if (!profile || !profile.username) continue;
                        
                        const alreadyReplied = ambassadorComments.some(ac => ac.content.toLowerCase().includes(`@${profile.username.toLowerCase()}`));
                        
                        if (!alreadyReplied && usersToReply.size < 5) {
                            usersToReply.set(comment.author_id, { comment, username: profile.username });
                        }
                    }

                    for (const [userId, data] of Array.from(usersToReply.entries())) {
                        const prompt = `You are a friendly 15-year-old student from India. 
You posted this: "${post.content}"
A student (username: @${data.username}) replied to you with: "${data.comment.content}"

Write a short, engaging 1-sentence reply back to them. 
CRITICAL RULE: You MUST reply in conversational "Hinglish". Use emojis.
NEVER reveal you are an AI.`;

                        let replyContent = "";
                        try {
                            const response = await client.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            });
                            replyContent = (response.text || "").trim().replace(/^"|"$/g, '');
                        } catch (e: any) {
                            debugErrors.push({ step: 'reply_generation', error: e.message });
                        }

                        if (replyContent) {
                            // Ensure the user is tagged
                            if (!replyContent.toLowerCase().includes(`@${data.username.toLowerCase()}`)) {
                                replyContent = `@${data.username} ${replyContent}`;
                            }

                            const { error: replyError } = await supabaseAdmin
                                .from('post_comments')
                                .insert({
                                    post_id: post.id,
                                    author_id: ambassadorId,
                                    content: replyContent
                                });

                            if (!replyError) {
                                await supabaseAdmin.from('posts').update({ comments_count: comments.length + 1 }).eq('id', post.id);
                                
                                await createNotification({
                                    userId: userId,
                                    type: 'social_comment',
                                    title: `${ambassadorName} replied to you`,
                                    body: replyContent,
                                    href: `/posts/${post.id}`,
                                    actorId: ambassadorId,
                                    actorName: ambassadorName,
                                    actorAvatar: ambassadorProfile?.avatar_url || undefined,
                                });
                                results.push({ type: 'replied_to_user', username: data.username, reply: replyContent });
                            }
                        }
                    }
                    if (results.length > 0) return NextResponse.json({ message: 'Ambassador replied to comments', results, debugErrors });
                }
            }
        }

        // --- PHASE 3: Comment on Lonely Posts (Fallback or 30% chance) ---
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('posts')
            .select('id, content, author_id, created_at, comments_count')
            .eq('comments_count', 0)
            .order('created_at', { ascending: false })
            .limit(3);

        if (postsError || !posts || posts.length === 0) {
            return NextResponse.json({ message: 'No eligible lonely posts found.', results, debugErrors });
        }

        for (const post of posts) {
            // Don't comment on other ambassadors' posts here
            if (AMBASSADOR_UUIDS.includes(post.author_id)) continue;

            const prompt = `You are a friendly 15-year-old student from India using a social learning app.
Read the following post from another user and write a short, natural 1-sentence comment. 

CRITICAL RULE: You MUST reply in conversational "Hinglish".
Examples: "Bhai ye toh bohot hard lag raha hai 😭", "Arre tension mat le, ho jayega! 💪", "Sahi baat hai yaar, maths is torture sometimes 😂"

Rules:
1. Be highly engaging and relatable.
2. NEVER reveal you are an AI. 
3. Keep it to one short sentence. Do not use hashtags.

Post Content: "${post.content || 'I love studying!'}"`;

            let commentContent = "That's awesome! Keep it up 🔥";
            try {
                const response = await client.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                });
                const responseText = (response.text || "").trim().replace(/^"|"$/g, '');
                if (responseText) commentContent = responseText;
            } catch (e: any) {
                debugErrors.push({ step: 'comment_generation', error: e.message });
                continue;
            }

            const { data: comment, error: commentError } = await supabaseAdmin
                .from('post_comments')
                .insert({ post_id: post.id, author_id: ambassadorId, content: commentContent })
                .select().single();

            if (!commentError && comment) {
                await supabaseAdmin.from('posts').update({ comments_count: (post.comments_count || 0) + 1 }).eq('id', post.id);
                
                await createNotification({
                    userId: post.author_id,
                    type: 'social_comment',
                    title: `${ambassadorName} commented on your post`,
                    body: commentContent,
                    href: `/posts/${post.id}`,
                    actorId: ambassadorId,
                    actorName: ambassadorName,
                    actorAvatar: ambassadorProfile?.avatar_url || undefined,
                });
                
                results.push({ type: 'commented_on_lonely_post', postId: post.id, comment: commentContent });
            }
        }

        return NextResponse.json({ message: 'Ambassador activity completed successfully', results, debugErrors });
        
    } catch (err: any) {
        console.error('[Ambassador Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
