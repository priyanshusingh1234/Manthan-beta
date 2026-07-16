import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AMBASSADORS = [
    { id: '00000000-0000-0000-0000-000000000001', role: 'brilliant', name: 'Aryan' }, // Aryan: Brilliant student
    { id: '00000000-0000-0000-0000-000000000002', role: 'memer', name: 'Priya' },     // Priya: Memer
    { id: '00000000-0000-0000-0000-000000000003', role: 'mixed', name: 'Kabir' }      // Kabir: Mixed
];
const AMBASSADOR_UUIDS = AMBASSADORS.map(a => a.id);

export async function GET(req: NextRequest) {
    try {
        if (!apiKey) {
            console.error('[Ambassador] No Gemini API key found.');
            return NextResponse.json({ error: 'No API Key configured' }, { status: 500 });
        }

        const client = new GoogleGenAI({ apiKey });
        const debugErrors: any[] = [];
        const results = [];

        // Loop through all ambassadors every time the cron runs
        for (const ambassador of AMBASSADORS) {
            const { data: ambassadorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, avatar_url, username')
                .eq('id', ambassador.id)
                .single();

            if (!ambassadorProfile) continue;

            const ambassadorName = ambassadorProfile.full_name || ambassador.name;

            // --- PHASE 1: Proactive Posting (33% chance per ambassador) ---
            if (Math.random() < 0.33) {
                let postImageUrl = null;
                let prompt = "";

                if (ambassador.role === 'memer') {
                    try {
                        const memeRes = await fetch('https://meme-api.com/gimme/wholesomememes');
                        if (memeRes.ok) {
                            const memeData = await memeRes.json();
                            postImageUrl = memeData.url;
                        }
                    } catch (e) {
                        console.error('[Ambassador] Failed to fetch meme', e);
                    }
                    prompt = `You are Priya, a funny 15-year-old student from India on a social learning app. You are a memer.
You are posting a funny student meme. Write a highly engaging, hilarious short caption for it.
CRITICAL RULE: You MUST write in conversational "Hinglish". Use lots of emojis.
Example: "Maths exam ne rula diya bhai 😭 kya karu?"
Keep it under 2 sentences. Do NOT reveal you are an AI. Do NOT use hashtags.`;
                } else if (ambassador.role === 'brilliant') {
                    prompt = `You are Aryan, a brilliant and smart 15-year-old student from India on a social learning app.
You are asking an engaging academic question to the community based on Indian school syllabus for Classes 6 to 10 (e.g. Science, Maths, or History).
CRITICAL RULE: You MUST write in conversational "Hinglish". Be nerdy but friendly.
Example: "Class 10 waalo, Light chapter me sign convention yaad rakhne ka koi easy trick hai kya? 📚🤓"
Keep it under 2 sentences. Do NOT reveal you are an AI. Do NOT use hashtags.`;
                } else {
                    prompt = `You are Kabir, a chill 15-year-old student from India on a social learning app.
You are sharing a quick piece of general student news or asking a casual lifestyle question.
CRITICAL RULE: You MUST write in conversational "Hinglish".
Example: "Suna hai exams delay ho rahe hain? Ya main bas sapne dekh raha hu? 😂"
Keep it under 2 sentences. Do NOT reveal you are an AI. Do NOT use hashtags.`;
                }

                let postContent = "";
                try {
                    const response = await client.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    });
                    postContent = (response.text || "").trim().replace(/^"|"$/g, '');
                } catch (e: any) {
                    debugErrors.push({ step: 'post_generation', error: e.message, ambassador: ambassador.name });
                }

                if (postContent) {
                    const { error: postError } = await supabaseAdmin
                        .from('posts')
                        .insert({
                            author_id: ambassador.id,
                            content: postContent,
                            image_url: postImageUrl,
                            comments_count: 0
                        });
                    
                    if (postError) debugErrors.push({ step: 'post_insert', error: postError.message });
                    else results.push({ type: 'created_post', ambassador: ambassador.name, content: postContent });
                }
            }

            // --- PHASE 2: Reply to Users (100% chance to check) ---
            // Only fetch posts by THIS specific ambassador
            const { data: myPosts } = await supabaseAdmin
                .from('posts')
                .select('id, content')
                .eq('author_id', ambassador.id)
                .gt('comments_count', 0)
                .order('created_at', { ascending: false })
                .limit(5);

            if (myPosts && myPosts.length > 0) {
                for (const post of myPosts) {
                    const { data: comments } = await supabaseAdmin
                        .from('post_comments')
                        .select('id, content, author_id, created_at')
                        .eq('post_id', post.id)
                        .order('created_at', { ascending: true });

                    if (!comments) continue;

                    const realUserComments = comments.filter(c => !AMBASSADOR_UUIDS.includes(c.author_id));
                    const myReplies = comments.filter(c => c.author_id === ambassador.id);

                    const usersToReply = new Map();
                    for (const comment of realUserComments) {
                        const { data: profile } = await supabaseAdmin.from('profiles').select('username').eq('id', comment.author_id).single();
                        if (!profile || !profile.username) continue;
                        
                        // Fix reply logic: simpler check if ambassador has replied after this comment, or mentioned their username
                        const alreadyReplied = myReplies.some(ac => 
                            ac.content.toLowerCase().includes(profile.username.toLowerCase()) && 
                            new Date(ac.created_at) > new Date(comment.created_at)
                        );
                        
                        if (!alreadyReplied && usersToReply.size < 3) { // limit 3 replies per post per run
                            usersToReply.set(comment.author_id, { comment, username: profile.username });
                        }
                    }

                    for (const [userId, data] of Array.from(usersToReply.entries())) {
                        let prompt = "";
                        if (ambassador.role === 'memer') {
                            prompt = `You are Priya, a funny 15-year-old Indian student. You posted: "${post.content}". A user (@${data.username}) replied: "${data.comment.content}". Write a hilarious 1-sentence reply in Hinglish. Be a memer.`;
                        } else if (ambassador.role === 'brilliant') {
                            prompt = `You are Aryan, a brilliant 15-year-old Indian student. You posted: "${post.content}". A user (@${data.username}) replied: "${data.comment.content}". Write a smart, helpful 1-sentence reply in Hinglish trying to solve their problem or be brilliant.`;
                        } else {
                            prompt = `You are Kabir, a chill 15-year-old Indian student. You posted: "${post.content}". A user (@${data.username}) replied: "${data.comment.content}". Write a friendly 1-sentence reply in Hinglish.`;
                        }
                        prompt += `\nCRITICAL RULE: Keep it to 1 sentence. NEVER say you are an AI. Do NOT use hashtags.`;

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
                            if (!replyContent.toLowerCase().includes(`@${data.username.toLowerCase()}`)) {
                                replyContent = `@${data.username} ${replyContent}`;
                            }

                            const { error: replyError } = await supabaseAdmin
                                .from('post_comments')
                                .insert({ post_id: post.id, author_id: ambassador.id, content: replyContent });

                            if (!replyError) {
                                await supabaseAdmin.from('posts').update({ comments_count: comments.length + 1 }).eq('id', post.id);
                                await createNotification({
                                    userId: userId,
                                    type: 'social_comment',
                                    title: `${ambassadorName} replied to you`,
                                    body: replyContent,
                                    href: `/posts/${post.id}`,
                                    actorId: ambassador.id,
                                    actorName: ambassadorName,
                                    actorAvatar: ambassadorProfile?.avatar_url || undefined,
                                });
                                results.push({ type: 'replied', ambassador: ambassador.name, username: data.username });
                            }
                        }
                    }
                }
            }

            // --- PHASE 3: Comment on Lonely Posts (33% chance per ambassador) ---
            if (Math.random() < 0.33) {
                const { data: lonelyPosts } = await supabaseAdmin
                    .from('posts')
                    .select('id, content, author_id, created_at, comments_count')
                    .eq('comments_count', 0)
                    .order('created_at', { ascending: false })
                    .limit(5); // fetch a few to find one to comment on

                if (lonelyPosts && lonelyPosts.length > 0) {
                    // Find a post not authored by an ambassador
                    const validPost = lonelyPosts.find(p => !AMBASSADOR_UUIDS.includes(p.author_id));
                    if (validPost) {
                        let prompt = "";
                        if (ambassador.role === 'memer') {
                            prompt = `You are Priya, a funny 15-year-old Indian student. Read this post: "${validPost.content}". Write a hilarious 1-sentence comment in Hinglish.`;
                        } else if (ambassador.role === 'brilliant') {
                            prompt = `You are Aryan, a brilliant 15-year-old Indian student. Read this post: "${validPost.content}". Write a helpful 1-sentence comment in Hinglish trying to solve their problem or encourage them to study.`;
                        } else {
                            prompt = `You are Kabir, a chill 15-year-old Indian student. Read this post: "${validPost.content}". Write a friendly 1-sentence comment in Hinglish.`;
                        }
                        prompt += `\nCRITICAL RULE: Keep it to 1 sentence. NEVER say you are an AI.`;

                        let commentContent = "Keep it up 🔥";
                        try {
                            const response = await client.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            });
                            const responseText = (response.text || "").trim().replace(/^"|"$/g, '');
                            if (responseText) commentContent = responseText;
                        } catch (e: any) {
                            debugErrors.push({ step: 'comment_generation', error: e.message });
                        }

                        const { data: comment, error: commentError } = await supabaseAdmin
                            .from('post_comments')
                            .insert({ post_id: validPost.id, author_id: ambassador.id, content: commentContent })
                            .select().single();

                        if (!commentError && comment) {
                            await supabaseAdmin.from('posts').update({ comments_count: (validPost.comments_count || 0) + 1 }).eq('id', validPost.id);
                            await createNotification({
                                userId: validPost.author_id,
                                type: 'social_comment',
                                title: `${ambassadorName} commented on your post`,
                                body: commentContent,
                                href: `/posts/${validPost.id}`,
                                actorId: ambassador.id,
                                actorName: ambassadorName,
                                actorAvatar: ambassadorProfile?.avatar_url || undefined,
                            });
                            results.push({ type: 'commented_lonely', ambassador: ambassador.name });
                        }
                    }
                }
            }
        } // end ambassador loop

        return NextResponse.json({ message: 'Ambassador loop completed', results, debugErrors });
        
    } catch (err: any) {
        console.error('[Ambassador Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
