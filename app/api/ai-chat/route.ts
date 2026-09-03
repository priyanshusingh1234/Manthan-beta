import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import OpenAI from "openai";
import { AI_HELPER_CONTEXT } from "@/lib/aiHelperContext";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { 'api-version': '2023-05-15' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

async function getVerifiedUserId(authHeader?: string | null): Promise<string | null> {
    if (!authHeader) return null;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const userMessage = body.message;

        if (!userMessage) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Fetch User Context
        const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userMeta = userResp?.user?.user_metadata || {};
        
        // Fetch Chat History
        const { data: historyRows } = await supabaseAdmin
            .from("ai_chat_history")
            .select("role, content")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(20);

        const apiMessages: any[] = [];
        const systemInstruction = `${AI_HELPER_CONTEXT}
        
CURRENT USER CONTEXT:
- Name/Username: ${userMeta.full_name || userMeta.username || 'Student'}
- Total Points: ${userMeta.totalPoints || 0}
- Battles Won: ${userMeta.battlesWon || 0}
- Battles Attempted: ${userMeta.battlesAttempted || 0}
`;
        
        apiMessages.push({ role: 'system', content: systemInstruction });

        if (historyRows && historyRows.length > 0) {
            for (const row of historyRows) {
                // OpenAI roles are typically 'user' or 'assistant'. Gemini used 'model'.
                const role = row.role === 'model' ? 'assistant' : 'user';
                apiMessages.push({ role, content: row.content });
            }
        }
        
        apiMessages.push({ role: 'user', content: userMessage });

        // Save User Message to DB immediately
        await supabaseAdmin.from("ai_chat_history").insert({
            user_id: userId,
            role: "user",
            content: userMessage
        }).catch(err => console.error("Failed to save user msg:", err));

        const response = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
            messages: apiMessages,
            temperature: 0.7
        });

        const reply = response.choices[0]?.message?.content || "I'm not sure how to respond to that right now, but keep up the great work!";

        // Save Model Reply to DB (storing role as 'model' to keep consistency with history DB schema)
        await supabaseAdmin.from("ai_chat_history").insert({
            user_id: userId,
            role: "model",
            content: reply
        }).catch(err => console.error("Failed to save model msg:", err));

        return NextResponse.json({ success: true, reply });
    } catch (err: any) {
        console.error("AI Helper Error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization");
        const userId = await getVerifiedUserId(auth);
        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: historyRows, error } = await supabaseAdmin
            .from("ai_chat_history")
            .select("id, role, content, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ success: true, history: historyRows || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
