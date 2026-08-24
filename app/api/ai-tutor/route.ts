import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Ensure this route runs dynamically
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Azure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { 'api-version': '2023-05-15' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

export async function POST(req: Request) {
  try {
    const { messages, questionId, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages' }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }

    // 1. Fetch the question context and teacher explanation
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        title,
        body,
        options,
        hint,
        explanation,
        question_type,
        match_pairs,
        created_by
      `)
      .eq('id', questionId)
      .single();

    if (error || !question) {
      console.error('Error fetching question context:', error);
      return NextResponse.json({ error: 'Failed to retrieve question context' }, { status: 500 });
    }

    // Extract teacher name in a separate query if needed
    let teacherName = 'the teacher';
    if (question.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', question.created_by)
        .single();
      
      if (profile) {
        teacherName = profile.full_name || profile.username || 'the teacher';
      }
    }

    // Build the specific context string based on question type
    let contextData = `Title: ${question.title || 'N/A'}\nBody: ${question.body || 'N/A'}\n`;
    if (question.question_type === 'match' && question.match_pairs) {
      contextData += `Type: Match the following\nCorrect Pairs: ${JSON.stringify(question.match_pairs)}\n`;
    } else if (question.options && Array.isArray(question.options)) {
      contextData += `Options: ${question.options.join(' | ')}\n`;
    }
    contextData += `Teacher's Hint: ${question.hint || 'None provided'}\n`;
    contextData += `Teacher's Private Explanation / Model Answer: ${question.explanation || 'None provided'}`;

    // Fetch user stats if userId is provided
    let userContextStr = "";
    if (userId) {
      try {
        const [authRes, profileRes, followsRes] = await Promise.all([
          supabase.auth.admin.getUserById(userId),
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId)
        ]);

        const userMeta = authRes.data?.user?.user_metadata || {};
        const profileData = profileRes.data || {};
        const name = profileData.full_name || userMeta.fullName || 'Student';
        const points = Math.max(Number(profileData.total_points) || 0, Number(userMeta.totalPoints) || 0);
        const xp = Number(profileData.xp) || Number(userMeta.xp) || 0;
        
        const battlesAttempted = Number(userMeta.battlesAttempted) || 0;
        const battlesWon = Number(userMeta.battlesWon) || 0;
        const winRate = battlesAttempted > 0 ? Math.round((battlesWon / battlesAttempted) * 100) : 0;
        
        const friendsCount = followsRes.count || 0;

        userContextStr = `
# Student Context
- Name: ${name}
- Total Points: ${points}
- XP / Level Progress: ${xp}
- Win Rate: ${winRate}% (${battlesWon} wins / ${battlesAttempted} battles)
- Followers/Friends: ${friendsCount}
- Class/Grade: ${profileData.class_grade || 'Unknown'}

Use this information to personalize your responses. If they ask for their stats, progress, or name, use this data!`;
      } catch (e) {
        console.error('Error fetching user stats:', e);
      }
    }

    // 2. Construct the Socratic Tutor Prompt
    const systemPrompt = `You are the expert, personalized AI Tutor for Dheeyudhha, a competitive educational app.
The student is currently attempting to solve a specific question created by ${teacherName}.
Your job is to guide the student toward the correct answer using the Socratic method.
${userContextStr}

# Question Context
${contextData}

# Guidelines:
1. STRICTLY base your guidance on the Teacher's Private Explanation and Hint. Do not hallucinate logic.
2. DO NOT give away the final answer immediately. Lead them to it step-by-step.
3. Keep responses VERY concise, conversational, and encouraging (max 2-3 short sentences per reply).
4. Personalize your response! Use the student's name occasionally, encourage them based on their win rate or points.
5. If the student asks to track their progress, see their stats, or wants a graph, you MUST output a chart!

# Chart Generation Rule:
You have a special capability to render native UI charts. To show a graph, embed EXACTLY this JSON block format anywhere in your message:
[CHART] {"title": "Your Progress", "data": [{"label": "Wins", "value": 15}, {"label": "Losses", "value": 5}]} [/CHART]
Always ensure the JSON is valid and the array contains 'label' and 'value' (number) keys. Do not use Markdown codeblocks (\`\`\`) inside the [CHART] tags.`;

    // Prepend the system prompt to the user's message history
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    // 3. Request streaming completion from Azure OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!, // Azure OpenAI uses the deployment name instead of model
      messages: apiMessages,
      stream: true,
    });

    // 4. Create a ReadableStream and stream chunks directly
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI Tutor Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
