import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// You will need to manually create these 3 users in your Supabase Auth and Profiles table
// Give them names like "Aryan", "Priya", "Kabir" and assign them realistic avatars.
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

        // 1. Fetch recent posts that have very few or 0 comments to keep engagement high
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('posts')
            .select('id, content, author_id, created_at, comments_count')
            .eq('comments_count', 0)
            .order('created_at', { ascending: false })
            .limit(3);

        if (postsError || !posts || posts.length === 0) {
            return NextResponse.json({ message: 'No eligible posts found to engage with.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const results = [];
        const debugErrors: any[] = [];

        for (const post of posts) {
            // Pick a random ambassador
            const randomAmbassadorId = AMBASSADOR_UUIDS[Math.floor(Math.random() * AMBASSADOR_UUIDS.length)];
            
            // Get the ambassador's profile
            const { data: ambassadorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', randomAmbassadorId)
                .single();

            const ambassadorName = ambassadorProfile?.full_name || 'A student';

            // Generate contextual comment using Gemini
            const prompt = `You are a friendly 15-year-old student using a social learning app.
Read the following post from another user and write a short, natural 1-sentence comment. 

Rules:
1. If it's an educational/math/science question: Give a tiny hint or say something relatable about how hard the subject is.
2. If it's a motivational quote: Reply with high energy, hype them up, and use emojis (e.g., 'Let's go!! 🔥').
3. If it's a casual daily life update: Be friendly, ask a casual follow-up question, and act like a real teenager.
4. NEVER reveal you are an AI. 
5. Keep it to one short sentence. Do not use hashtags.

Post Content: "${post.content || 'I love studying!'}"`;

            let commentContent = "That's awesome! Keep it up 🔥";
            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim().replace(/^"|"$/g, '');
                if (responseText) {
                    commentContent = responseText;
                }
            } catch (aiError: any) {
                console.error('[Ambassador AI Error]', aiError);
                debugErrors.push({ step: 'ai_generation', error: aiError.message });
                continue; // Skip this post if AI fails
            }

            // Insert comment into the database
            const { data: comment, error: commentError } = await supabaseAdmin
                .from('post_comments')
                .insert({
                    post_id: post.id,
                    author_id: randomAmbassadorId,
                    content: commentContent
                })
                .select()
                .single();

            if (commentError) {
                 debugErrors.push({ step: 'db_insert', error: commentError.message });
            }

            if (!commentError && comment) {
                // Update comments count on the post
                await supabaseAdmin
                    .from('posts')
                    .update({ comments_count: (post.comments_count || 0) + 1 })
                    .eq('id', post.id);

                // Fetch original author's profile to avoid self-notifications (though ambassador shouldn't be authoring yet)
                if (post.author_id !== randomAmbassadorId) {
                    await createNotification({
                        userId: post.author_id,
                        type: 'social_comment',
                        title: `${ambassadorName} commented on your post`,
                        body: commentContent,
                        href: `/posts/${post.id}`,
                        actorId: randomAmbassadorId,
                        actorName: ambassadorName,
                        actorAvatar: ambassadorProfile?.avatar_url || undefined,
                    });
                }
                
                results.push({ postId: post.id, comment: commentContent });
            }
        }

        return NextResponse.json({ message: 'Ambassador activity completed successfully', results, debugErrors });
    } catch (err: any) {
        console.error('[Ambassador] Fatal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
