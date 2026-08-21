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
    const { messages, questionId } = await req.json();

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

    // 2. Construct the Socratic Tutor Prompt
    const systemPrompt = `You are the expert, personalized AI Tutor for Dheeyudhha, a competitive educational app.
The student is currently attempting to solve a specific question created by ${teacherName}.
Your job is to guide the student toward the correct answer using the Socratic method (asking guiding questions).

# Question Context
${contextData}

# Guidelines:
1. STRICTLY base your guidance on the Teacher's Private Explanation and Hint. Do not hallucinate outside chemistry/physics logic if it contradicts the teacher.
2. DO NOT give away the final answer immediately. Lead them to it step-by-step.
3. Keep responses VERY concise, conversational, and encouraging (max 2-3 short sentences per reply).
4. If the student asks for the direct answer, kindly decline and give them a small conceptual hint instead.
5. If the student gets it right in their chat, congratulate them and encourage them to select the right option on their screen.`;

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
      temperature: 0.7,
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
